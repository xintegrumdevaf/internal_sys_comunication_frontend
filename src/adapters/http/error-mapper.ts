import { DomainError } from "@/core/shared/domain/errors";

export function errorToHttp(error: unknown): Response {
  if (error instanceof DomainError) {
    const status =
      error.code === "NOT_FOUND"
        ? 404
        : error.code === "FORBIDDEN"
          ? 403
          : error.code === "CONFLICT"
            ? 409
            : 400;
    return Response.json({ error: error.message, code: error.code }, { status });
  }
  console.error(error);
  return Response.json({ error: "Internal server error", code: "INTERNAL" }, { status: 500 });
}
