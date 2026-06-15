import type { Metadata } from "next";
import { PRODUCT_NAME } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Sign in · ${PRODUCT_NAME}`,
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
