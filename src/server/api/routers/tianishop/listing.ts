import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { listingApiSchema, zodDecimalPrice } from "~/lib/schemas/tianishop";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { processImage } from "./utils";

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
              image: true,
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
    .input(listingApiSchema)
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

  getMyListings: protectedProcedure.query(async ({ ctx }) => {
    const listings = await ctx.db.tianiShopListing.findMany({
      where: {
        publisherId: ctx.session.user.id,
      },
      include: {
        images: {
          orderBy: {
            order: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return listings;
  }),

  deleteListing: protectedProcedure
    .input(z.object({ listingId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const listing = await ctx.db.tianiShopListing.findUnique({
        where: { id: input.listingId },
      });

      if (!listing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "商品不存在",
        });
      }

      if (listing.publisherId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "無權限刪除此商品",
        });
      }

      return ctx.db.tianiShopListing.delete({
        where: { id: input.listingId },
      });
    }),

  updateListing: protectedProcedure
    .input(
      z.object({
        listingId: z.number(),
        title: z.string(),
        description: z.string(),
        price: zodDecimalPrice(),
        startTime: z.date().optional(),
        endTime: z.date().optional(),
        capacity: z.number().min(1).optional(),
        imageUpdates: z.array(
          z.discriminatedUnion("type", [
            z.object({
              type: z.literal("existing"),
              key: z.string(),
              order: z.number(),
            }),
            z.object({
              type: z.literal("new"),
              order: z.number(),
              image: z.object({
                data: z.instanceof(Uint8Array),
                type: z.string(),
                name: z.string(),
              }),
            }),
          ]),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const listing = await ctx.db.tianiShopListing.findUnique({
        where: { id: input.listingId },
        include: {
          images: true,
        },
      });

      if (!listing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "商品不存在",
        });
      }

      if (listing.publisherId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "無權限編輯此商品",
        });
      }

      // Process new images
      const newImageUpdates = input.imageUpdates.filter(
        (update): update is Extract<typeof update, { type: "new" }> =>
          update.type === "new",
      );
      const processedNewImages = await Promise.all(
        newImageUpdates.map((update) =>
          processImage(update.image, update.order),
        ),
      );

      // Get existing image updates
      const existingImageUpdates = input.imageUpdates.filter(
        (update): update is Extract<typeof update, { type: "existing" }> =>
          update.type === "existing",
      );

      // Find images to delete (images not in existingImageUpdates)
      const imagesToDelete = listing.images.filter(
        (image) =>
          !existingImageUpdates.some((update) => update.key === image.key),
      );

      // Update listing with all changes in a single transaction
      return ctx.db.tianiShopListing.update({
        where: { id: input.listingId },
        data: {
          title: input.title,
          description: input.description,
          price: input.price,
          startTime: input.startTime,
          endTime: input.endTime,
          capacity: input.capacity,
          images: {
            deleteMany: {
              key: {
                in: imagesToDelete.map((img) => img.key),
              },
            },
            updateMany: existingImageUpdates.map((update) => ({
              where: { key: update.key },
              data: { order: update.order },
            })),
            create: processedNewImages,
          },
        },
        include: {
          images: {
            orderBy: {
              order: "asc",
            },
          },
        },
      });
    }),
});
