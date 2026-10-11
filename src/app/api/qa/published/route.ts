import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";
import {
  publishedQaCacheTag,
  publishedRowsToQuestions,
} from "@/lib/qa/public";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Question } from "@/lib/types/qa";

type PublishedQaResponse = {
  ok: true;
  success: true;
  questions: Question[];
};

const getPublishedQuestions = unstable_cache(
  async (): Promise<Question[]> => {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("questions")
      .select("category,public_question,answer")
      .eq("is_published", true)
      .eq("is_private", false)
      .order("answered_at", { ascending: false })
      .limit(25);

    if (error) {
      // Thrown so a failed read is never cached as "no questions".
      throw new Error("Could not load published questions.");
    }

    return publishedRowsToQuestions(data);
  },
  ["published-qa"],
  { tags: [publishedQaCacheTag], revalidate: 60 }
);

export async function GET(): Promise<NextResponse<PublishedQaResponse>> {
  return NextResponse.json({
    ok: true,
    success: true,
    // Only answers published in the admin are shown; there are no sample answers.
    questions: await getPublishedQuestions().catch(() => []),
  });
}
