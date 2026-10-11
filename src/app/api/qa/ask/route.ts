import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import {
  askQuestionSchema,
  generateTicketId,
  getClientIp,
  qaRateLimitKey,
} from "@/lib/qa/public";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type AskResponse =
  | {
      ok: true;
      success: true;
      message: string;
      ticketId: string;
    }
  | { ok: false; success: false; error: string };

function jsonResponse(body: AskResponse, init?: ResponseInit): NextResponse<AskResponse> {
  return NextResponse.json(body, init);
}

async function createUniqueTicketId(): Promise<string> {
  const supabase = createSupabaseAdminClient();

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const ticketId = generateTicketId();
    const { data, error } = await supabase
      .from("questions")
      .select("id")
      .eq("ticket_id", ticketId)
      .maybeSingle();

    if (error) {
      throw new Error("ticket_lookup_failed");
    }

    if (!data) {
      return ticketId;
    }
  }

  throw new Error("ticket_collision");
}

export async function POST(request: Request): Promise<NextResponse<AskResponse>> {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return jsonResponse(
      { ok: false, success: false, error: "Please send a valid question." },
      { status: 400 }
    );
  }

  const parsed = askQuestionSchema.safeParse(payload);

  if (!parsed.success) {
    return jsonResponse(
      {
        ok: false,
        success: false,
        error: parsed.error.issues[0]?.message ?? "Please check the form and try again.",
      },
      { status: 400 }
    );
  }

  if (parsed.data.website && parsed.data.website.trim().length > 0) {
    return jsonResponse({
      ok: true,
      success: true,
      message: "Question sent. Save your Ticket ID to check the answer later.",
      ticketId: generateTicketId(),
    });
  }

  const clientIp = getClientIp(request);
  const allowed = await checkRateLimit(qaRateLimitKey("ask", clientIp), 3, 60 * 60);

  if (!allowed) {
    return jsonResponse(
      {
        ok: false,
        success: false,
        error:
          "Too many question submissions from your network. Please try again later.",
      },
      { status: 429 }
    );
  }

  try {
    const supabase = createSupabaseAdminClient();
    const ticketId = await createUniqueTicketId();
    const { error } = await supabase.from("questions").insert({
      ticket_id: ticketId,
      name: parsed.data.name,
      email: parsed.data.email,
      category: parsed.data.category,
      question: parsed.data.question,
      is_private: parsed.data.isPrivate,
      status: "pending",
    });

    if (error) {
      return jsonResponse(
        {
          ok: false,
          success: false,
          error: "Could not send your question. Please try again later.",
        },
        { status: 500 }
      );
    }

    return jsonResponse({
      ok: true,
      success: true,
      message: "Question sent. Save your Ticket ID to check the answer later.",
      ticketId,
    });
  } catch {
    return jsonResponse(
      {
        ok: false,
        success: false,
        error: "Could not send your question. Please try again later.",
      },
      { status: 500 }
    );
  }
}
