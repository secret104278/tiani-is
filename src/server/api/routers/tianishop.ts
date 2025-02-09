import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { listingRouter } from "./tianishop/listing";

export const tianiShopRouter = createTRPCRouter({
  listing: listingRouter,

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

  getListing: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const listing = await ctx.db.tianiShopListing.findUnique({
        where: { id: input.id },
        include: {
          images: {
            orderBy: { order: "asc" },
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
          message: "Listing not found",
        });
      }

      return listing;
    }),

  getCart: protectedProcedure.query(async ({ ctx }) => {
    const cart = await ctx.db.tianiShopCart.findFirst({
      where: {
        userId: ctx.session.user.id,
        status: "ACTIVE",
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

    return cart;
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
      });

      if (!listing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Listing not found",
        });
      }

      // Check if listing has started
      if (listing.startTime && listing.startTime > new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Listing has not started yet",
        });
      }

      // Check if listing has ended
      if (listing.endTime && listing.endTime < new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Listing has ended",
        });
      }

      // Check capacity if it exists
      if (listing.capacity !== null) {
        // Get current total quantity in active carts
        const activeCartItems = await ctx.db.tianiShopCartItem.findMany({
          where: {
            listingId: input.listingId,
            cart: {
              status: "ACTIVE",
            },
          },
        });

        const totalQuantityInCarts = activeCartItems.reduce(
          (sum: number, item) => sum + item.quantity,
          0,
        );

        if (totalQuantityInCarts + input.quantity > listing.capacity) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Not enough quantity available",
          });
        }
      }

      // Get or create active cart
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
      const cartItem = await ctx.db.tianiShopCartItem.create({
        data: {
          cartId: cart.id,
          listingId: input.listingId,
          quantity: input.quantity,
        },
      });

      return cartItem;
    }),

  removeFromCart: protectedProcedure
    .input(z.object({ cartItemId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const cartItem = await ctx.db.tianiShopCartItem.findUnique({
        where: { id: input.cartItemId },
        include: {
          cart: true,
        },
      });

      if (!cartItem) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Cart item not found",
        });
      }

      if (cartItem.cart.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to modify this cart",
        });
      }

      await ctx.db.tianiShopCartItem.delete({
        where: { id: input.cartItemId },
      });

      return cartItem;
    }),

  updateCartItemQuantity: protectedProcedure
    .input(
      z.object({
        cartItemId: z.number(),
        quantity: z.number().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const cartItem = await ctx.db.tianiShopCartItem.findUnique({
        where: { id: input.cartItemId },
        include: {
          cart: true,
          listing: true,
        },
      });

      if (!cartItem) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Cart item not found",
        });
      }

      if (cartItem.cart.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to modify this cart",
        });
      }

      // Check capacity if it exists
      if (cartItem.listing.capacity !== null) {
        const activeCartItems = await ctx.db.tianiShopCartItem.findMany({
          where: {
            listingId: cartItem.listingId,
            cart: {
              status: "ACTIVE",
            },
            NOT: {
              id: cartItem.id, // Exclude current item
            },
          },
        });

        const totalQuantityInOtherCarts = activeCartItems.reduce(
          (sum: number, item) => sum + item.quantity,
          0,
        );

        if (
          totalQuantityInOtherCarts + input.quantity >
          cartItem.listing.capacity
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Not enough quantity available",
          });
        }
      }

      const updatedCartItem = await ctx.db.tianiShopCartItem.update({
        where: { id: input.cartItemId },
        data: { quantity: input.quantity },
      });

      return updatedCartItem;
    }),

  checkout: protectedProcedure
    .input(z.object({ cartId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Get cart with items
      const cart = await ctx.db.tianiShopCart.findUnique({
        where: {
          id: input.cartId,
          userId: ctx.session.user.id,
          status: "ACTIVE",
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
          message: "Cart not found",
        });
      }

      if (cart.items.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cart is empty",
        });
      }

      // Check if all items are still available
      for (const item of cart.items) {
        const listing = item.listing;

        // Check if listing has started
        if (listing.startTime && listing.startTime > new Date()) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `${listing.title} has not started yet`,
          });
        }

        // Check if listing has ended
        if (listing.endTime && listing.endTime < new Date()) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `${listing.title} has ended`,
          });
        }

        // Check capacity if it exists
        if (listing.capacity !== null) {
          const activeCartItems = await ctx.db.tianiShopCartItem.findMany({
            where: {
              listingId: listing.id,
              cart: {
                status: "ACTIVE",
              },
              NOT: {
                id: item.id, // Exclude current item
              },
            },
          });

          const totalQuantityInOtherCarts = activeCartItems.reduce(
            (sum: number, item) => sum + item.quantity,
            0,
          );

          if (totalQuantityInOtherCarts + item.quantity > listing.capacity) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Not enough quantity available for ${listing.title}`,
            });
          }
        }
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

      // Update cart status
      await ctx.db.tianiShopCart.update({
        where: { id: cart.id },
        data: { status: "ORDERED" },
      });

      return order;
    }),
});
