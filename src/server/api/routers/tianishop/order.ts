import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { validateListingAvailability } from "./utils";

export const orderRouter = createTRPCRouter({
  getOrder: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const order = await ctx.db.tianiShopOrder.findUnique({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
        include: {
          items: {
            include: {
              snapshot: true,
            },
          },
        },
      });

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "訂單不存在",
        });
      }

      return order;
    }),

  getMyOrders: protectedProcedure.query(async ({ ctx }) => {
    const orders = await ctx.db.tianiShopOrder.findMany({
      where: {
        userId: ctx.session.user.id,
      },
      include: {
        items: {
          include: {
            snapshot: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return orders;
  }),

  checkout: protectedProcedure
    .input(z.object({ cartId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Get cart with items
      const cart = await ctx.db.tianiShopCart.findUnique({
        where: {
          id: input.cartId,
          userId: ctx.session.user.id,
        },
        include: {
          items: {
            include: {
              listing: {
                include: {
                  images: {
                    take: 1,
                    orderBy: { order: "asc" },
                  },
                },
              },
            },
          },
        },
      });

      if (!cart) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "購物車不存在",
        });
      }

      if (cart.items.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "購物車是空的",
        });
      }

      // Check if all items are still available
      for (const item of cart.items) {
        await validateListingAvailability({
          listing: item.listing,
          requestedQuantity: item.quantity,
          db: ctx.db,
          excludeCartItemId: item.id,
        });
      }

      // Calculate totals
      const subtotal = cart.items.reduce(
        (sum, item) => sum + item.quantity * item.listing.price,
        0,
      );

      // Create order with snapshots
      const order = await ctx.db.tianiShopOrder.create({
        data: {
          userId: ctx.session.user.id,
          subtotal,
          total: subtotal, // No adjustments for now
          items: {
            create: await Promise.all(
              cart.items.map(async (item) => {
                // Create snapshot
                const snapshot = await ctx.db.tianiShopOrderItemSnapshot.create(
                  {
                    data: {
                      title: item.listing.title,
                      description: item.listing.description,
                      price: item.listing.price,
                      imageKey: item.listing.images[0]?.key,
                      thumbhash: item.listing.images[0]?.thumbhash,
                    },
                  },
                );

                return {
                  listingId: item.listing.id,
                  quantity: item.quantity,
                  subtotal: item.quantity * item.listing.price,
                  snapshotId: snapshot.id,
                };
              }),
            ),
          },
        },
        include: {
          items: {
            include: {
              snapshot: true,
            },
          },
        },
      });

      // Delete all cart items
      await ctx.db.tianiShopCartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return order;
    }),
});
