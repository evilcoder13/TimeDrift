import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthError } from "./guards";
import { RuleViolationError } from "./rules";
import { ApiError } from "./errors";

export { ApiError };

export type RouteHandler<TContext = any> = (
  req: Request,
  context?: TContext
) => Promise<Response>;

export function handler<TContext = any>(
  fn: RouteHandler<TContext>
): (req: Request, context?: TContext) => Promise<Response> {
  return async (req: Request, context?: TContext) => {
    try {
      return await fn(req, context);
    } catch (err: unknown) {
      if (err instanceof AuthError) {
        return NextResponse.json(
          { error: { code: err.code, message: err.message } },
          { status: err.statusCode }
        );
      }

      if (err instanceof RuleViolationError) {
        return NextResponse.json(err.toResponse(), { status: err.statusCode });
      }

      if (err instanceof ApiError) {
        return NextResponse.json(
          {
            error: {
              code: err.code,
              message: err.message,
              ...(err.details ? { details: err.details } : {}),
            },
          },
          { status: err.statusCode }
        );
      }

      if (err instanceof ZodError) {
        return NextResponse.json(
          {
            error: {
              code: "VALIDATION",
              message: err.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", "),
              details: err.flatten(),
            },
          },
          { status: 400 }
        );
      }

      console.error("[Unhandled API Error]:", err);
      return NextResponse.json(
        {
          error: {
            code: "INTERNAL_ERROR",
            message: err instanceof Error ? err.message : "Internal server error",
          },
        },
        { status: 500 }
      );
    }
  };
}
