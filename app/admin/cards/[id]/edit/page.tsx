"use client";

import { useParams } from "next/navigation";
import useSWR from "swr";
import { ProfileEditor } from "@/components/admin/editor/profile-editor";
import { LinkButton } from "@/components/ui/button";
import { ErrorState, Skeleton } from "@/components/ui/feedback";
import { errorMessage } from "@/lib/api";
import type { CardDetail } from "@/lib/types";

export default function EditCardPage() {
  const { id } = useParams<{ id: string }>();
  // Load once: the editor owns the document from here, so background
  // revalidation must not overwrite unsaved edits.
  const { data, error, mutate } = useSWR<CardDetail>(`/admin/cards/${id}`, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    revalidateOnReconnect: false,
  });

  if (error) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center">
        <ErrorState message={errorMessage(error)} onRetry={() => mutate()} />
        <LinkButton href="/admin/cards" size="sm">
          Back to cards
        </LinkButton>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-dvh flex-col">
        <div className="flex h-14 items-center gap-3 border-b border-line bg-surface px-4">
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="flex flex-1">
          <div className="flex-1 space-y-4 p-6">
            <Skeleton className="h-10 w-full max-w-xl" />
            <Skeleton className="h-64 w-full max-w-3xl" />
          </div>
          <div className="hidden w-[480px] items-start justify-center bg-surface-2 pt-12 lg:flex">
            <Skeleton className="h-[720px] w-[375px] rounded-[2.25rem]" />
          </div>
        </div>
      </div>
    );
  }

  return <ProfileEditor key={data.id} card={data} onCardChange={(c) => void mutate(c, { revalidate: false })} />;
}
