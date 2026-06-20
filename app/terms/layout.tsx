import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service — TruBill Invoice',
  description: 'Terms of Service for TruBill Invoice, a GST invoicing platform for Tamil Nadu businesses.',
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
