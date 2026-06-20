import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — TruBill Invoice',
  description: 'Privacy policy for TruBill Invoice, a GST invoicing platform for Tamil Nadu businesses.',
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
