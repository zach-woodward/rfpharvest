import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MAX_CONTENT_LENGTH = 12000; // Characters to send to OpenAI

async function fetchDocumentContent(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "RFP-Harvest/1.0 (Government RFP aggregator)",
      },
    });

    if (!response.ok) return null;

    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/pdf")) {
      // For PDFs, we'd use pdf-parse in production
      // Skipping binary parsing here — flag for manual review
      return null;
    }

    if (contentType.includes("text/html") || contentType.includes("text/plain")) {
      const text = await response.text();
      // Strip HTML tags for a rough text extraction
      const stripped = text
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      return stripped.slice(0, MAX_CONTENT_LENGTH);
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
        content: `You are a government contracting analyst. Summarize RFPs concisely for contractors. Include: scope of work, key requirements, budget (if mentioned), timeline, and who should consider bidding. Keep it under 200 words. Be factual and direct.`,
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

async function main() {
  console.log("[summarize] Starting summarization run...");

  // Get RFPs that need summarization
  const { data: rfps, error } = await supabase
    .from("rfps")
    .select("id, title, source_url, document_urls, requires_signup")
    .is("ai_summary", null)
    .eq("requires_signup", false)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error || !rfps?.length) {
    console.log("[summarize] No RFPs to summarize");
    return;
  }

  console.log(`[summarize] Processing ${rfps.length} RFPs`);

  for (const rfp of rfps) {
    console.log(`[summarize] Processing: ${rfp.title}`);

    // Try to get content from source URL or document URLs
    let content: string | null = null;

    if (rfp.source_url) {
      content = await fetchDocumentContent(rfp.source_url);
    }

    if (!content && rfp.document_urls?.length) {
      for (const docUrl of rfp.document_urls) {
        content = await fetchDocumentContent(docUrl);
        if (content) break;
      }
    }

    if (!content) {
      console.log(`[summarize] No content available for: ${rfp.title}`);
      continue;
    }

    try {
      const summary = await summarizeRfp(content, rfp.title);

      await supabase
        .from("rfps")
        .update({
          ai_summary: summary,
          ai_summary_generated_at: new Date().toISOString(),
        })
        .eq("id", rfp.id);

      console.log(`[summarize] Summarized: ${rfp.title}`);
    } catch (err) {
      console.error(`[summarize] Error summarizing ${rfp.title}:`, err);
    }

    // Rate limiting: small delay between API calls
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  console.log("[summarize] Summarization run complete.");
}

main().catch(console.error);
