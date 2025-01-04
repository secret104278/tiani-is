import { AuthError } from "next-auth";
import Image from "next/image";
import { redirect } from "next/navigation";
import { auth, signIn } from "~/server/auth";
import { providerMap } from "~/server/auth/config";

const SIGNIN_ERROR_URL = "/signin";

export default async function SignInPage(props: {
  searchParams: Promise<{ callbackUrl: string | undefined }>;
}) {
  const session = await auth();
  if (session) {
    redirect((await props.searchParams).callbackUrl ?? "/");
  }

  return (
    <div className="container mx-auto">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body mx-auto flex flex-col items-center text-center">
          <h2 className="card-title">登入</h2>
          {Object.values(providerMap).map((provider) => (
            <form
              key={provider.id}
              action={async () => {
                "use server";
                try {
                  await signIn(provider.id, {
                    redirectTo: (await props.searchParams).callbackUrl ?? "/",
                  });
                } catch (error) {
                  if (error instanceof AuthError) {
                    return redirect(`${SIGNIN_ERROR_URL}?error=${error.type}`);
                  }
                  throw error;
                }
              }}
            >
              <button
                type="submit"
                className="btn w-full bg-[#00C300] text-[#fff] hover:bg-[#00C300]"
              >
                <Image
                  style={{ display: "block" }}
                  alt={provider.name.toLowerCase()}
                  height={32}
                  width={32}
                  src="https://authjs.dev/img/providers/line.svg"
                />
                <span>透過 {provider.name} 登入</span>
              </button>
            </form>
          ))}
        </div>
      </div>
    </div>
  );
}
