import { beforeEach, describe, expect, it, vi } from "vitest";

const generateContentMock = vi.fn();

vi.mock("@google/genai", () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: { generateContent: generateContentMock },
  })),
}));

const { generate } = await import("@/lib/gemini");

beforeEach(() => {
  generateContentMock.mockReset();
  generateContentMock.mockResolvedValue({ text: "ok" });
});

describe("generate (Gemini 2.5 Flash with Thinking Mode)", () => {
  it("throws when thinkingBudget is 0", async () => {
    await expect(
      generate({ prompt: "anything", thinkingBudget: 0 }),
    ).rejects.toThrow("Thinking Mode must remain enabled.");
    expect(generateContentMock).not.toHaveBeenCalled();
  });

  it("defaults thinkingBudget to -1 (dynamic)", async () => {
    await generate({ prompt: "hello" });
    const call = generateContentMock.mock.calls[0]?.[0];
    expect(call?.model).toBe("gemini-2.5-flash");
    expect(call?.config?.thinkingConfig?.thinkingBudget).toBe(-1);
  });

  it("uses the provided thinkingBudget when non-zero", async () => {
    await generate({ prompt: "hello", thinkingBudget: 2048 });
    const call = generateContentMock.mock.calls[0]?.[0];
    expect(call?.config?.thinkingConfig?.thinkingBudget).toBe(2048);
  });

  it("attaches responseSchema as JSON output when provided", async () => {
    const schema = { type: "object" };
    await generate({ prompt: "hi", responseSchema: schema });
    const call = generateContentMock.mock.calls[0]?.[0];
    expect(call?.config?.responseMimeType).toBe("application/json");
    expect(call?.config?.responseSchema).toBe(schema);
  });

  it("forwards systemInstruction", async () => {
    await generate({ prompt: "hi", systemInstruction: "be terse" });
    const call = generateContentMock.mock.calls[0]?.[0];
    expect(call?.config?.systemInstruction).toBe("be terse");
  });
});
