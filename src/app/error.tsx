"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/feedback/error-state";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto w-full max-w-lg p-6">
      <ErrorState digest={error.digest} onRetry={retry} />
    </div>
  );
}
