export type MemeImageInput = string | Buffer | Uint8Array;

export type MemeFormat = 'png' | 'jpg' | 'jpeg' | 'webp';

export interface MemeGeneratorOptions {
  input?: MemeImageInput;
  image?: MemeImageInput;
  background?: MemeImageInput;
  output?: string;
  out?: string;
  topText?: string;
  top?: string;
  bottomText?: string;
  bottom?: string;
  uppercase?: boolean;
  fontPath?: string | Buffer | Uint8Array | false | null;
  fontFamily?: string;
  textColor?: 'auto' | string;
  strokeColor?: 'auto' | string;
  strokeWidthRatio?: number;
  shadow?: boolean;
  paddingRatio?: number;
  captionHeightRatio?: number;
  fontSizeRatio?: number;
  minFontSizeRatio?: number;
  lineHeight?: number;
  format?: MemeFormat;
  quality?: number;
  autoColorThreshold?: number;
}

export interface CaptionZone {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CaptionLayout {
  text: string;
  lines: string[];
  fontSize: number;
  lineHeightPx: number;
  blockHeight: number;
  maxLineWidth: number;
  zone: CaptionZone;
}

export interface RenderResult {
  buffer: Buffer;
  width: number;
  height: number;
  format: 'png' | 'jpeg' | 'webp';
  top: CaptionLayout;
  bottom: CaptionLayout;
}

export interface FileRenderResult extends RenderResult {
  output: string;
}

export interface LayoutOnlyOptions extends Omit<MemeGeneratorOptions, 'input' | 'image' | 'background' | 'output' | 'out'> {
  width: number;
  height: number;
}

export interface LayoutOnlyResult {
  width: number;
  height: number;
  top: CaptionLayout;
  bottom: CaptionLayout;
}

export function generateMeme(options: MemeGeneratorOptions): Promise<Buffer>;

export function generateMemeFile(options: MemeGeneratorOptions & { output?: string; out?: string }): Promise<FileRenderResult>;

export function renderMeme(options: MemeGeneratorOptions): Promise<RenderResult>;

export function layoutMemeText(options: LayoutOnlyOptions): LayoutOnlyResult;
