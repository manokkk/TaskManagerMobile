import {
  NoteBlock,
  NoteChecklistItem,
  NoteTextBlock,
  NoteTextStyle,
  RichNoteDocument,
} from "../types/note";

export function createBlockId(prefix = "blk"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

export function createEmptyTextBlock(
  content = "",
  style?: NoteTextStyle
): NoteTextBlock {
  return {
    id: createBlockId("txt"),
    type: "text",
    content,
    ...(style ? { style } : {}),
  };
}

export function parseNoteDocument(raw?: string | null): RichNoteDocument {
  if (!raw || !raw.trim()) {
    return {
      __galaxyNoteV1: true,
      blocks: [createEmptyTextBlock("")],
    };
  }

  const trimmed = raw.trim();
  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (
        parsed &&
        parsed.__galaxyNoteV1 === true &&
        Array.isArray(parsed.blocks)
      ) {
        const blocks: NoteBlock[] =
          parsed.blocks.length > 0
            ? parsed.blocks
            : [createEmptyTextBlock("")];
        return {
          __galaxyNoteV1: true,
          blocks,
        };
      }
    } catch {
      // Fallback to plain text if not valid JSON
    }
  }

  return {
    __galaxyNoteV1: true,
    blocks: [createEmptyTextBlock(raw)],
  };
}

export function serializeNoteDocument(doc: RichNoteDocument): string {
  const nonEmpty = doc.blocks.some((b) => {
    if (b.type === "text") return b.content.trim().length > 0;
    if (b.type === "checklist")
      return b.items.some((item) => item.text.trim().length > 0) || b.items.length > 0;
    if (b.type === "image") return Boolean(b.uri);
    if (b.type === "drawing") return b.strokes.length > 0;
    if (b.type === "mindmap") return b.nodes.length > 0;
    return false;
  });

  if (!nonEmpty) {
    return "";
  }

  // If the entire note is a single unstyled plain text block, keep it clean as JSON or plain text;
  // storing JSON preserves block IDs cleanly, while plain text is also supported on parse.
  return JSON.stringify({
    __galaxyNoteV1: true,
    blocks: doc.blocks,
  });
}

export function getNoteCharacterCount(doc: RichNoteDocument): number {
  return doc.blocks.reduce((sum, block) => {
    if (block.type === "text") {
      return sum + block.content.length;
    }
    if (block.type === "checklist") {
      return (
        sum +
        block.items.reduce((itemSum, item) => itemSum + item.text.length, 0)
      );
    }
    if (block.type === "mindmap") {
      return (
        sum +
        block.nodes.reduce((nodeSum, node) => nodeSum + node.label.length, 0)
      );
    }
    return sum;
  }, 0);
}

export function getNotePlainText(raw?: string | null): string {
  const doc = parseNoteDocument(raw);
  const parts: string[] = [];

  for (const block of doc.blocks) {
    if (block.type === "text" && block.content.trim()) {
      parts.push(block.content.trim());
    } else if (block.type === "checklist") {
      for (const item of block.items) {
        if (item.text.trim()) {
          parts.push(item.text.trim());
        }
      }
    } else if (block.type === "mindmap") {
      for (const node of block.nodes) {
        if (node.label.trim()) {
          parts.push(node.label.trim());
        }
      }
    } else if (block.type === "image" && block.caption?.trim()) {
      parts.push(block.caption.trim());
    }
  }

  return parts.join("\n");
}

export interface NotePreviewSummary {
  snippet: string;
  badges: string[];
  wordCount: number;
  charCount: number;
}

export function getNotePreviewSummary(raw?: string | null): NotePreviewSummary {
  const doc = parseNoteDocument(raw);
  const textLines: string[] = [];
  let imageCount = 0;
  let drawingCount = 0;
  let mindMapCount = 0;
  let checklistTotal = 0;
  let checklistDone = 0;

  for (const block of doc.blocks) {
    if (block.type === "text" && block.content.trim()) {
      textLines.push(block.content.trim());
    } else if (block.type === "checklist") {
      checklistTotal += block.items.length;
      checklistDone += block.items.filter((i) => i.checked).length;
      if (textLines.length === 0) {
        const previewItems = block.items
          .filter((i) => i.text.trim())
          .slice(0, 2)
          .map((i) => `${i.checked ? "[x]" : "[ ]"} ${i.text.trim()}`);
        if (previewItems.length > 0) {
          textLines.push(previewItems.join("\n"));
        }
      }
    } else if (block.type === "image") {
      imageCount += 1;
    } else if (block.type === "drawing" && block.strokes.length > 0) {
      drawingCount += 1;
    } else if (block.type === "mindmap" && block.nodes.length > 0) {
      mindMapCount += 1;
    }
  }

  const badges: string[] = [];
  if (checklistTotal > 0) {
    badges.push(`${checklistDone}/${checklistTotal} items`);
  }
  if (imageCount > 0) {
    badges.push(`${imageCount} ${imageCount === 1 ? "image" : "images"}`);
  }
  if (drawingCount > 0) {
    badges.push(`${drawingCount} ${drawingCount === 1 ? "sketch" : "sketches"}`);
  }
  if (mindMapCount > 0) {
    badges.push("Mind map");
  }

  const plainText = getNotePlainText(raw);
  const wordCount = plainText.trim()
    ? plainText.trim().split(/\s+/).length
    : 0;

  return {
    snippet: textLines.join("\n"),
    badges,
    wordCount,
    charCount: getNoteCharacterCount(doc),
  };
}

