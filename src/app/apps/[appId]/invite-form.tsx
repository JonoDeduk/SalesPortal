"use client";

import { useActionState, useRef, useEffect } from "react";
import { invite } from "./actions";
import { roles } from "@/access-policy";
import type { ActionResult } from "@/admin-action";

const assignableRoles = roles.filter((r) => r !== "admin");

const roleLabels: Record<string, string> = {
  manager: "Manager",
  sales_rep: "Sales Rep",
};

export function InviteForm() {
  const [state, formAction, isPending] = useActionState<
    ActionResult | null,
    FormData
  >(invite, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction}>
      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          alignItems: "flex-end",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <label htmlFor="invite-email" style={{ fontSize: "0.875rem", fontWeight: 500 }}>
            Email
          </label>
          <input
            id="invite-email"
            name="email"
            type="email"
            required
            placeholder="colleague@company.com"
            style={{
              padding: "0.5rem 0.75rem",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              fontSize: "0.875rem",
              minWidth: "240px",
            }}
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <label htmlFor="invite-role" style={{ fontSize: "0.875rem", fontWeight: 500 }}>
            Role
          </label>
          <select
            id="invite-role"
            name="role"
            required
            defaultValue=""
            style={{
              padding: "0.5rem 0.75rem",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              fontSize: "0.875rem",
            }}
          >
            <option value="" disabled>
              Select role
            </option>
            {assignableRoles.map((role) => (
              <option key={role} value={role}>
                {roleLabels[role] ?? role}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={isPending}
          style={{
            padding: "0.5rem 1.25rem",
            background: isPending ? "#9ca3af" : "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontSize: "0.875rem",
            fontWeight: 500,
            cursor: isPending ? "not-allowed" : "pointer",
          }}
        >
          {isPending ? "Sending..." : "Invite"}
        </button>
      </div>
      {state?.ok === true && (
        <p style={{ color: "#16a34a", marginTop: "0.5rem", fontSize: "0.875rem" }}>
          Invitation sent successfully.
        </p>
      )}
      {state?.ok === false && (
        <p style={{ color: "#dc2626", marginTop: "0.5rem", fontSize: "0.875rem" }}>
          {state.error}
        </p>
      )}
    </form>
  );
}
