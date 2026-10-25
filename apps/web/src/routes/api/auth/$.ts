import { createServerFileRoute } from "@/lib/server-route";
import { auth } from "../../../../auth";

export const ServerRoute = createServerFileRoute("/api/auth/$").methods({
  GET: ({ request }) => auth.handler(request),
  POST: ({ request }) => auth.handler(request),
});
