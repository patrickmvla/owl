/**
 * RFC 7807 Problem Details error factory.
 * ADR-004: "Structured errors with type, title, status, detail, and instance."
 */
export function problemDetails(
  status: number,
  title: string,
  detail: string,
  type?: string,
) {
  return {
    type: type ?? `https://owl.dev/errors/${title.toLowerCase().replace(/\s+/g, "-")}`,
    title,
    status,
    detail,
  };
}

/** Common error responses */
export const errors = {
  unauthorized: () =>
    problemDetails(401, "Unauthorized", "Authentication required"),
  forbidden: () =>
    problemDetails(403, "Forbidden", "You do not have access to this resource"),
  notFound: (resource = "Resource") =>
    problemDetails(404, "Not Found", `${resource} not found`),
  validation: (detail: string) =>
    problemDetails(400, "Validation Error", detail),
} as const;
