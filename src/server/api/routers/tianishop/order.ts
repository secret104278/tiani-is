import { TRPCError } from "@trpc/server";
import Decimal from "decimal.js";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../../trpc";
import { validateListingAvailability } from "./utils";

export const orderRouter = createTRPCRouter({
  getOrder: protectedProcedure
    .input(
      z.object({
        id: z.number(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const order = await ctx.db.tianiShopOrder.findUnique({
        where: {
          id: input.id,
        },
        include: {
          items: {
            include: {
              snapshot: true,
              listing: {
                select: {
                  publisherId: true,
                },
              },
            },
          },
          user: {
            select: {
              name: true,
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

      if (order.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "無權限查看此訂單",
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
      return await ctx.db.$transaction(
        async (tx) => {
          // Get cart with items and lock the related listings
          const cart = await tx.tianiShopCart.findUnique({
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

          // Lock all listings involved in this transaction
          await Promise.all(
            cart.items.map((item) =>
              tx.tianiShopListing.findUniqueOrThrow({
                where: { id: item.listing.id },
              }),
            ),
          );

          // Check if all items are still available
          for (const item of cart.items) {
            await validateListingAvailability({
              listing: item.listing,
              requestedQuantity: item.quantity,
              db: tx,
              excludeCartItemId: item.id,
            });
          }

          // Calculate totals
          const subtotal = cart.items.reduce(
            (sum, item) => item.listing.price.times(item.quantity).add(sum),
            new Decimal(0),
          );

          // Create order with snapshots
          const order = await tx.tianiShopOrder.create({
            data: {
              userId: ctx.session.user.id,
              subtotal,
              total: subtotal, // No adjustments for now
              items: {
                create: await Promise.all(
                  cart.items.map(async (item) => {
                    // Create snapshot
                    const snapshot = await tx.tianiShopOrderItemSnapshot.create(
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
                      subtotal: item.listing.price.times(item.quantity),
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
          await tx.tianiShopCartItem.deleteMany({
            where: { cartId: cart.id },
          });

          return order;
        },
        {
          timeout: 10000, // 10 second timeout
          isolationLevel: "Serializable", // Highest isolation level
        },
      );
    }),

  cancelOrder: protectedProcedure
    .input(z.object({ orderId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const order = await ctx.db.tianiShopOrder.findUnique({
        where: {
          id: input.orderId,
          userId: ctx.session.user.id,
        },
        include: {
          items: true,
        },
      });

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "訂單不存在",
        });
      }

      // Check if all items are already cancelled
      const allItemsCancelled = order.items.every(
        (item) => item.status === "CANCELLED",
      );
      if (allItemsCancelled) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "訂單已取消",
        });
      }

      // Cancel all pending items
      await ctx.db.tianiShopOrderItem.updateMany({
        where: {
          orderId: input.orderId,
          status: "PENDING",
        },
        data: {
          status: "CANCELLED",
        },
      });

      return order;
    }),

  getMyListingOrders: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.tianiShopOrder.findMany({
      where: {
        items: {
          some: {
            listing: {
              publisherId: ctx.session.user.id,
            },
          },
        },
      },
      include: {
        items: {
          include: {
            snapshot: true,
            listing: {
              select: {
                publisherId: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }),

  completeOrderItem: protectedProcedure
    .input(
      z.object({
        orderItemId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const orderItem = await ctx.db.tianiShopOrderItem.findUnique({
        where: {
          id: input.orderItemId,
        },
        include: {
          listing: true,
        },
      });

      if (!orderItem) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "訂單項目不存在",
        });
      }

      if (orderItem.listing.publisherId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "無權限完成此訂單項目",
        });
      }

      if (orderItem.status !== "PENDING") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "此訂單項目已完成或已取消",
        });
      }

      return ctx.db.tianiShopOrderItem.update({
        where: {
          id: input.orderItemId,
        },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });
    }),

  cancelOrderItem: protectedProcedure
    .input(
      z.object({
        orderItemId: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const orderItem = await ctx.db.tianiShopOrderItem.findUnique({
        where: {
          id: input.orderItemId,
        },
        include: {
          order: true,
        },
      });

      if (!orderItem) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "訂單項目不存在",
        });
      }

      if (orderItem.order.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "無權限取消此訂單項目",
        });
      }

      if (orderItem.status !== "PENDING") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "此訂單項目已完成或已取消",
        });
      }

      return ctx.db.tianiShopOrderItem.update({
        where: {
          id: input.orderItemId,
        },
        data: {
          status: "CANCELLED",
        },
      });
    }),
});
