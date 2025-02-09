"use client";

import { PhotoIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { zodResolver } from "@hookform/resolvers/zod";
import imageCompression from "browser-image-compression";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { listingFormSchema } from "~/lib/schemas/tianishop";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";

type FormData = z.infer<typeof listingFormSchema>;

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

async function prepareListingData(values: FormData) {
  // Compress images first
  const compressedImages = await Promise.all(values.images.map(compressImage));

  // Convert compressed images to Uint8Array format
  const processedImages = await Promise.all(
    compressedImages.map(fileToImageInput),
  );

  return {
    title: values.title,
    description: values.description ?? "",
    price: values.price,
    startTime: values.timeType === "unlimited" ? undefined : values.startTime,
    endTime: values.timeType === "unlimited" ? undefined : values.endTime,
    capacity: values.capacity,
    images: processedImages,
  };
}

const NewListingPage = () => {
  const router = useRouter();
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const { mutate: createListing, isPending } =
    api.tianiShop.createListing.useMutation({
      onSuccess: () => {
        router.push("/tianishop");
      },
    });

  const form = useForm<FormData>({
    resolver: zodResolver(listingFormSchema),
    mode: "all",
    shouldUseNativeValidation: true,
    defaultValues: {
      title: "",
      description: "",
      price: 0,
      images: [],
      timeType: "unlimited",
    },
  });

  const { watch } = form;
  const images = watch("images");

  useEffect(() => {
    if (images?.length) {
      const urls = Array.from(images).map((file) => URL.createObjectURL(file));
      setPreviewUrls(urls);
      return () => urls.forEach((url) => URL.revokeObjectURL(url));
    }
  }, [images]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const values = form.getValues();
    void prepareListingData(values)
      .then((listingData) => {
        createListing(listingData);
      })
      .catch((error) => {
        console.error("Error submitting form:", error);
        alert("上傳失敗，請稍後再試");
      });
  };

  return (
    <div className="flex flex-col space-y-4">
      <article className="prose">
        <h1>建立新商品</h1>
      </article>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-control">
          <label className="label">
            <span className="label-text">標題</span>
          </label>
          <input
            type="text"
            placeholder="請輸入商品標題"
            className="validator input input-bordered w-full"
            {...form.register("title")}
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
                form.setValue("images", files, { shouldValidate: true });
              }}
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className={cn("btn btn-outline w-full", {
                "btn-error": form.formState.errors.images,
              })}
            >
              <PhotoIcon className="h-5 w-5" />
              上傳圖片
            </label>
            {form.formState.errors.images && (
              <div className="text-xs text-error">
                {form.formState.errors.images?.message}
              </div>
            )}
            {previewUrls.length > 0 && (
              <div className="carousel carousel-center space-x-2 rounded-box p-2">
                {previewUrls.map((url, index) => (
                  <div key={index} className="carousel-item">
                    <div className="relative h-48 w-48 md:h-64 md:w-64">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`Preview ${index + 1}`}
                        className="h-full w-full rounded-box object-cover"
                      />
                      <button
                        type="button"
                        className="btn btn-circle btn-error btn-sm absolute -right-1 -top-1"
                        onClick={() => {
                          const newFiles = Array.from(
                            form.watch("images") ?? [],
                          ).filter((_, i) => i !== index);
                          form.setValue("images", newFiles, {
                            shouldValidate: true,
                          });
                        }}
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
            {...form.register("description")}
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
            {...form.register("price", { valueAsNumber: true })}
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
                {...form.register("timeType")}
              />
              <span className="label-text">期間限定</span>
            </label>
            <label className="label cursor-pointer gap-2">
              <input
                type="radio"
                className="radio"
                value="unlimited"
                {...form.register("timeType")}
              />
              <span className="label-text">不限時</span>
            </label>
          </div>
        </div>

        {form.watch("timeType") === "limited" && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="form-control">
              <label className="label">
                <span className="label-text">開始時間</span>
              </label>
              <input
                type="datetime-local"
                className="validator input input-bordered w-full"
                {...form.register("startTime", {
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
                {...form.register("endTime", {
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
            {...form.register("capacity", {
              setValueAs: (v: string) => (v === "" ? undefined : parseInt(v)),
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
                <span className="loading loading-spinner"></span>
                處理中...
              </>
            ) : (
              "建立商品"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewListingPage;
