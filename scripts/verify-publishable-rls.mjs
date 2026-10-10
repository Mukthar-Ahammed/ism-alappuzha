import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const tableNames = [
  "questions",
  "admins",
  "audit_log",
  "email_log",
  "issues",
  "live_status",
  "programs",
  "dhikr_entries",
  "rate_limits",
];

const insertPayloads = {
  questions: {
    category: "Prayer",
    question: "This publishable-key insert must be rejected.",
  },
  admins: { email: "rls-check@example.invalid" },
  audit_log: { actor_email: "rls-check@example.invalid", action: "blocked" },
  email_log: {
    to_email: "rls-check@example.invalid",
    kind: "reply",
    status: "sent",
  },
  issues: {
    title: "Blocked",
    issue_date: "2026-01-01",
    cover_path: "blocked.webp",
    pdf_path: "blocked.pdf",
  },
  live_status: { id: 1, is_live: false },
  programs: { title: "Blocked", starts_at: new Date().toISOString() },
  dhikr_entries: {
    title: "Blocked",
    category: "morning",
    arabic: "blocked",
  },
  rate_limits: { key: "rls-check" },
};

function loadLocalEnv() {
  const envPath = resolve(process.cwd(), ".env.local");

  if (!existsSync(envPath)) {
    return;
  }

  const content = readFileSync(envPath, "utf8");

  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);

    if (!match) {
      continue;
    }

    const [, key, rawValue] = match;
    process.env[key] ??= rawValue.replace(/^['"]|['"]$/g, "");
  }
}

function assertEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required for the RLS verification script.`);
  }

  return value;
}

function isMissingRelation(error) {
  return error?.code === "42P01" || error?.message?.includes("does not exist");
}

async function main() {
  loadLocalEnv();

  const url = assertEnv("NEXT_PUBLIC_SUPABASE_URL");
  const publishableKey = assertEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  const supabase = createClient(url, publishableKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });

  const failures = [];

  for (const tableName of tableNames) {
    const read = await supabase.from(tableName).select("*").limit(1);

    if (!read.error) {
      failures.push(`${tableName}: read was allowed`);
    } else if (isMissingRelation(read.error)) {
      failures.push(`${tableName}: table is missing`);
    }

    const insert = await supabase
      .from(tableName)
      .insert(insertPayloads[tableName])
      .select()
      .limit(1);

    if (!insert.error) {
      failures.push(`${tableName}: write was allowed`);
    } else if (isMissingRelation(insert.error)) {
      failures.push(`${tableName}: table is missing`);
    }
  }

  if (failures.length > 0) {
    throw new Error(`Publishable key RLS check failed: ${failures.join("; ")}`);
  }

  console.log("Publishable key cannot read or write Phase 1 tables.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "RLS verification failed.");
  process.exitCode = 1;
});
