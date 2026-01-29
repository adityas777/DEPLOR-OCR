
import { OCRMode } from './types';

export const PROMPTS = {
  [OCRMode.MASTER]: `You are a forensic document reconstruction and legal intelligence system specializing in Indian government records.
  
Task:
1. Extract and normalize all text from the scanned document, removing OCR noise.
2. Reconstruct the content into clean, human-readable paragraphs with proper Devanagari grammar.
3. Extract specific structured data:
   - Police Station (थाना): Name of the station.
   - Timing of Incident (घटना का समय): Date and time.
   - People Involved: Specifically identify 'Accused' (अभियुक्त) and 'Victim' (पीड़ित).
   - Additional Data: Extract any other relevant metadata found (FIR No, IPC Sections, District, etc.).

Strict rules:
- If a field is not found, return "Null".
- Restore correct Hindi/English words and correct spacing.
- Maintain logical document structure (Headings, Numbered sections).

Output format (JSON ONLY):
{
  "clean_hindi_text": "Normalized reconstructed text content",
  "structured_data": {
    "police_station": "Station name or Null",
    "incident_timing": "Time and date or Null",
    "people_involved": {
      "accused": "Accused names or Null",
      "victim": "Victim names or Null"
    },
    "additional_fields": {
       "key": "value"
    }
  },
  "entities": {
    "persons": [],
    "locations": [],
    "dates": []
  }
}`,
  [OCRMode.BASE]: `Extract all Hindi text from the image. Output plain text only.`,
  [OCRMode.LAYOUT]: `Extract text and identify layout.`,
  [OCRMode.HANDWRITING]: `Extract handwritten Devanagari text.`,
  [OCRMode.CLEANING]: `Clean the provided text.`,
  [OCRMode.TRANSLATION]: `Extract and translate.`,
  [OCRMode.ENTITIES]: `Extract entities.`
};

export const DEFAULT_MODE = OCRMode.MASTER;
