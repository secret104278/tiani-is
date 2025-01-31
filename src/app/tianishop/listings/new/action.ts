"use server";

import { put } from "@vercel/blob";
import sharp from "sharp";
import { rgbaToThumbHash } from "thumbhash";
import { auth } from "~/server/auth";
import { api } from "~/trpc/server";

async function generateThumbhash(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const { data, info } = await sharp(buffer)
    .resize(100, 100, { fit: "contain" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  return Buffer.from(rgbaToThumbHash(info.width, info.height, data)).toString(
    "base64",
  );
}

export async function createListing(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const price = Number(formData.get("price"));
  const startTime = new Date(formData.get("startTime") as string);
  const endTime = new Date(formData.get("endTime") as string);
  const capacity = formData.get("capacity")
    ? Number(formData.get("capacity"))
    : undefined;
  const files = formData.getAll("images") as File[];

  // Upload images in parallel and generate thumbhashes
  const images = await Promise.all(
    files.map(async (file, index) => {
      const [blob, thumbhash] = await Promise.all([
        put(file.name, file, {
          access: "public",
        }),
        generateThumbhash(file),
      ]);

      return {
        key: blob.url,
        thumbhash,
        order: index,
      };
    }),
  );

  // Create listing with tRPC
  await api.tianiShop.createListing({
    title,
    description,
    price,
    startTime,
    endTime,
    capacity,
    images,
  });
}
