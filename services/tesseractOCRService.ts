import Tesseract from 'tesseract.js';
import { OCRMode } from '../types';

export class TesseractOCRService {
  private worker: Tesseract.Worker | null = null;

  async initializeWorker(): Promise<void> {
    if (this.worker) return;

    this.worker = await Tesseract.createWorker('hin+eng', 1, {
      logger: m => {
        if (m.status === 'recognizing text') {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      }
    });

    // Configure for better Hindi recognition
    await this.worker.setParameters({
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789।॥ःअआइईउऊऋएऐओऔकखगघङचछजझञटठडढणतथदधनपफबभमयरलवशषसहक्षत्रज्ञ़ािीुूृेैोौंँ्',
      tessedit_pageseg_mode: Tesseract.PSM.AUTO,
      preserve_interword_spaces: '1',
    });
  }

  async processImage(
    base64Image: string, 
    mode: OCRMode, 
    rawTextInput?: string,
    onProgress?: (progress: number, step: string) => void
  ): Promise<any> {
    try {
      // Initialize worker if not already done
      if (!this.worker) {
        onProgress?.(10, 'Initializing OCR Engine...');
        await this.initializeWorker();
      }

      onProgress?.(30, 'Analyzing Image Structure...');

      // Perform OCR
      const { data } = await this.worker!.recognize(base64Image, {
        rectangle: undefined, // Process entire image
      });

      onProgress?.(70, 'Extracting Hindi Text...');

      const extractedText = data.text.trim();
      
      if (!extractedText) {
        throw new Error('No text detected in image. Please ensure the image contains clear Hindi text.');
      }

      onProgress?.(90, 'Processing Legal Structure...');

      // Process based on mode
      if (mode === OCRMode.MASTER) {
        const structuredResult = this.extractLegalStructure(extractedText);
        onProgress?.(100, 'Complete');
        return structuredResult;
      }

      // For other modes, return appropriate format
      switch (mode) {
        case OCRMode.BASE:
          return extractedText;
        
        case OCRMode.CLEANING:
          return this.cleanText(rawTextInput || extractedText);
        
        case OCRMode.LAYOUT:
          return this.extractLayout(extractedText);
        
        case OCRMode.ENTITIES:
          return this.extractEntities(extractedText);
        
        case OCRMode.TRANSLATION:
          return this.translateText(extractedText);
        
        default:
          return extractedText;
      }

    } catch (error) {
      console.error('OCR Error:', error);
      throw new Error(`OCR processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private extractLegalStructure(text: string): any {
    const cleanText = this.cleanText(text);
    
    // Extract structured data using regex patterns
    const policeStation = this.extractField(cleanText, [
      /थाना[:\s]*([^\n]+)/i,
      /police\s*station[:\s]*([^\n]+)/i,
      /स्टेशन[:\s]*([^\n]+)/i
    ]);

    const incidentTiming = this.extractField(cleanText, [
      /दिनांक[:\s]*([^\n]+)/i,
      /समय[:\s]*([^\n]+)/i,
      /date[:\s]*([^\n]+)/i,
      /time[:\s]*([^\n]+)/i,
      /\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/g
    ]);

    const accused = this.extractField(cleanText, [
      /अभियुक्त[:\s]*([^\n]+)/i,
      /accused[:\s]*([^\n]+)/i,
      /आरोपी[:\s]*([^\n]+)/i
    ]);

    const victim = this.extractField(cleanText, [
      /पीड़ित[:\s]*([^\n]+)/i,
      /victim[:\s]*([^\n]+)/i,
      /शिकायतकर्ता[:\s]*([^\n]+)/i
    ]);

    const firNumber = this.extractField(cleanText, [
      /प्राथमिकी\s*संख्या[:\s]*([^\n]+)/i,
      /fir\s*no[:\s]*([^\n]+)/i,
      /केस\s*नंबर[:\s]*([^\n]+)/i,
      /\d+\/\d{4}/g
    ]);

    const ipcSections = this.extractField(cleanText, [
      /धारा[:\s]*([^\n]+)/i,
      /section[:\s]*([^\n]+)/i,
      /आईपीसी[:\s]*([^\n]+)/i
    ]);

    // Additional fields extraction
    const additionalFields: Record<string, string> = {};
    
    if (firNumber) additionalFields["FIR Number"] = firNumber;
    if (ipcSections) additionalFields["IPC Sections"] = ipcSections;

    // Extract investigating officer
    const officer = this.extractField(cleanText, [
      /पुलिस\s*अधिकारी[:\s]*([^\n]+)/i,
      /investigating\s*officer[:\s]*([^\n]+)/i,
      /अन्वेषण\s*अधिकारी[:\s]*([^\n]+)/i
    ]);
    if (officer) additionalFields["Investigating Officer"] = officer;

    // Extract location
    const location = this.extractField(cleanText, [
      /स्थान[:\s]*([^\n]+)/i,
      /location[:\s]*([^\n]+)/i,
      /पता[:\s]*([^\n]+)/i
    ]);
    if (location) additionalFields["Location"] = location;

    return {
      clean_hindi_text: cleanText,
      structured_data: {
        police_station: policeStation || "Null",
        incident_timing: incidentTiming || "Null",
        people_involved: {
          accused: accused || "Null",
          victim: victim || "Null"
        },
        additional_fields: additionalFields
      },
      entities: this.extractEntities(cleanText),
      confidence: this.calculateConfidence(cleanText)
    };
  }

  private extractField(text: string, patterns: RegExp[]): string | null {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
      // For global patterns, get first match
      if (pattern.global) {
        const matches = text.match(pattern);
        if (matches && matches[0]) {
          return matches[0].trim();
        }
      }
    }
    return null;
  }

  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Multiple spaces to single
      .replace(/([।॥])\s*/g, '$1\n') // Line breaks after Hindi punctuation
      .replace(/(\d+[\/\-\.]\d+[\/\-\.]\d+)/g, '\n$1\n') // Dates on new lines
      .replace(/^[\s\n]+|[\s\n]+$/g, '') // Trim
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n');
  }

  private extractLayout(text: string): any {
    const lines = text.split('\n');
    return {
      header: lines.slice(0, 3).join('\n'),
      body: lines.slice(3, -2).join('\n'),
      footer: lines.slice(-2).join('\n'),
      total_lines: lines.length
    };
  }

  private extractEntities(text: string): any {
    const persons: string[] = [];
    const locations: string[] = [];
    const dates: string[] = [];
    const legal_sections: string[] = [];

    // Extract dates
    const dateMatches = text.match(/\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/g);
    if (dateMatches) dates.push(...dateMatches);

    // Extract legal sections
    const sectionMatches = text.match(/धारा\s*\d+/gi);
    if (sectionMatches) legal_sections.push(...sectionMatches);

    // Extract common Hindi names (basic pattern)
    const nameMatches = text.match(/[अ-ह][अ-ह\s]{2,20}(?=\s|$)/g);
    if (nameMatches) {
      persons.push(...nameMatches.filter(name => name.length > 3));
    }

    return {
      persons: [...new Set(persons)],
      locations: [...new Set(locations)],
      dates: [...new Set(dates)],
      legal_sections: [...new Set(legal_sections)]
    };
  }

  private translateText(text: string): any {
    // Basic word-level translation for common legal terms
    const translations: Record<string, string> = {
      'प्राथमिकी': 'FIR',
      'थाना': 'Police Station',
      'अभियुक्त': 'Accused',
      'पीड़ित': 'Victim',
      'दिनांक': 'Date',
      'समय': 'Time',
      'धारा': 'Section',
      'पुलिस': 'Police',
      'अधिकारी': 'Officer'
    };

    let translatedText = text;
    Object.entries(translations).forEach(([hindi, english]) => {
      translatedText = translatedText.replace(new RegExp(hindi, 'g'), `${hindi} (${english})`);
    });

    return {
      hindi_text: text,
      translated_text: translatedText,
      translations: translations
    };
  }

  private calculateConfidence(text: string): number {
    // Simple confidence calculation based on text characteristics
    let confidence = 0.5;
    
    // Boost confidence for Hindi characters
    const hindiChars = text.match(/[अ-ह]/g);
    if (hindiChars) {
      confidence += Math.min(hindiChars.length / 100, 0.3);
    }

    // Boost for legal keywords
    const legalKeywords = ['प्राथमिकी', 'थाना', 'अभियुक्त', 'पीड़ित', 'धारा'];
    const foundKeywords = legalKeywords.filter(keyword => text.includes(keyword));
    confidence += foundKeywords.length * 0.05;

    return Math.min(confidence, 0.95);
  }

  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}

export const tesseractOCRService = new TesseractOCRService();