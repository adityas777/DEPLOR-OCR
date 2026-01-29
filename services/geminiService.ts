
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { OCRMode } from "../types";
import { PROMPTS } from "../constants";

// Correctly initialize GoogleGenAI with the API key from environment variables
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export class GeminiOCRService {
  async processImage(
    base64Image: string, 
    mode: OCRMode, 
    rawTextInput?: string
  ): Promise<any> {
    const isJsonMode = [
      OCRMode.LAYOUT, 
      OCRMode.TRANSLATION, 
      OCRMode.ENTITIES, 
      OCRMode.MASTER
    ].includes(mode);

    const modelName = 'gemini-3-flash-preview';
    const prompt = PROMPTS[mode];

    // Build parts
    const parts: any[] = [];
    
    if (mode === OCRMode.CLEANING && rawTextInput) {
      parts.push({ text: `Raw Text Input to Clean:\n\n${rawTextInput}\n\n` });
    }
    
    parts.push({ text: prompt });
    
    if (base64Image) {
      parts.push({
        inlineData: {
          mimeType: 'image/png',
          data: base64Image.split(',')[1] || base64Image
        }
      });
    }

    try {
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: modelName,
        contents: { parts },
        config: {
          temperature: 0.25,
          responseMimeType: isJsonMode ? "application/json" : "text/plain",
        }
      });

      // Using .text property as per GenerateContentResponse guidelines
      const text = response.text || "";
      
      if (isJsonMode) {
        try {
          return JSON.parse(text);
        } catch (e) {
          console.error("Failed to parse JSON response:", text);
          return { error: "Invalid JSON response from model", raw: text };
        }
      }

      return text;
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  }
}

export const geminiService = new GeminiOCRService();
