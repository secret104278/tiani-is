"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertWarning } from "~/components/utils/Alert";
import Dialog from "~/components/utils/Dialog";
import { api } from "~/trpc/react";

export function DeleteListingButton({ listingId }: { listingId: number }) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const router = useRouter();

  const deleteMutation = api.tianiShop.deleteListing.useMutation({
    onSuccess: () => {
      setShowDeleteDialog(false);
      router.refresh();
    },
  });

  return (
    <>
      <button
        className="btn btn-error btn-sm"
        onClick={(e) => {
          e.preventDefault();
          setShowDeleteDialog(true);
        }}
      >
        刪除
      </button>

      <Dialog
        title="確認刪除商品"
        show={showDeleteDialog}
        closeModal={() => setShowDeleteDialog(false)}
      >
        <div className="space-y-4">
          <p>確定要刪除此商品嗎？此動作無法復原。</p>

          {deleteMutation.error && (
            <AlertWarning>
              刪除失敗：{deleteMutation.error.message}
            </AlertWarning>
          )}

          <div className="flex justify-end gap-2">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setShowDeleteDialog(false)}
            >
              取消
            </button>
            <button
              className="btn btn-error btn-sm"
              onClick={() => deleteMutation.mutate({ listingId })}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "刪除中..." : "確認刪除"}
            </button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
