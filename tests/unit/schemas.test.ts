import { describe, expect, it } from "vitest";
import {
  candidateFormSchema,
  newJobSchema,
  parsedResumeSchema,
  scoreSchema,
  signInSchema,
  parsedResumeResponseSchema,
  scoreResponseSchema,
  DEFAULT_APPLICATION_CAP,
  MAX_APPLICATION_CAP,
  MAX_RESUME_BYTES,
} from "@/lib/schemas";

describe("parsedResumeSchema", () => {
  const sample = {
    fullName: "Jane Doe",
    email: "jane@example.com",
    phone: "+15555550123",
    totalYearsExperience: 6,
    skills: ["TypeScript", "Postgres"],
    companies: [{ name: "Acme", title: "Senior Engineer", years: 4 }],
    education: ["BS Computer Science"],
  };

  it("accepts a complete resume", () => {
    expect(parsedResumeSchema.parse(sample)).toEqual(sample);
  });

  it("rejects missing fields", () => {
    expect(() => parsedResumeSchema.parse({})).toThrow();
  });

  it("rejects negative experience", () => {
    expect(() =>
      parsedResumeSchema.parse({ ...sample, totalYearsExperience: -1 }),
    ).toThrow();
  });
});

describe("scoreSchema", () => {
  it("accepts integers in 0–100", () => {
    expect(scoreSchema.parse({ score: 0, rationale: "weakest fit" }))
      .toMatchObject({ score: 0 });
    expect(scoreSchema.parse({ score: 100, rationale: "perfect fit" }))
      .toMatchObject({ score: 100 });
  });

  it("rejects non-integer scores", () => {
    expect(() => scoreSchema.parse({ score: 42.5, rationale: "x" })).toThrow();
  });

  it("rejects out-of-range scores", () => {
    expect(() => scoreSchema.parse({ score: 101, rationale: "x" })).toThrow();
    expect(() => scoreSchema.parse({ score: -1, rationale: "x" })).toThrow();
  });

  it("rejects empty rationale", () => {
    expect(() => scoreSchema.parse({ score: 50, rationale: "" })).toThrow();
  });
});

describe("newJobSchema", () => {
  it("requires title and description", () => {
    expect(() =>
      newJobSchema.parse({ title: "", description: "" }),
    ).toThrow();
  });

  it("accepts a job and defaults maxApplications", () => {
    const job = { title: "Engineer", description: "Build stuff." };
    const parsed = newJobSchema.parse(job);
    expect(parsed.title).toBe("Engineer");
    expect(parsed.description).toBe("Build stuff.");
    expect(parsed.maxApplications).toBe(DEFAULT_APPLICATION_CAP);
  });

  it("coerces a string-form maxApplications", () => {
    const parsed = newJobSchema.parse({
      title: "Engineer",
      description: "Build stuff.",
      maxApplications: "25",
    });
    expect(parsed.maxApplications).toBe(25);
  });

  it("rejects a cap below 1", () => {
    expect(() =>
      newJobSchema.parse({
        title: "Engineer",
        description: "x",
        maxApplications: 0,
      }),
    ).toThrow();
  });

  it("rejects a cap above the hard ceiling", () => {
    expect(() =>
      newJobSchema.parse({
        title: "Engineer",
        description: "x",
        maxApplications: MAX_APPLICATION_CAP + 1,
      }),
    ).toThrow();
  });
});

describe("signInSchema", () => {
  it("accepts a real email and password", () => {
    expect(
      signInSchema.parse({ email: "r@example.com", password: "secret" }),
    ).toEqual({ email: "r@example.com", password: "secret" });
  });
  it("rejects an invalid email", () => {
    expect(() =>
      signInSchema.parse({ email: "not-an-email", password: "secret" }),
    ).toThrow();
  });
  it("rejects an empty password", () => {
    expect(() =>
      signInSchema.parse({ email: "r@example.com", password: "" }),
    ).toThrow();
  });
});

describe("candidateFormSchema", () => {
  const pdf = (size: number) =>
    new File([new Uint8Array(size)], "resume.pdf", {
      type: "application/pdf",
    });

  it("accepts a small PDF", () => {
    const file = pdf(1024);
    const ok = candidateFormSchema.parse({
      fullName: "Jane",
      email: "j@d.com",
      phone: "+15555550123",
      file,
    });
    expect(ok.file).toBe(file);
  });

  it("rejects files over the size limit", () => {
    const file = pdf(MAX_RESUME_BYTES + 1);
    expect(() =>
      candidateFormSchema.parse({
        fullName: "Jane",
        email: "j@d.com",
        phone: "+15555550123",
        file,
      }),
    ).toThrow();
  });

  it("rejects non-PDF/DOCX MIME types", () => {
    const file = new File([new Uint8Array(10)], "resume.txt", {
      type: "text/plain",
    });
    expect(() =>
      candidateFormSchema.parse({
        fullName: "Jane",
        email: "j@d.com",
        phone: "+15555550123",
        file,
      }),
    ).toThrow();
  });

  it("rejects invalid email", () => {
    const file = pdf(1024);
    expect(() =>
      candidateFormSchema.parse({
        fullName: "Jane",
        email: "not-an-email",
        phone: "+15555550123",
        file,
      }),
    ).toThrow();
  });
});

describe("Gemini response schemas", () => {
  it("parsedResumeResponseSchema declares all required fields", () => {
    expect(parsedResumeResponseSchema.required).toEqual([
      "fullName",
      "email",
      "phone",
      "totalYearsExperience",
      "skills",
      "companies",
      "education",
    ]);
  });

  it("scoreResponseSchema asks for an integer 0–100 plus rationale", () => {
    expect(scoreResponseSchema.properties.score.type).toBe("integer");
    expect(scoreResponseSchema.properties.score.minimum).toBe(0);
    expect(scoreResponseSchema.properties.score.maximum).toBe(100);
    expect(scoreResponseSchema.required).toEqual(["score", "rationale"]);
  });
});
