import { z } from "zod";

export const parsedResumeSchema = z.object({
  fullName: z.string(),
  email: z.string(),
  phone: z.string(),
  totalYearsExperience: z.number().nonnegative(),
  skills: z.array(z.string()),
  companies: z.array(
    z.object({
      name: z.string(),
      title: z.string(),
      years: z.number().nonnegative(),
    }),
  ),
  education: z.array(z.string()),
});

export type ParsedResume = z.infer<typeof parsedResumeSchema>;

export const scoreSchema = z.object({
  score: z.number().int().min(0).max(100),
  rationale: z.string().min(1),
});

export type Score = z.infer<typeof scoreSchema>;

export const MIN_APPLICATION_CAP = 1;
export const MAX_APPLICATION_CAP = 10000;
export const DEFAULT_APPLICATION_CAP = 50;

export const newJobSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(20000),
  maxApplications: z.coerce
    .number()
    .int()
    .min(MIN_APPLICATION_CAP)
    .max(MAX_APPLICATION_CAP)
    .default(DEFAULT_APPLICATION_CAP),
});

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const editJobSchema = newJobSchema;

export const MAX_RESUME_BYTES = 10 * 1024 * 1024;

export const candidateFormSchema = z.object({
  fullName: z.string().min(1).max(120),
  email: z.string().email(),
  phone: z.string().min(3).max(40),
  file: z
    .instanceof(File)
    .refine((f) => f.size > 0 && f.size <= MAX_RESUME_BYTES, {
      message: "Resume must be at most 10 MB.",
    })
    .refine(
      (f) =>
        f.type === "application/pdf" ||
        f.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      { message: "Resume must be a PDF or DOCX file." },
    ),
});

export const parsedResumeResponseSchema = {
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
} as const;

export const scoreResponseSchema = {
  type: "object",
  properties: {
    score: { type: "integer", minimum: 0, maximum: 100 },
    rationale: { type: "string" },
  },
  required: ["score", "rationale"],
} as const;
