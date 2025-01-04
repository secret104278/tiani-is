import AppLayout from "~/app/_components/app-layout";

export default async function SignInLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <AppLayout>{children}</AppLayout>;
}
