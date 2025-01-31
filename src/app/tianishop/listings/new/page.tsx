"use client";

import { PhotoIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { zodResolver } from "@hookform/resolvers/zod";
import Form from "next/form";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { cn } from "~/lib/utils";
import { createListing } from "./action";

// Using constants that are safe for database storage
const MIN_DATE = new Date("1970-01-01T00:00:00.000Z");
const MAX_DATE = new Date("9999-12-31T23:59:59.999Z");

const formSchema = z.object({
  title: z.string().min(1, "請輸入標題"),
  description: z.string().optional(),
  price: z.number().min(0, "價格必須大於零"),
  timeType: z.enum(["limited", "unlimited"]),
  startTime: z.date().optional(),
  endTime: z.date().optional(),
  capacity: z.number().int().min(1).optional(),
  images: z.array(z.instanceof(File)).min(1, "請至少上傳一張圖片"),
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateListingPage() {
  const router = useRouter();
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
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

  return (
    <div className="flex flex-col space-y-4">
      <article className="prose">
        <h1>建立新商品</h1>
      </article>

      <Form
        action={async (formData: FormData) => {
          const isValid = await form.trigger();
          if (!isValid) {
            return;
          }
          const values = form.getValues();
          console.log(values);
          formData.set(
            "startTime",
            values.timeType === "unlimited"
              ? MIN_DATE.toISOString()
              : (values.startTime?.toISOString() ?? ""),
          );
          formData.set(
            "endTime",
            values.timeType === "unlimited"
              ? MAX_DATE.toISOString()
              : (values.endTime?.toISOString() ?? ""),
          );
          await createListing(formData);
        }}
        className="space-y-4"
      >
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
          <button type="submit" className="btn btn-primary">
            建立商品
          </button>
        </div>
      </Form>
    </div>
  );
}
