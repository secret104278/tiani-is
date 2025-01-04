import AppLayout from "~/app/_components/app-layout";

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <AppLayout>{children}</AppLayout>;
}
