import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import {
  genericStatusFailure,
  getClientIp,
  qaRateLimitKey,
  REQUIRE_EMAIL_FOR_STATUS_CHECK,
  statusRequestSchema,
  ticketRateLimitKey,
} from "@/lib/qa/public";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type StatusResponse =
  | {
      ok: true;
      success: true;
      status: "pending" | "draft" | "answered" | "archived";
      answer: string | null;
    }
  | typeof genericStatusFailure
  | { ok: false; success: false; error: string };

function noStoreJson(
  body: StatusResponse,
  init?: ResponseInit
): NextResponse<StatusResponse> {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function POST(request: Request): Promise<NextResponse<StatusResponse>> {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return noStoreJson(genericStatusFailure, { status: 404 });
  }

  const parsed = statusRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return noStoreJson(genericStatusFailure, { status: 404 });
  }

  const clientIp = getClientIp(request);
  const [ipAllowed, ticketAllowed] = await Promise.all([
    checkRateLimit(qaRateLimitKey("status", clientIp), 10, 60 * 60),
    checkRateLimit(ticketRateLimitKey(parsed.data.ticketId), 5, 60 * 60),
  ]);

  if (!ipAllowed || !ticketAllowed) {
    return noStoreJson(
      { ok: false, success: false, error: "Too many attempts. Please try again later." },
      { status: 429 }
    );
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("questions")
    .select("status,answer,email")
    .eq("ticket_id", parsed.data.ticketId)
    .maybeSingle();

  if (error || !data) {
    return noStoreJson(genericStatusFailure, { status: 404 });
  }

  if (
    REQUIRE_EMAIL_FOR_STATUS_CHECK &&
    data.email &&
    data.email.toLowerCase() !== parsed.data.email
  ) {
    return noStoreJson(genericStatusFailure, { status: 404 });
  }

  return noStoreJson({
    ok: true,
    success: true,
    status: data.status,
    answer: data.status === "answered" ? data.answer : null,
  });
}
