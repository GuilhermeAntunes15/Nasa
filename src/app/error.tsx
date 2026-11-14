"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section aria-labelledby="error-title" className="flex flex-col items-start gap-3">
      <h1 id="error-title" className="text-2xl font-semibold">
        Something went wrong
      </h1>
      <p>This page could not be displayed. Your farm settings are kept in the address bar.</p>
      <Button onClick={() => retry()}>Try again</Button>
    </section>
  );
}
