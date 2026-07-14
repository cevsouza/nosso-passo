"use client";
import React, { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// The school portal has been merged into the single role-aware guest portal
// at /therapist. This thin page just forwards visitors (and their ?code=)
// there; a "school" access code lands on the sensory-log view automatically.
function SchoolRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    router.replace('/therapist' + (code ? `?code=${encodeURIComponent(code)}` : ''));
  }, [router, searchParams]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#f7f7fb] text-slate-500 text-sm font-semibold">
      …
    </main>
  );
}

export default function SchoolPortal() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#f7f7fb]" />}>
      <SchoolRedirect />
    </Suspense>
  );
}
