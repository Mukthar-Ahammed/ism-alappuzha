import { NextResponse } from "next/server";
import { fallbackQuestions } from "@/data/qa";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Question } from "@/lib/types/qa";

type PublishedQaResponse = {
  ok: true;
  success: true;
  questions: Question[];
};

export async function GET(): Promise<NextResponse<PublishedQaResponse>> {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("questions")
      .select("id, created_at, category, public_question, answer, answered_at")
      .eq("is_published", true)
      .eq("is_private", false)
      .order("answered_at", { ascending: false })
      .limit(25);

    if (!error && data && data.length > 0) {
      const questions: Question[] = data
        .filter((item) => item.public_question && item.answer)
        .map((item) => ({
          id: item.id,
          createdAt: item.created_at,
          name: null,
          category: item.category,
          question: item.public_question ?? "",
          answer: item.answer,
          answeredBy: null,
          answeredAt: item.answered_at,
          status: "answered",
        }));

      return NextResponse.json({ ok: true, success: true, questions });
    }
  } catch {
    // Keep the public site available from bundled data when Supabase is unavailable.
  }

  return NextResponse.json({
    ok: true,
    success: true,
    questions: fallbackQuestions,
  });
}
