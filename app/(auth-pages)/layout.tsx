export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-4xl flex flex-col gap-12 items-center w-full py-8">
      {children}
    </div>
  );
}
