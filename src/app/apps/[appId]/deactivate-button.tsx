"use client";

import { useActionState } from "react";
import { deactivate } from "./actions";
import type { ActionResult } from "@/admin-action";

export function DeactivateButton({ userId }: { userId: string }) {
  const [state, formAction, isPending] = useActionState<
    ActionResult | null,
    FormData
  >(deactivate, null);

  if (state?.ok) {
    return (
      <span style={{ color: "#16a34a", fontSize: "0.875rem" }}>Deactivated</span>
    );
  }

  return (
    <form action={formAction} style={{ display: "inline" }}>
      <input type="hidden" name="userId" value={userId} />
      <button
        type="submit"
        disabled={isPending}
        style={{
          padding: "0.25rem 0.75rem",
          background: "transparent",
          color: isPending ? "#9ca3af" : "#dc2626",
          border: "1px solid currentColor",
          borderRadius: "4px",
          fontSize: "0.8125rem",
          cursor: isPending ? "not-allowed" : "pointer",
        }}
      >
        {isPending ? "Deactivating..." : "Deactivate"}
      </button>
      {state?.ok === false && (
        <span style={{ color: "#dc2626", fontSize: "0.8125rem", marginLeft: "0.5rem" }}>
          {state.error}
        </span>
      )}
    </form>
  );
}
