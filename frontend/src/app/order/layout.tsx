import CustomerPwaBlocker from '@/components/pwa/CustomerPwaBlocker';

export default function OrderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <CustomerPwaBlocker />
      {children}
    </>
  );
}

