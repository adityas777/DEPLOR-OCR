
export enum OCRMode {
  BASE = 'BASE',
  LAYOUT = 'LAYOUT',
  HANDWRITING = 'HANDWRITING',
  CLEANING = 'CLEANING',
  TRANSLATION = 'TRANSLATION',
  ENTITIES = 'ENTITIES',
  MASTER = 'MASTER'
}

export interface OCRResult {
  rawText?: string;
  jsonOutput?: any;
  mode: OCRMode;
  timestamp: number;
  imageUrl?: string;
}

export interface ProcessingState {
  isProcessing: boolean;
  step: string;
  progress: number;
}
