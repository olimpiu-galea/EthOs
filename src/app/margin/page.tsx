"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MarginRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/financial");
  }, [router]);

  return null;
}
