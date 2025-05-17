"use client";

import { PhotoIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { zodResolver } from "@hookform/resolvers/zod";
import imageCompression from "browser-image-compression";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { AlertWarning } from "~/components/utils/Alert";
import { listingFormSchema } from "~/lib/schemas/tianishop";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";
import type { RouterOutputs } from "~/trpc/shared";

type FormData = z.infer<typeof listingFormSchema>;
type Listing = RouterOutputs["tianiShop"]["getListing"];

interface ImageItem {
  type: "existing" | "new";
  file?: File;
  url?: string;
  key?: string;
}

const compressionOptions = {
  maxSizeMB: 0.1,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  fileType: "image/jpeg",
};

async function compressImage(file: File) {
  try {
    const compressedFile = await imageCompression(file, compressionOptions);
    // Create a new File object with a unique name to avoid cache issues
    return new File([compressedFile], `${Date.now()}-${file.name}`, {
      type: compressedFile.type,
    });
  } catch (error) {
    console.error("Image compression failed:", error);
    return file; // Return original file if compression fails
  }
}

async function fileToImageInput(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  return {
    data: new Uint8Array(arrayBuffer),
    type: file.type,
    name: file.name,
  };
}

export function ListingForm({
  mode = "create",
  initialData,
}: {
  mode?: "create" | "edit";
  initialData?: Listing;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<ImageItem[]>(() => {
    if (mode === "edit" && initialData?.images) {
      return initialData.images.map((image) => ({
        type: "existing",
        key: image.key,
      }));
    }
    return [];
  });

  const createMutation = api.tianiShop.createListing.useMutation({
    onSuccess: () => {
      router.push("/tianishop/my/listings");
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const updateMutation = api.tianiShop.updateListing.useMutation({
    onSuccess: () => {
      router.push("/tianishop/my/listings");
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const form = useForm<FormData>({
    resolver: zodResolver(listingFormSchema),
    mode: "all",
    shouldUseNativeValidation: true,
    defaultValues: initialData
      ? {
          title: initialData.title,
          description: initialData.description ?? "",
          price: initialData.price,
          images: [],
          timeType: initialData.startTime ? "limited" : "unlimited",
          startTime: initialData.startTime ?? undefined,
          endTime: initialData.endTime ?? undefined,
          capacity: initialData.capacity ?? undefined,
        }
      : {
          title: "",
          description: "",
          price: 0,
          images: [],
          timeType: "unlimited",
        },
  });

  const { register, formState, watch, getValues } = form;

  useEffect(() => {
    // Create object URLs for new images
    const newImageUrls = images
      .filter((img) => img.type === "new" && img.file)
      .map((img) => URL.createObjectURL(img.file!));

    return () => {
      // Clean up object URLs
      for (const url of newImageUrls) {
        URL.revokeObjectURL(url);
      }
    };
  }, [images]);

  const handleAddImages = (files: File[]) => {
    const newImages = files.map((file) => ({
      type: "new" as const,
      file,
      url: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...newImages]);
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => {
      const newImages = [...prev];
      const removed = newImages.splice(index, 1)[0];
      if (removed?.type === "new" && removed.url) {
        URL.revokeObjectURL(removed.url);
      }
      return newImages;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const values = getValues();

    try {
      // Process new images
      const newImages = images
        .filter(
          (img): img is ImageItem & { type: "new"; file: File } =>
            img.type === "new" && !!img.file,
        )
        .map((img) => img.file);

      // Prepare new images data
      const processedNewImages = await Promise.all(
        newImages.map(async (file) => {
          const compressed = await compressImage(file);
          return fileToImageInput(compressed);
        }),
      );

      // Prepare image updates in the order they appear in the UI
      const imageUpdates = await Promise.all(
        images.map(async (img, index) => {
          if (img.type === "existing" && img.key) {
            return {
              type: "existing" as const,
              key: img.key,
              order: index,
            };
          }
          if (img.type === "new" && img.file) {
            const compressed = await compressImage(img.file);
            const imageData = await fileToImageInput(compressed);
            return {
              type: "new" as const,
              order: index,
              image: imageData,
            };
          }
          throw new Error("Invalid image data");
        }),
      );

      if (mode === "edit" && initialData) {
        updateMutation.mutate({
          listingId: initialData.id,
          title: values.title,
          description: values.description ?? "",
          price: values.price,
          startTime:
            values.timeType === "unlimited" ? undefined : values.startTime,
          endTime: values.timeType === "unlimited" ? undefined : values.endTime,
          capacity: values.capacity,
          imageUpdates,
        });
      } else {
        // For create, we only need to process new images
        createMutation.mutate({
          title: values.title,
          description: values.description ?? "",
          price: values.price,
          startTime:
            values.timeType === "unlimited" ? undefined : values.startTime,
          endTime: values.timeType === "unlimited" ? undefined : values.endTime,
          capacity: values.capacity,
          images: processedNewImages,
        });
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setError("處理圖片時發生錯誤，請稍後再試");
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="flex flex-col space-y-4">
      {error && <AlertWarning>{error}</AlertWarning>}

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <div className="form-control">
          <label className="label">
            <span className="label-text">標題</span>
          </label>
          <input
            type="text"
            placeholder="請輸入商品標題"
            className="validator input input-bordered w-full"
            {...register("title")}
          />
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">商品圖片</span>
          </label>
          <div className="flex flex-col gap-2">
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                handleAddImages(files);
              }}
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className={cn("btn btn-outline w-full", {
                "btn-error": formState.errors.images,
              })}
            >
              <PhotoIcon className="h-5 w-5" />
              上傳圖片
            </label>
            {formState.errors.images && (
              <div className="text-error text-xs">
                {formState.errors.images?.message}
              </div>
            )}

            {/* Show all images (both existing and new) */}
            {images.length > 0 && (
              <div className="carousel carousel-center space-x-2 rounded-box p-2">
                {images.map((image, index) => (
                  <div key={index} className="carousel-item">
                    <div className="relative h-48 w-48 md:h-64 md:w-64">
                      {image.type === "existing" ? (
                        <Image
                          src={image.key!}
                          alt={`Image ${index + 1}`}
                          fill
                          className="rounded-box object-cover"
                        />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={image.url}
                          alt={`Preview ${index + 1}`}
                          className="h-full w-full rounded-box object-cover"
                        />
                      )}
                      <button
                        type="button"
                        className="btn btn-circle btn-error btn-sm -right-1 -top-1 absolute"
                        onClick={() => handleRemoveImage(index)}
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">描述</span>
          </label>
          <textarea
            placeholder="請輸入商品描述"
            className="validator textarea textarea-bordered h-24 w-full"
            {...register("description")}
          />
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">價格</span>
          </label>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            step="0.01"
            placeholder="請輸入價格"
            className="validator input input-bordered w-full"
            {...register("price", { valueAsNumber: true })}
          />
          <label className="label">
            <span className="label-text-alt">0表示免費</span>
          </label>
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">販售時間</span>
          </label>
          <div className="flex gap-4">
            <label className="label cursor-pointer gap-2">
              <input
                type="radio"
                className="radio"
                value="limited"
                {...register("timeType")}
              />
              <span className="label-text">期間限定</span>
            </label>
            <label className="label cursor-pointer gap-2">
              <input
                type="radio"
                className="radio"
                value="unlimited"
                {...register("timeType")}
              />
              <span className="label-text">不限時</span>
            </label>
          </div>
        </div>

        {watch("timeType") === "limited" && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="form-control">
              <label className="label">
                <span className="label-text">開始時間</span>
              </label>
              <input
                type="datetime-local"
                className="validator input input-bordered w-full"
                {...register("startTime", {
                  valueAsDate: true,
                })}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">結束時間</span>
              </label>
              <input
                type="datetime-local"
                className="validator input input-bordered w-full"
                {...register("endTime", {
                  valueAsDate: true,
                })}
              />
            </div>
          </div>
        )}

        <div className="form-control">
          <label className="label">
            <span className="label-text">數量上限（選填）</span>
          </label>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            placeholder="請輸入數量上限"
            className="validator input input-bordered w-full"
            {...register("capacity", {
              setValueAs: (v: string) =>
                v === "" ? undefined : Number.parseInt(v),
            })}
          />
          <label className="label">
            <span className="label-text-alt">留空表示無限制</span>
          </label>
        </div>
        <div className="card-actions justify-end">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <span className="loading loading-spinner" />
                處理中...
              </>
            ) : mode === "edit" ? (
              "更新商品"
            ) : (
              "建立商品"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
