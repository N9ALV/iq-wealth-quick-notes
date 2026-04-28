import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

export function createMarkdownProject(label: string) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `roughdraft-${label}-`));
}

export function removeMarkdownProject(projectDir: string) {
  fs.rmSync(projectDir, { recursive: true, force: true });
}

export function writeProjectFile(
  projectDir: string,
  relativePath: string,
  content: string | Buffer,
) {
  const absolutePath = path.join(projectDir, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, content);
  return absolutePath;
}

export function readProjectFile(projectDir: string, relativePath: string) {
  return fs.readFileSync(path.join(projectDir, relativePath), "utf8");
}

export async function openMarkdownFile(
  page: Page,
  absolutePath: string,
  editor?: "rich-text" | "code",
) {
  const params = new URLSearchParams({ path: absolutePath });
  if (editor) params.set("editor", editor);

  await page.goto(`/?${params.toString()}`);
}

export async function appendInCodeEditor(page: Page, text: string) {
  const editor = page.locator(".cm-content");
  await expect(editor).toBeVisible();
  await editor.click();
  await page.keyboard.press(
    process.platform === "darwin" ? "Meta+End" : "Control+End",
  );
  await page.keyboard.type(text);
}

export function logE2eEvent(event: string, data: Record<string, unknown> = {}) {
  const file = process.env.THOUGHTFUL_SLOG_FILE;
  if (!file) return;

  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.appendFileSync(
    file,
    `${JSON.stringify({
      ts: new Date().toISOString(),
      runId: process.env.THOUGHTFUL_SLOG_RUN_ID ?? "manual",
      source: "packages/app/e2e",
      event,
      data,
    })}\n`,
  );
}
