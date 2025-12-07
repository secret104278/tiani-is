import { TRPCError } from "@trpc/server";
import { put } from "@vercel/blob";
import sharp from "sharp";
import { rgbaToThumbHash } from "thumbhash";
import type { Prisma, PrismaClient } from "~/prisma-client";

interface ImageInput {
  data: Uint8Array;
  type: string;
  name: string;
}

export async function generateThumbhash(buffer: Buffer) {
  const { data, info } = await sharp(buffer)
    .resize(100, 100, { fit: "contain" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  return Buffer.from(rgbaToThumbHash(info.width, info.height, data)).toString(
    "base64",
  );
}

export async function processImage(image: ImageInput, index: number) {
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

export async function validateListingAvailability({
  listing,
  requestedQuantity,
  db,
  excludeCartItemId,
}: {
  listing: {
    id: number;
    title: string;
    startTime: Date | null;
    endTime: Date | null;
    capacity: number | null;
  };
  requestedQuantity: number;
  db: PrismaClient | Prisma.TransactionClient;
  excludeCartItemId?: number;
}) {
  // Check if listing has started
  if (listing.startTime && listing.startTime > new Date()) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `${listing.title} 尚未開始販售`,
    });
  }

  // Check if listing has ended
  if (listing.endTime && listing.endTime < new Date()) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `${listing.title} 已結束販售`,
    });
  }

  // Check capacity if it exists
  if (listing.capacity !== null) {
    // Get all cart items for this listing
    const cartItems = await db.tianiShopCartItem.findMany({
      where: {
        listingId: listing.id,
        ...(excludeCartItemId
          ? {
              NOT: {
                id: excludeCartItemId,
              },
            }
          : {}),
      },
    });

    // Get all non-cancelled ordered items for this listing
    const orderedItems = await db.tianiShopOrderItem.findMany({
      where: {
        listingId: listing.id,
        status: {
          not: "CANCELLED",
        },
      },
    });

    // Calculate total quantity in carts and orders
    const totalQuantityInCarts = cartItems.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );
    const totalQuantityInOrders = orderedItems.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );

    if (
      totalQuantityInCarts + totalQuantityInOrders + requestedQuantity >
      listing.capacity
    ) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `${listing.title} 數量不足`,
      });
    }
  }
}

export async function getOrCreateCart({
  userId,
  db,
}: {
  userId: string;
  db: PrismaClient;
}) {
  let cart = await db.tianiShopCart.findUnique({
    where: {
      userId,
    },
  });

  if (!cart) {
    cart = await db.tianiShopCart.create({
      data: {
        userId,
      },
    });
  }

  return cart;
}

export type OrderStatus = "PENDING" | "COMPLETED" | "CANCELLED";

export function calculateOrderStatus(items: { status: string }[]): OrderStatus {
  const allItemsCancelled = items.every((item) => item.status === "CANCELLED");
  const allNonCancelledItemsCompleted = items
    .filter((item) => item.status !== "CANCELLED")
    .every((item) => item.status === "COMPLETED");
  const hasNonCancelledItems = items.some(
    (item) => item.status !== "CANCELLED",
  );

  let orderStatus: OrderStatus = "PENDING";
  if (allItemsCancelled || !hasNonCancelledItems) {
    orderStatus = "CANCELLED";
  } else if (allNonCancelledItemsCompleted) {
    orderStatus = "COMPLETED";
  }

  return orderStatus;
}
