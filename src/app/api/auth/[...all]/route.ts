import { getAuth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const GET = (request: Request) => {
  const handler = toNextJsHandler(getAuth());
  return handler.GET(request);
};

export const POST = (request: Request) => {
  const handler = toNextJsHandler(getAuth());
  return handler.POST(request);
};
