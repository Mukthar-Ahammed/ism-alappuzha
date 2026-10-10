import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { questionCategories } from "@/lib/types/qa";

const askQuestionSchema = z.object({
  name: z
    .string()
    .trim()
    .max(50, "Name must be 50 characters or fewer.")
    .optional()
    .transform((value) => (value ? stripHtml(value) : null)),
  category: z.enum(questionCategories),
  question: z
    .string()
    .trim()
    .min(10, "Your question must be between 10 and 500 characters long.")
    .max(500, "Your question must be between 10 and 500 characters long.")
    .transform(stripHtml),
  website: z.string().optional(),
});

type AskResponse =
  | { ok: true; success: true; message: string }
  | { ok: false; success: false; error: string };

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>?/gm, "").trim();
}

function jsonResponse(body: AskResponse, init?: ResponseInit): NextResponse<AskResponse> {
  return NextResponse.json(body, init);
}

function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip") || "unknown";
}

export async function POST(request: Request) {
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
      message: "Question sent. It will appear here after a scholar answers it.",
    });
  }

  const supabase = createSupabaseAdminClient();
  const rateLimitKey = `qa:ask:${getClientIp(request)}`;
  const { data: allowed, error: rateLimitError } = await supabase.rpc(
    "check_rate_limit",
    {
      key: rateLimitKey,
      max_hits: 3,
      window_seconds: 60 * 60,
    }
  );

  if (rateLimitError || allowed !== true) {
    return jsonResponse(
      {
        ok: false,
        success: false,
        error:
          "Too many question submissions from your network. Maximum 3 questions per hour allowed. Please try again later.",
      },
      { status: 429 }
    );
  }

  const { error } = await supabase.from("questions").insert({
    name: parsed.data.name,
    category: parsed.data.category,
    question: parsed.data.question,
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
    message: "Question sent. It will appear here after a scholar answers it.",
  });
}
