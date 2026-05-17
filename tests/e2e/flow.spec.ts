import { expect, test } from "@playwright/test";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RECRUITER_EMAIL = process.env.E2E_RECRUITER_EMAIL;
const RECRUITER_PASSWORD = process.env.E2E_RECRUITER_PASSWORD;

const hasCreds = !!(
  SUPABASE_URL &&
  SUPABASE_ANON &&
  SERVICE_ROLE &&
  RECRUITER_EMAIL &&
  RECRUITER_PASSWORD
);

test.describe("candidate submission → Gemini 2.5 Flash with Thinking Mode scoring", () => {
  test.skip(
    !hasCreds,
    "Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, E2E_RECRUITER_EMAIL, E2E_RECRUITER_PASSWORD to run the end-to-end flow against a real environment with the score-candidate edge function deployed.",
  );

  test("a candidate submits a resume and the dashboard shows a score within 30 s", async ({
    browser,
  }) => {
    test.setTimeout(120_000);

    const recruiter = await browser.newContext();
    const recruiterPage = await recruiter.newPage();

    await recruiterPage.goto("/");
    await recruiterPage.evaluate(
      async ({ url, anon, email, password }) => {
        const { createClient } = await import(
          "https://esm.sh/@supabase/supabase-js@2"
        );
        const supabase = createClient(url, anon);
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      },
      {
        url: SUPABASE_URL!,
        anon: SUPABASE_ANON!,
        email: RECRUITER_EMAIL!,
        password: RECRUITER_PASSWORD!,
      },
    );

    await recruiterPage.goto("/dashboard");
    await expect(recruiterPage.getByRole("heading", { name: "Jobs" })).toBeVisible();

    const title = `E2E Job ${Date.now()}`;
    await recruiterPage.getByLabel("Title").fill(title);
    await recruiterPage.getByLabel("Job description").fill(
      "Senior backend engineer. Required: 6+ years TypeScript or Go, Postgres, distributed systems. Bonus: Kubernetes, AWS.",
    );
    await recruiterPage.getByRole("button", { name: "Create job" }).click();
    await recruiterPage.waitForURL(/\/dashboard\/[0-9a-f-]+/);
    const slug = await recruiterPage.evaluate(() => {
      const code = document.querySelector(
        ".font-mono",
      )?.textContent?.trim() ?? "";
      return code.replace(/^\/apply\//, "");
    });
    expect(slug).toMatch(/^[a-z0-9]{10}$/);

    const candidate = await browser.newContext();
    const candidatePage = await candidate.newPage();
    await candidatePage.goto(`/apply/${slug}`);
    await candidatePage.getByLabel("Full name").fill("Jane Doe");
    await candidatePage.getByLabel("Email").fill("jane.doe@example.com");
    await candidatePage.getByLabel("Phone").fill("+15555550123");
    await candidatePage
      .getByLabel(/Resume/)
      .setInputFiles(path.join(__dirname, "..", "fixtures", "resume.pdf"));
    await candidatePage
      .getByRole("button", { name: "Submit application" })
      .click();
    await expect(
      candidatePage.getByText("Application received"),
    ).toBeVisible({ timeout: 30_000 });

    const admin = createClient(SUPABASE_URL!, SERVICE_ROLE!, {
      auth: { persistSession: false },
    });
    const start = Date.now();
    let row:
      | { score: number | null; rationale: string | null; status: string }
      | null = null;
    while (Date.now() - start < 30_000) {
      const { data } = await admin
        .from("candidates")
        .select("score, rationale, status")
        .eq("email", "jane.doe@example.com")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data && data.score != null && data.rationale) {
        row = data;
        break;
      }
      await new Promise((r) => setTimeout(r, 2_000));
    }
    expect(row, "scoring did not finish within 30 s").not.toBeNull();
    expect(Number.isInteger(row!.score)).toBe(true);
    expect(row!.score!).toBeGreaterThanOrEqual(0);
    expect(row!.score!).toBeLessThanOrEqual(100);
    expect(row!.rationale!.length).toBeGreaterThan(0);

    await recruiterPage.reload();
    const scoreEl = recruiterPage
      .getByTestId("candidate-score")
      .first();
    await expect(scoreEl).toContainText(String(row!.score));
    await expect(
      recruiterPage.getByTestId("candidate-rationale").first(),
    ).not.toBeEmpty();
  });
});
