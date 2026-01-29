import Tesseract from 'tesseract.js';
import Jimp from 'jimp';
import { OCRMode } from '../types';

export class EnhancedOCRService {
  private worker: Tesseract.Worker | null = null;

  async initializeWorker(): Promise<void> {
    if (this.worker) return;

    this.worker = await Tesseract.createWorker(['hin', 'eng'], 1, {
      logger: m => {
        if (m.status === 'recognizing text') {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      }
    });

    // Enhanced parameters for better Hindi recognition
    await this.worker.setParameters({
      tessedit_pageseg_mode: Tesseract.PSM.AUTO,
      tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY,
      preserve_interword_spaces: '1',
      tessedit_char_whitelist: '',
      tessedit_write_images: '0',
      user_defined_dpi: '300',
      textord_really_old_xheight: '1',
      textord_min_xheight: '10',
      classify_enable_learning: '0',
      classify_enable_adaptive_matcher: '1',
    });
  }

  async preprocessImage(base64Image: string): Promise<string[]> {
    try {
      // Convert base64 to buffer
      const base64Data = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Load image with Jimp
      const image = await Jimp.read(buffer);
      
      // Create multiple preprocessed versions
      const variants: string[] = [];
      
      // Original (slightly enhanced)
      const original = image.clone()
        .contrast(0.2)
        .brightness(0.1);
      variants.push(await this.imageToBase64(original));
      
      // High contrast version
      const highContrast = image.clone()
        .greyscale()
        .contrast(0.5)
        .brightness(0.2)
        .normalize();
      variants.push(await this.imageToBase64(highContrast));
      
      // Inverted version (for dark backgrounds)
      const inverted = image.clone()
        .greyscale()
        .invert()
        .contrast(0.3);
      variants.push(await this.imageToBase64(inverted));
      
      // Threshold version
      const threshold = image.clone()
        .greyscale()
        .contrast(0.8)
        .brightness(0.3);
      variants.push(await this.imageToBase64(threshold));
      
      return variants;
    } catch (error) {
      console.error('Image preprocessing failed:', error);
      // Return original if preprocessing fails
      return [base64Image];
    }
  }

  private async imageToBase64(image: Jimp): Promise<string> {
    const buffer = await image.getBufferAsync(Jimp.MIME_PNG);
    return `data:image/png;base64,${buffer.toString('base64')}`;
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
        onProgress?.(5, 'Initializing Enhanced OCR Engine...');
        await this.initializeWorker();
      }

      onProgress?.(15, 'Preprocessing Image for Better Recognition...');
      
      // Preprocess image into multiple variants
      const imageVariants = await this.preprocessImage(base64Image);
      
      onProgress?.(25, 'Analyzing Multiple Image Variants...');
      
      // Try OCR on each variant and pick the best result
      let bestResult = '';
      let bestConfidence = 0;
      
      for (let i = 0; i < imageVariants.length; i++) {
        try {
          onProgress?.(30 + (i * 15), `Processing Variant ${i + 1}/${imageVariants.length}...`);
          
          const { data } = await this.worker!.recognize(imageVariants[i]);
          
          // Calculate confidence based on text characteristics
          const confidence = this.calculateTextConfidence(data.text);
          
          if (confidence > bestConfidence) {
            bestResult = data.text;
            bestConfidence = confidence;
          }
          
          // If we get a very good result, stop early
          if (confidence > 0.8) break;
          
        } catch (error) {
          console.warn(`Variant ${i + 1} failed:`, error);
          continue;
        }
      }

      onProgress?.(80, 'Post-processing and Cleaning Text...');

      if (!bestResult.trim()) {
        throw new Error('No readable text detected in any image variant. Please try:\n• Better lighting\n• Higher resolution\n• Clearer text\n• Different angle');
      }

      // Enhanced text cleaning
      const cleanedText = this.enhancedTextCleaning(bestResult);
      
      onProgress?.(95, 'Extracting Legal Structure...');

      // Process based on mode
      if (mode === OCRMode.MASTER) {
        const structuredResult = this.extractLegalStructure(cleanedText);
        structuredResult.ocr_confidence = bestConfidence;
        structuredResult.variants_processed = imageVariants.length;
        onProgress?.(100, 'Complete');
        return structuredResult;
      }

      // For other modes
      switch (mode) {
        case OCRMode.BASE:
          return cleanedText;
        case OCRMode.CLEANING:
          return this.enhancedTextCleaning(rawTextInput || cleanedText);
        default:
          return cleanedText;
      }

    } catch (error) {
      console.error('Enhanced OCR Error:', error);
      throw error;
    }
  }

  private calculateTextConfidence(text: string): number {
    let confidence = 0.1;
    
    // Boost for Hindi characters
    const hindiChars = (text.match(/[\u0900-\u097F]/g) || []).length;
    confidence += Math.min(hindiChars / 50, 0.4);
    
    // Boost for English characters
    const englishChars = (text.match(/[a-zA-Z]/g) || []).length;
    confidence += Math.min(englishChars / 100, 0.2);
    
    // Boost for numbers
    const numbers = (text.match(/\d/g) || []).length;
    confidence += Math.min(numbers / 20, 0.1);
    
    // Penalty for too many special characters (OCR noise)
    const specialChars = (text.match(/[^\w\s\u0900-\u097F।॥]/g) || []).length;
    confidence -= Math.min(specialChars / 50, 0.3);
    
    // Boost for legal keywords
    const legalKeywords = [
      'प्राथमिकी', 'थाना', 'अभियुक्त', 'पीड़ित', 'धारा', 'पुलिस',
      'FIR', 'Police', 'Station', 'Accused', 'Victim', 'Section'
    ];
    const foundKeywords = legalKeywords.filter(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())
    ).length;
    confidence += foundKeywords * 0.05;
    
    // Boost for proper sentence structure
    const sentences = text.split(/[।॥.!?]/).filter(s => s.trim().length > 10);
    confidence += Math.min(sentences.length / 10, 0.1);
    
    return Math.min(Math.max(confidence, 0), 1);
  }

  private enhancedTextCleaning(text: string): string {
    return text
      // Fix common OCR errors for Hindi
      .replace(/[|]/g, 'ी') // Common misread of ी
      .replace(/[`']/g, '') // Remove stray quotes
      .replace(/([०-९])\s+([०-९])/g, '$1$2') // Join split numbers
      .replace(/\s+/g, ' ') // Multiple spaces to single
      .replace(/([।॥])\s*/g, '$1\n') // Line breaks after Hindi punctuation
      .replace(/([.!?])\s*/g, '$1\n') // Line breaks after English punctuation
      .replace(/(\d+[\/\-\.]\d+[\/\-\.]\d+)/g, '\n$1\n') // Dates on new lines
      .replace(/^[\s\n]+|[\s\n]+$/g, '') // Trim
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .join('\n')
      // Fix common word corrections
      .replace(/प्राथमिकी/g, 'प्राथमिकी')
      .replace(/अभियुक्त/g, 'अभियुक्त')
      .replace(/पीड़ित/g, 'पीड़ित');
  }

  private extractLegalStructure(text: string): any {
    const cleanText = this.enhancedTextCleaning(text);
    
    // Enhanced field extraction with multiple patterns
    const policeStation = this.extractFieldEnhanced(cleanText, [
      /थाना[:\s]*([^\n]+)/i,
      /police\s*station[:\s]*([^\n]+)/i,
      /स्टेशन[:\s]*([^\n]+)/i,
      /P\.?S\.?\s*([^\n]+)/i
    ]);

    const incidentTiming = this.extractFieldEnhanced(cleanText, [
      /दिनांक[:\s]*([^\n]+)/i,
      /समय[:\s]*([^\n]+)/i,
      /date[:\s]*([^\n]+)/i,
      /time[:\s]*([^\n]+)/i,
      /\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}[^\n]*/g
    ]);

    const accused = this.extractFieldEnhanced(cleanText, [
      /अभियुक्त[:\s]*([^\n]+)/i,
      /accused[:\s]*([^\n]+)/i,
      /आरोपी[:\s]*([^\n]+)/i,
      /नाम[:\s]*([^\n]+)/i
    ]);

    const victim = this.extractFieldEnhanced(cleanText, [
      /पीड़ित[:\s]*([^\n]+)/i,
      /victim[:\s]*([^\n]+)/i,
      /शिकायतकर्ता[:\s]*([^\n]+)/i,
      /complainant[:\s]*([^\n]+)/i
    ]);

    const firNumber = this.extractFieldEnhanced(cleanText, [
      /प्राथमिकी\s*संख्या[:\s]*([^\n]+)/i,
      /fir\s*no[:\s]*([^\n]+)/i,
      /केस\s*नंबर[:\s]*([^\n]+)/i,
      /\d+\/\d{4}/g
    ]);

    const ipcSections = this.extractFieldEnhanced(cleanText, [
      /धारा[:\s]*([^\n]+)/i,
      /section[:\s]*([^\n]+)/i,
      /आईपीसी[:\s]*([^\n]+)/i,
      /IPC[:\s]*([^\n]+)/i
    ]);

    // Additional fields
    const additionalFields: Record<string, string> = {};
    
    if (firNumber) additionalFields["FIR Number"] = firNumber;
    if (ipcSections) additionalFields["IPC Sections"] = ipcSections;

    const officer = this.extractFieldEnhanced(cleanText, [
      /पुलिस\s*अधिकारी[:\s]*([^\n]+)/i,
      /investigating\s*officer[:\s]*([^\n]+)/i,
      /अन्वेषण\s*अधिकारी[:\s]*([^\n]+)/i,
      /IO[:\s]*([^\n]+)/i
    ]);
    if (officer) additionalFields["Investigating Officer"] = officer;

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
      raw_ocr_text: text // Include raw OCR for debugging
    };
  }

  private extractFieldEnhanced(text: string, patterns: RegExp[]): string | null {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1] && match[1].trim().length > 1) {
        return match[1].trim();
      }
      if (pattern.global) {
        const matches = text.match(pattern);
        if (matches && matches[0] && matches[0].trim().length > 1) {
          return matches[0].trim();
        }
      }
    }
    return null;
  }

  private extractEntities(text: string): any {
    const persons: string[] = [];
    const locations: string[] = [];
    const dates: string[] = [];
    const legal_sections: string[] = [];

    // Extract dates (multiple formats)
    const datePatterns = [
      /\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/g,
      /\d{1,2}\s+[जफमअमजजअसअनद]\w+\s+\d{4}/g
    ];
    
    datePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) dates.push(...matches);
    });

    // Extract legal sections
    const sectionMatches = text.match(/धारा\s*\d+/gi);
    if (sectionMatches) legal_sections.push(...sectionMatches);

    return {
      persons: [...new Set(persons)],
      locations: [...new Set(locations)],
      dates: [...new Set(dates)],
      legal_sections: [...new Set(legal_sections)]
    };
  }

  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}

export const enhancedOCRService = new EnhancedOCRService();