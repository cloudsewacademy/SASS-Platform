/**
 * Generates a short, human-readable order number, e.g. ORD-260831-4F2K
 * Date prefix keeps them roughly sortable and easy to reference on a call.
 */
export function generateOrderNumber(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ORD-${yy}${mm}${dd}-${rand}`;
}
