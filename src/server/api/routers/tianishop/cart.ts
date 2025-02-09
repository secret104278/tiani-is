import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { getOrCreateCart, validateListingAvailability } from "./utils";

export const cartRouter = createTRPCRouter({
  getCartItemCount: protectedProcedure.query(async ({ ctx }) => {
    const cart = await ctx.db.tianiShopCart.findUnique({
      where: {
        userId: ctx.session.user.id,
      },
      include: {
        items: true,
      },
    });

    if (!cart) return 0;

    // Sum up all quantities in the cart
    return cart.items.reduce((sum, item) => sum + item.quantity, 0);
  }),

  getCart: protectedProcedure.query(async ({ ctx }) => {
    const cart = await ctx.db.tianiShopCart.findUnique({
      where: {
        userId: ctx.session.user.id,
      },
      include: {
        items: {
          orderBy: [
            { createdAt: "asc" }, // First added items first
            { id: "asc" }, // Then by ID for stable ordering
          ],
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
          message: "商品不存在",
        });
      }

      await validateListingAvailability({
        listing,
        requestedQuantity: input.quantity,
        db: ctx.db,
      });

      // Get or create cart
      const cart = await getOrCreateCart({
        userId: ctx.session.user.id,
        db: ctx.db,
      });

      // Add item to cart
      return ctx.db.tianiShopCartItem.create({
        data: {
          cartId: cart.id,
          listingId: input.listingId,
          quantity: input.quantity,
        },
      });
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
          message: "購物車項目不存在",
        });
      }

      if (cartItem.cart.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "無權限修改此購物車",
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
          message: "購物車項目不存在",
        });
      }

      if (cartItem.cart.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "無權限修改此購物車",
        });
      }

      await validateListingAvailability({
        listing: cartItem.listing,
        requestedQuantity: input.quantity,
        db: ctx.db,
        excludeCartItemId: cartItem.id,
      });

      return ctx.db.tianiShopCartItem.update({
        where: { id: input.cartItemId },
        data: { quantity: input.quantity },
      });
    }),
});
