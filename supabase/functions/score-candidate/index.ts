// score-candidate: parses and scores a resume with Gemini 2.5 Flash with Thinking Mode.
// Runs on Supabase Edge Functions (Deno). Triggered by the public apply page after
// the candidate row is inserted and the resume is uploaded to the `resumes` bucket.

import { createClient } from "npm:@supabase/supabase-js@2";
import { GoogleGenAI } from "npm:@google/genai@1";

// Twin of lib/gemini.ts — the single Gemini call site for the Deno runtime.
// Keep in sync with lib/gemini.ts. Thinking Mode is always enabled.
const ai = new GoogleGenAI({ apiKey: Deno.env.get("GEMINI_API_KEY")! });

async function generate(opts: {
  prompt: string | Array<unknown>;
  systemInstruction?: string;
  responseSchema?: object;
  thinkingBudget?: number;
}) {
  const thinkingBudget = opts.thinkingBudget ?? -1;
  if (thinkingBudget === 0)
    throw new Error("Thinking Mode must remain enabled.");

  return ai.models.generateContent({
    model: "gemini-2.5-flash",
    // deno-lint-ignore no-explicit-any
    contents: opts.prompt as any,
    config: {
      systemInstruction: opts.systemInstruction,
      thinkingConfig: { thinkingBudget },
      ...(opts.responseSchema && {
        responseMimeType: "application/json",
        responseSchema: opts.responseSchema,
      }),
    },
  });
}

const parsedResumeResponseSchema = {
  type: "object",
  properties: {
    fullName: { type: "string" },
    email: { type: "string" },
    phone: { type: "string" },
    totalYearsExperience: { type: "number" },
    skills: { type: "array", items: { type: "string" } },
    companies: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          title: { type: "string" },
          years: { type: "number" },
        },
        required: ["name", "title", "years"],
      },
    },
    education: { type: "array", items: { type: "string" } },
  },
  required: [
    "fullName",
    "email",
    "phone",
    "totalYearsExperience",
    "skills",
    "companies",
    "education",
  ],
};

const scoreResponseSchema = {
  type: "object",
  properties: {
    score: { type: "integer", minimum: 0, maximum: 100 },
    rationale: { type: "string" },
  },
  required: ["score", "rationale"],
};

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(
      null,
      Array.from(bytes.subarray(i, i + chunk)),
    );
  }
  return btoa(binary);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST")
    return new Response("method not allowed", { status: 405, headers: cors });

  let body: { candidate_id?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid JSON body" }, 400);
  }
  const candidateId = body.candidate_id;
  if (!candidateId) return json({ error: "candidate_id is required" }, 400);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  const { data: candidate, error: candidateErr } = await supabase
    .from("candidates")
    .select(
      "id, job_id, resume_path, jobs:job_id ( id, title, description )",
    )
    .eq("id", candidateId)
    .maybeSingle();
  if (candidateErr || !candidate)
    return json({ error: candidateErr?.message ?? "candidate not found" }, 404);

  const job = Array.isArray(candidate.jobs) ? candidate.jobs[0] : candidate.jobs;
  if (!job) return json({ error: "job not found for candidate" }, 404);

  const { data: file, error: dlErr } = await supabase.storage
    .from("resumes")
    .download(candidate.resume_path);
  if (dlErr || !file) return json({ error: dlErr?.message ?? "download failed" }, 500);

  const bytes = new Uint8Array(await file.arrayBuffer());
  const mimeType = candidate.resume_path.toLowerCase().endsWith(".pdf")
    ? "application/pdf"
    : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  const inlineData = { mimeType, data: bytesToBase64(bytes) };

  const parseResp = await generate({
    systemInstruction:
      "Extract structured fields from the attached resume. Be conservative — if a field is missing, return an empty string or zero. Use Gemini 2.5 Flash with Thinking Mode to read the file end-to-end before responding.",
    prompt: [
      {
        role: "user",
        parts: [
          {
            text: "Parse the attached resume and return JSON matching the requested schema.",
          },
          { inlineData },
        ],
      },
    ],
    responseSchema: parsedResumeResponseSchema,
  });
  const parsedText = parseResp.text ?? "";
  let parsed: unknown;
  try {
    parsed = JSON.parse(parsedText);
  } catch {
    return json({ error: "Gemini parse step returned non-JSON." }, 502);
  }

  const scoreResp = await generate({
    systemInstruction:
      "You are a senior recruiter. Score the candidate 0–100 against the job description on five axes — skills match, years of experience, seniority level, domain fit, education — and return one sentence of rationale that names the biggest factor.",
    prompt: `Job title: ${job.title}\n\nJob description:\n${job.description}\n\nParsed resume JSON:\n${JSON.stringify(parsed)}`,
    responseSchema: scoreResponseSchema,
  });
  const scoreText = scoreResp.text ?? "";
  let score: { score: number; rationale: string };
  try {
    score = JSON.parse(scoreText);
  } catch {
    return json({ error: "Gemini score step returned non-JSON." }, 502);
  }

  const { error: updateErr } = await supabase
    .from("candidates")
    .update({
      parsed,
      score: Math.round(score.score),
      rationale: score.rationale,
      status: "scored",
    })
    .eq("id", candidate.id);
  if (updateErr) return json({ error: updateErr.message }, 500);

  return json({ ok: true, score: Math.round(score.score) });
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json", ...cors },
  });
}
