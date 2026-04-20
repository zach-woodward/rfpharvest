import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MAX_CONTENT_LENGTH = 12000; // Characters sent to OpenAI
const BATCH_SIZE = 25;

export interface SummarizeRunSummary {
  considered: number;
  summarized: number;
  no_content: number;
  errored: number;
}

async function fetchDocumentContent(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "RFP-Harvest/1.0 (Government RFP aggregator)" },
    });
    if (!response.ok) return null;

    const contentType = (response.headers.get("content-type") || "").toLowerCase();

    if (contentType.includes("application/pdf") || url.toLowerCase().endsWith(".pdf")) {
      try {
        const buf = Buffer.from(await response.arrayBuffer());
        // Direct-path import avoids pdf-parse's index.js "test mode" that
        // tries to read a bundled sample PDF at require time and crashes
        // in production bundlers.
        // @ts-expect-error — no types for the direct path
        const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default as (b: Buffer) => Promise<{ text: string }>;
        const parsed = await pdfParse(buf);
        const text = parsed.text.replace(/\s+/g, " ").trim();
        return text ? text.slice(0, MAX_CONTENT_LENGTH) : null;
      } catch (err) {
        console.warn(`[summarize] pdf-parse failed for ${url}:`, err instanceof Error ? err.message : err);
        return null;
      }
    }

    if (contentType.includes("text/html") || contentType.includes("text/plain")) {
      const text = await response.text();
      const stripped = text
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      return stripped ? stripped.slice(0, MAX_CONTENT_LENGTH) : null;
    }

    return null;
  } catch {
    return null;
  }
}

async function summarizeRfp(content: string, title: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a government contracting analyst. Summarize RFPs concisely for contractors. Include: scope of work, key requirements, budget (if mentioned), timeline, and who should consider bidding. Keep it under 200 words. Be factual and direct.",
      },
      {
        role: "user",
        content: `Summarize this RFP titled "${title}":\n\n${content}`,
      },
    ],
    max_tokens: 400,
    temperature: 0.3,
  });

  return response.choices[0]?.message?.content || "Summary unavailable.";
}

export async function runSummarize(): Promise<SummarizeRunSummary> {
  const summary: SummarizeRunSummary = {
    considered: 0,
    summarized: 0,
    no_content: 0,
    errored: 0,
  };

  const { data: qaRun } = await supabase
    .from("qa_run_results")
    .insert({ layer: "ai-summarize", status: "running", started_at: new Date().toISOString() })
    .select()
    .single();
  const qaRunId = qaRun?.id;

  console.log("[summarize] Starting summarization run...");

  const { data: rfps, error } = await supabase
    .from("rfps")
    .select("id, title, source_url, document_urls, requires_signup")
    .is("ai_summary", null)
    .eq("requires_signup", false)
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(BATCH_SIZE);

  const finish = async (status: "success" | "partial" | "error", message: string) => {
    if (!qaRunId) return;
    await supabase
      .from("qa_run_results")
      .update({
        status,
        completed_at: new Date().toISOString(),
        checked: summary.considered,
        issues_found: summary.no_content + summary.errored,
        auto_fixed: summary.summarized,
        message,
        details: summary,
      })
      .eq("id", qaRunId);
  };

  if (error || !rfps?.length) {
    const msg = error ? `Query error: ${error.message}` : "No RFPs needing summaries";
    console.log(`[summarize] ${msg}`);
    await finish(error ? "error" : "success", msg);
    return summary;
  }

  summary.considered = rfps.length;
  console.log(`[summarize] Processing ${rfps.length} RFPs`);

  type PendingRfp = {
    id: string;
    title: string;
    source_url: string | null;
    document_urls: string[] | null;
    requires_signup: boolean;
  };

  for (const rfp of rfps as PendingRfp[]) {
    console.log(`[summarize] Processing: ${rfp.title}`);

    let content: string | null = null;

    // Prefer document URLs (often the real RFP PDF) over the listing page
    if (rfp.document_urls?.length) {
      for (const docUrl of rfp.document_urls) {
        content = await fetchDocumentContent(docUrl);
        if (content) break;
      }
    }

    if (!content && rfp.source_url) {
      content = await fetchDocumentContent(rfp.source_url);
    }

    if (!content) {
      console.log(`[summarize] No content available for: ${rfp.title}`);
      summary.no_content++;
      continue;
    }

    try {
      const aiSummary = await summarizeRfp(content, rfp.title);
      await supabase
        .from("rfps")
        .update({
          ai_summary: aiSummary,
          ai_summary_generated_at: new Date().toISOString(),
        })
        .eq("id", rfp.id);
      summary.summarized++;
      console.log(`[summarize] Summarized: ${rfp.title}`);
    } catch (err) {
      console.error(`[summarize] Error summarizing ${rfp.title}:`, err);
      summary.errored++;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  const status =
    summary.errored > 0 && summary.summarized === 0
      ? "error"
      : summary.errored > 0
      ? "partial"
      : "success";
  await finish(
    status,
    `${summary.summarized} summarized, ${summary.no_content} skipped (no content), ${summary.errored} errored`
  );
  console.log("[summarize] Summarization run complete.");
  return summary;
}

const isDirectRun = import.meta.url === `file://${process.argv[1]}`;
if (isDirectRun) {
  runSummarize().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