export type AiAssistantAction = "summarize" | "polish" | "expand" | "checklist";

export interface AiAssistantResult {
  action: AiAssistantAction;
  heading: string;
  previewText: string;
  checklistItems?: NoteChecklistItem[];
}

export function runLocalAiAssistant(
  action: AiAssistantAction,
  noteTitle: string,
  doc: RichNoteDocument
): AiAssistantResult {
  const plainText = getNotePlainText(serializeNoteDocument(doc)).trim();
  const lines = plainText
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (action === "summarize") {
    if (!plainText) {
      return {
        action,
        heading: "Summary",
        previewText: `• Topic: ${noteTitle || "Untitled Note"}\n• Add more details in your note to generate a fuller summary.`,
      };
    }

    const sentences = plainText
      .replace(/\n+/g, ". ")
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 3);

    const picked = sentences.slice(0, 4);
    const bullets = (picked.length > 0 ? picked : lines.slice(0, 4)).map(
      (line) => `• ${line.replace(/^[-•*]\s*/, "")}`
    );

    return {
      action,
      heading: "AI Summary",
      previewText: `Summary of "${noteTitle || "Note"}":\n${bullets.join("\n")}`,
    };
  }

  if (action === "polish") {
    if (!plainText) {
      return {
        action,
        heading: "Polished Draft",
        previewText: `${noteTitle || "Note"}\n\nWrite a few lines first and AI Assistant will clean up grammar, punctuation, and structure.`,
      };
    }

    const polishedLines = lines.map((line) => {
      const cleaned = line.replace(/\s+/g, " ").trim();
      const isBullet = /^[-•*]\s+/.test(cleaned);
      const core = cleaned.replace(/^[-•*]\s+/, "");
      const capitalized =
        core.charAt(0).toUpperCase() + core.slice(1);
      const needsPeriod =
        capitalized.length > 15 && !/[.!?:;]$/.test(capitalized);
      const formatted = needsPeriod ? `${capitalized}.` : capitalized;
      return isBullet ? `• ${formatted}` : formatted;
    });

    return {
      action,
      heading: "Polished Text",
      previewText: polishedLines.join("\n\n"),
    };
  }

  if (action === "expand") {
    const topic = noteTitle.trim() || "Note Topic";
    if (!plainText) {
      return {
        action,
        heading: "Expanded Outline",
        previewText:
          `${topic}\n\n` +
          `• Overview: Key context and purpose for ${topic}\n` +
          `• Key Ideas:\n  - Main point 1\n  - Main point 2\n` +
          `• Next Steps: Concrete actions to follow up on`,
      };
    }

    const expanded = lines
      .slice(0, 6)
      .map((l, idx) => {
        const clean = l.replace(/^[-•*]\s*/, "");
        return `${idx + 1}. ${clean.charAt(0).toUpperCase() + clean.slice(1)}\n   • Details & context for "${clean}"`;
      })
      .join("\n\n");

    return {
      action,
      heading: "Expanded Outline",
      previewText: `${topic} — Structured Breakdown\n\n${expanded}`,
    };
  }

  // checklist extraction
  const sourceItems =
    lines.length > 0
      ? lines
      : plainText
          .split(/[,;]+/)
          .map((s) => s.trim())
          .filter(Boolean);

  const checklistItems: NoteChecklistItem[] = (
    sourceItems.length > 0 ? sourceItems : [`Review "${noteTitle || "Note"}"`]
  )
    .slice(0, 12)
    .map((line) => ({
      id: createBlockId("chk"),
      text: line.replace(/^([-•*]|\[\s?[xX]?\])\s*/, ""),
      checked: false,
    }));

  return {
    action,
    heading: "Extracted Checklist",
    previewText: checklistItems.map((i) => `[ ] ${i.text}`).join("\n"),
    checklistItems,
  };
}
