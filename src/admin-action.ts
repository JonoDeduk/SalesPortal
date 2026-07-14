import { requireRole } from "./auth.js";

export type ActionResult = { ok: true } | { ok: false; error: string };

export function adminAction(
  fn: (formData: FormData) => Promise<ActionResult>,
): (prev: ActionResult | null, formData: FormData) => Promise<ActionResult> {
  return async (_prev, formData) => {
    await requireRole("admin");
    return fn(formData);
  };
}
