import Link from "next/link";
import { useSiteContext } from "~/context/SiteContext";

export default function NotFoundPage() {
  const { site } = useSiteContext();

  return (
    <div className="hero">
      <div className="hero-content text-center">
        <div className="max-w-md">
          <h1 className="text-5xl font-bold">錯誤</h1>
          <p className="py-6">找不到相關的訊息</p>
          <Link href={`/${site}`}>
            <button className="btn btn-primary">回首頁</button>
          </Link>
        </div>
      </div>
    </div>
  );
}
