import type { components } from "./schema";

export type Problem = components["schemas"]["Problem"];

export class ApiError extends Error {
  readonly problem: Problem;

  constructor(problem: Problem) {
    super(problem.detail ?? problem.title);
    this.name = "ApiError";
    this.problem = problem;
  }
}

function isProblem(value: unknown): value is Problem {
  return (
    typeof value === "object" &&
    value !== null &&
    "title" in value &&
    typeof value.title === "string" &&
    "status" in value &&
    typeof value.status === "number"
  );
}

interface ApiResult<T, E> {
  data?: T;
  error?: E;
  response: Response;
}

/** Collapse openapi-fetch's `{ data, error }` union into data-or-throw(ApiError). */
export function unwrap<T, E>(result: ApiResult<T, E>): T {
  if (result.data !== undefined) {
    return result.data;
  }
  const problem: Problem = isProblem(result.error)
    ? result.error
    : {
        type: "about:blank",
        title: result.response.statusText || "Request failed",
        status: result.response.status,
      };
  throw new ApiError(problem);
}

export function messageFromError(error: unknown): string {
  if (error instanceof ApiError) {
    return error.problem.detail ?? error.problem.title;
  }
  return "Something went wrong. Please try again.";
}
