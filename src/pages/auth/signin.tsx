import { getProviders, signIn, useSession } from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/router";
import { AlertWarning } from "~/components/utils/Alert";
import { useSiteContext } from "~/context/SiteContext";

export default function SinginPage({
  providers,
}: {
  providers: Awaited<ReturnType<typeof getProviders>>;
}) {
  const lineProvider = providers!.line;
  const router = useRouter();
  const { site } = useSiteContext();

  const { status: authStatus } = useSession();
  if (authStatus === "authenticated") {
    void router.push(`/${site}`);
  }

  const error = router.query.error && "無法進行登入";

  return (
    <div className="container mx-auto">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body mx-auto flex flex-col items-center text-center">
          <h2 className="card-title">登入</h2>
          {error && <AlertWarning>{error}</AlertWarning>}
          <button
            className="btn w-full bg-[#00C300] text-[#fff] hover:bg-[#00C300]"
            onClick={() =>
              void signIn(lineProvider.id, {
                callbackUrl: router.query.callbackUrl as string,
              })
            }
          >
            <Image
              style={{ display: "block" }}
              alt="line"
              height={32}
              width={32}
              src="https://authjs.dev/img/providers/line.svg"
            />
            透過 {lineProvider.name} 登入
          </button>
        </div>
      </div>
    </div>
  );
}

export async function getServerSideProps() {
  const providers = await getProviders();

  return {
    props: { providers: providers ?? {} },
  };
}
