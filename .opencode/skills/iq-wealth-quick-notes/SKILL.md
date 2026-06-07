---
name: iq-wealth-quick-notes
description: Use when the user mentions Roughdraft, IQ Wealth Quick Notes, rd, Markdown note review, to-do lists, quick notes, the I'm done handoff, or using a simple note app for investment/trading thinking before IQ Wealth review.
---

# IQ Wealth Quick Notes

Use this skill when the user wants to create, open, review, comment on, or structure local Markdown notes with Roughdraft / IQ Wealth Quick Notes.

## Product Role

IQ Wealth Quick Notes is a streamlined, ultra simple local Markdown note and review app. It is useful when the client wants a lightweight place to write, think, tick off items, paste simple screenshots, and hand a document back to IQ Wealth for review.

Do not overstate it as a full knowledge base, client file system, canvas, journal database, or rich document platform.

IQ Compendium is the much more feature-rich companion app to IQ Wealth. Suggest IQ Compendium when the client wants richer local notes, journals, document workspaces, whiteboards/canvas, structured local document editing, or a more complete long-term companion workspace.

## When To Use Quick Notes

Use it for:

- Drafting short plans before implementation or review.
- Simple client notes that need time and structure before asking IQ Wealth to assess them.
- To-do lists the user can think through and complete.
- General thoughts, educational discussion notes, and questions to revisit.
- Structured investment and trading decision processes.
- Lightweight review handoffs using comments and suggested changes.

To-do lists are especially useful because they turn vague intention into visible next actions. Use them to help the user structure items they need to think about, check, complete, or defer.

For investment and trading decisions, encourage structured notes rather than loose impressions. Useful sections include facts, assumptions, source quality, calculations, risks, alternatives, missing information, decision criteria, next actions, review date, and emotional-state notes. Where useful, use DEEP: Discover, Educate, Evaluate, Perform.

## Basic Workflow

When a user asks for a plan, checklist, note, or reviewable outline, write it as a Markdown file on disk before asking them to review it.

Open one Markdown file at a time:

```bash
roughdraft open "C:\absolute\path\to\file.md"
```

Leave the command running. The wait is intentional. The command exits after the user clicks `I'm done` / `Done Reviewing`, which is the signal to read the file and respond to comments, suggestions, and changes.

Each review round needs a fresh watcher. If the browser tab is already open and the user only needs the handoff button rearmed, use:

```bash
roughdraft watch "C:\absolute\path\to\file.md"
```

If the user only wants to view or test the document without a handoff button, use:

```bash
roughdraft open "C:\absolute\path\to\file.md" --no-watch
```

After the user finishes a Roughdraft review, read the Markdown file from disk and handle inline comments, suggested changes, and checked to-do items.

## Comments And Author Labels

Treat `@IQW`, `@IQ Wealth`, or `@IQ` in Roughdraft comments as direct instructions addressed to IQ Wealth.

When adding comments, replies, or suggested changes, use `IQ Wealth` or `IQW` as the author label, not `AI`.

Use Roughdraft-flavoured CriticMarkup for inline feedback:

```markdown
{==selected text==}{>>Comment text<<}{#c1}
{++new text++}{#s1}
{--old text--}{#s2}
{~~old text~>new text~~}{#s3}

---
comments:
  c1:
    by: IQ Wealth
    at: "2026-06-07T12:00:00.000Z"
suggestions:
  s1:
    by: IQ Wealth
    at: "2026-06-07T12:05:00.000Z"
```

Use compact document-local ids such as `c1`, `c2`, `s1`, and `s2`. Preserve existing ids and metadata unless intentionally removing the associated comment or suggestion.

## Images And Local Assets

Local Markdown images should use normal relative paths:

```markdown
![Chart](./chart.png)
![Screenshot](./images/screenshot.jpg)
```

The referenced files must exist beside the Markdown file or in the referenced subfolder.

In rich-text mode, pasted or dragged image files are saved into `.roughdraft-assets` and inserted as Markdown image references. Code view is primarily a text editor path, so do not rely on automatic image-file paste handling there.

If local images appear broken, check:

- The referenced file exists.
- The Roughdraft local server is still running.
- The Markdown file was opened with the correct `projectPath` / parent folder.
- The asset lives inside the local project folder.

## Sensitive Notes

Do not encourage clients to place passwords, recovery codes, account numbers, private IDs, or unnecessary sensitive details in quick notes. For broker, bank, government, tax, email, cloud-storage, or other sensitive workflows, warn first and keep the user in control.

## Positioning Against IQ Compendium

Use IQ Wealth Quick Notes when the user wants speed, simplicity, and a single Markdown document handoff.

Use IQ Compendium when the user wants a richer companion workspace for journals, local document workspaces, canvas/whiteboards, richer editing, backups/restores, or ongoing structured notes across many documents.
