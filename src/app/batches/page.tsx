"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function BatchesRedirectInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const q = searchParams.toString();
    router.replace(q ? `/operational?${q}` : "/operational");
  }, [router, searchParams]);

  return null;
}

export default function BatchesRedirectPage() {
  return (
    <Suspense fallback={null}>
      <BatchesRedirectInner />
    </Suspense>
  );
}
