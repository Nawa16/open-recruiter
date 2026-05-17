import { GoogleGenAI, type ContentListUnion } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function generate(opts: {
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
    contents: opts.prompt as ContentListUnion,
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
