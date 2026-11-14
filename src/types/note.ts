export type NoteFontSize = "small" | "normal" | "large" | "title";
export type NoteTextAlign = "left" | "center" | "right";
export type NoteListType = "none" | "bullet" | "numbered";

export interface NoteTextStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  fontSize?: NoteFontSize;
  color?: string;
  align?: NoteTextAlign;
  listType?: NoteListType;
}

export interface NoteTextBlock {
  id: string;
  type: "text";
  content: string;
  style?: NoteTextStyle;
}

export interface NoteChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

export interface NoteChecklistBlock {
  id: string;
  type: "checklist";
  items: NoteChecklistItem[];
}

export interface NoteImageBlock {
  id: string;
  type: "image";
  uri: string;
  caption?: string;
  aspectRatio?: number;
}

export interface NoteDrawingStroke {
  color: string;
  width: number;
  path: string;
}

export interface NoteDrawingBlock {
  id: string;
  type: "drawing";
  width: number;
  height: number;
  strokes: NoteDrawingStroke[];
}

export interface NoteMindMapNode {
  id: string;
  label: string;
  parentId: string | null;
  color?: string;
}

export interface NoteMindMapBlock {
  id: string;
  type: "mindmap";
  title: string;
  nodes: NoteMindMapNode[];
}

export type NoteBlock =
  | NoteTextBlock
  | NoteChecklistBlock
  | NoteImageBlock
  | NoteDrawingBlock
  | NoteMindMapBlock;

export interface RichNoteDocument {
  __galaxyNoteV1: true;
  blocks: NoteBlock[];
}
