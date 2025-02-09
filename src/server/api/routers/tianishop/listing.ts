import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { listingApiSchema } from "~/lib/schemas/tianishop";
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
});
