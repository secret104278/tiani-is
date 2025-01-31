import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { listingSchema } from "~/shared/schemas/tianishop";

export const listingRouter = createTRPCRouter({
  createListing: protectedProcedure
    .input(listingSchema)
    .mutation(async ({ ctx, input }) => {
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
            create: input.images,
          },
        },
      });
    }),
});
