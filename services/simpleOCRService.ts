import Tesseract from 'tesseract.js';
import { OCRMode } from '../types';

export class SimpleOCRService {
  private worker: Tesseract.Worker | null = null;

  async processImage(
    base64Image: string, 
    mode: OCRMode, 
    rawTextInput?: string,
    onProgress?: (progress: number, step: string) => void
  ): Promise<any> {
    try {
      onProgress?.(10, 'Initializing OCR...');
      
      // Create worker if not exists
      if (!this.worker) {
        this.worker = await Tesseract.createWorker('hin+eng');
        await this.worker.setParameters({
          tessedit_pageseg_mode: Tesseract.PSM.AUTO,
          preserve_interword_spaces: '1',
        });
      }

      onProgress?.(30, 'Processing Image...');

      // Perform OCR
      const { data } = await this.worker.recognize(base64Image);
      
      onProgress?.(70, 'Extracting Text...');
      
      const extractedText = data.text.trim();
      
      if (!extractedText) {
        throw new Error('No text detected. Please ensure image contains clear text.');
      }

      onProgress?.(90, 'Structuring Data...');

      // Clean and structure the text
      const cleanText = this.cleanText(extractedText);
      const structuredData = this.extractBasicStructure(cleanText);

      onProgress?.(100, 'Complete');

      return {
        clean_hindi_text: cleanText,
        structured_data: structuredData,
        raw_text: extractedText,
        confidence: this.calculateConfidence(extractedText)
      };

    } catch (error) {
      console.error('Simple OCR Error:', error);
      throw new Error(`OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/([।॥])\s*/g, '$1\n')
      .replace(/(\d+[\/\-\.]\d+[\/\-\.]\d+)/g, '\n$1\n')
      .trim()
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n');
  }

  private extractBasicStructure(text: string): any {
    // Simple extraction patterns
    const policeStation = this.extractField(text, /थाना[:\s]*([^\n]+)/i) || 
                         this.extractField(text, /police\s*station[:\s]*([^\n]+)/i);
    
    const timing = this.extractField(text, /दिनांक[:\s]*([^\n]+)/i) ||
                   this.extractField(text, /समय[:\s]*([^\n]+)/i) ||
                   this.extractField(text, /\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/);
    
    const accused = this.extractField(text, /अभियुक्त[:\s]*([^\n]+)/i) ||
                    this.extractField(text, /accused[:\s]*([^\n]+)/i);
    
    const victim = this.extractField(text, /पीड़ित[:\s]*([^\n]+)/i) ||
                   this.extractField(text, /victim[:\s]*([^\n]+)/i);

    const firNumber = this.extractField(text, /प्राथमिकी\s*संख्या[:\s]*([^\n]+)/i) ||
                      this.extractField(text, /fir\s*no[:\s]*([^\n]+)/i) ||
                      this.extractField(text, /\d+\/\d{4}/);

    const sections = this.extractField(text, /धारा[:\s]*([^\n]+)/i) ||
                     this.extractField(text, /section[:\s]*([^\n]+)/i);

    const additionalFields: Record<string, string> = {};
    if (firNumber) additionalFields["FIR Number"] = firNumber;
    if (sections) additionalFields["IPC Sections"] = sections;

    return {
      police_station: policeStation || "Null",
      incident_timing: timing || "Null",
      people_involved: {
        accused: accused || "Null",
        victim: victim || "Null"
      },
      additional_fields: additionalFields
    };
  }

  private extractField(text: string, pattern: RegExp): string | null {
    const match = text.match(pattern);
    return match && match[1] ? match[1].trim() : (match && match[0] ? match[0].trim() : null);
  }

  private calculateConfidence(text: string): number {
    let confidence = 0.3;
    
    // Boost for Hindi characters
    const hindiChars = (text.match(/[\u0900-\u097F]/g) || []).length;
    confidence += Math.min(hindiChars / 100, 0.4);
    
    // Boost for legal keywords
    const keywords = ['प्राथमिकी', 'थाना', 'अभियुक्त', 'पीड़ित', 'धारा'];
    const found = keywords.filter(k => text.includes(k)).length;
    confidence += found * 0.06;
    
    return Math.min(confidence, 0.95);
  }

  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}

export const simpleOCRService = new SimpleOCRService();