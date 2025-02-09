import { TRPCError } from "@trpc/server";
import { put } from "@vercel/blob";
import sharp from "sharp";
import { rgbaToThumbHash } from "thumbhash";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

interface ImageInput {
  data: Uint8Array;
  type: string;
  name: string;
}

const createListingInputSchema = z
  .object({
    title: z.string().min(1, "請輸入標題"),
    description: z.string().optional(),
    price: z.number().min(0, "價格必須大於零"),
    startTime: z.date(),
    endTime: z.date(),
    capacity: z.number().int().min(1).optional(),
    images: z.array(
      z.object({
        data: z.instanceof(Uint8Array),
        type: z.string(),
        name: z.string(),
      }),
    ),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: "結束時間必須在開始時間之後",
    path: ["endTime"],
  });

async function generateThumbhash(buffer: Buffer) {
  const { data, info } = await sharp(buffer)
    .resize(100, 100, { fit: "contain" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  return Buffer.from(rgbaToThumbHash(info.width, info.height, data)).toString(
    "base64",
  );
}

async function processImage(image: ImageInput, index: number) {
  const buffer = Buffer.from(image.data);
  const timestamp = Date.now();
  const uniqueFilename = `${timestamp}-${index}-${image.name}`;

  const [blob, thumbhash] = await Promise.all([
    put(uniqueFilename, buffer, {
      access: "public",
      contentType: image.type,
    }),
    generateThumbhash(buffer),
  ]);

  return {
    key: blob.url,
    thumbhash,
    order: index,
  };
}

export const listingRouter = createTRPCRouter({
  getAllListingsInfinite: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).nullish(),
        cursor: z.number().nullish(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const limit = input.limit ?? 50;
      const cursor = input.cursor;

      const items = await ctx.db.tianiShopListing.findMany({
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          images: {
            orderBy: {
              order: "asc",
            },
          },
          publisher: {
            select: {
              name: true,
              image: true,
            },
          },
        },
        where: {
          OR: [
            {
              endTime: {
                gte: new Date(),
              },
            },
            {
              endTime: null,
            },
          ],
        },
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (items.length > limit) {
        const nextItem = items.pop();
        nextCursor = nextItem!.id;
      }

      return {
        items,
        nextCursor,
      };
    }),

  getListing: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const listing = await ctx.db.tianiShopListing.findUnique({
        where: { id: input.id },
        include: {
          images: {
            orderBy: {
              order: "asc",
            },
          },
          publisher: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!listing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "商品不存在",
        });
      }

      return listing;
    }),

  createListing: protectedProcedure
    .input(createListingInputSchema)
    .mutation(async ({ ctx, input }) => {
      // Process all images in parallel
      const processedImages = await Promise.all(
        input.images.map((file, index) => processImage(file, index)),
      );

      // Create listing with processed images
      return ctx.db.tianiShopListing.create({
        data: {
          title: input.title,
          description: input.description,
          price: input.price,
          startTime: input.startTime,
          endTime: input.endTime,
          capacity: input.capacity,
          publisherId: ctx.session.user.id,
          images: {
            create: processedImages,
          },
        },
      });
    }),

  addToCart: protectedProcedure
    .input(
      z.object({
        listingId: z.number(),
        quantity: z.number().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Get the listing to check availability
      const listing = await ctx.db.tianiShopListing.findUnique({
        where: { id: input.listingId },
        include: {
          _count: {
            select: {
              orderItems: true,
            },
          },
        },
      });

      if (!listing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "商品不存在",
        });
      }

      // Check if listing has started
      if (listing.startTime && listing.startTime > new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "商品尚未開始販售",
        });
      }

      // Check if listing has ended
      if (listing.endTime && listing.endTime < new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "商品已結束販售",
        });
      }

      // Check capacity
      if (
        listing.capacity &&
        listing._count.orderItems + input.quantity > listing.capacity
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "商品數量不足",
        });
      }

      // Get or create cart
      let cart = await ctx.db.tianiShopCart.findFirst({
        where: {
          userId: ctx.session.user.id,
          status: "ACTIVE",
        },
      });

      if (!cart) {
        cart = await ctx.db.tianiShopCart.create({
          data: {
            userId: ctx.session.user.id,
            status: "ACTIVE",
          },
        });
      }

      // Add item to cart
      return ctx.db.tianiShopCartItem.create({
        data: {
          cartId: cart.id,
          listingId: input.listingId,
          quantity: input.quantity,
        },
      });
    }),
});
