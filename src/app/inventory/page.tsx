"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function InventoryRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/procurement");
  }, [router]);

  return null;
}
