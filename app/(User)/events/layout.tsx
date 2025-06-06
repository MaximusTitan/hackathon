import RazorpayScript from "@/components/RazorpayScript";

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <RazorpayScript />
      {children}
    </>
  );
}
