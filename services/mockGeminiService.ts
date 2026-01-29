import { OCRMode } from "../types";

// Mock data that simulates realistic Hindi legal document processing
const MOCK_RESPONSES = {
  [OCRMode.MASTER]: {
    clean_hindi_text: `प्राथमिकी संख्या: 123/2024
थाना: कोतवाली, दिल्ली
दिनांक: 15 जनवरी 2024
समय: रात्रि 10:30 बजे

अभियुक्त का नाम: राम कुमार
पिता का नाम: श्याम लाल
निवास: गली नंबर 5, करोल बाग, दिल्ली

पीड़ित का नाम: सुनीता देवी  
पिता का नाम: मोहन लाल
निवास: हाउस नंबर 42, लाजपत नगर, दिल्ली

घटना का विवरण: दिनांक 15.01.2024 को रात्रि लगभग 10:30 बजे अभियुक्त राम कुमार द्वारा पीड़िता सुनीता देवी के साथ मारपीट की गई। अभियुक्त ने पीड़िता के गहने छीनने का प्रयास किया। पीड़िता की चीख-पुकार सुनकर आस-पास के लोग एकत्रित हो गए।

धारा: भारतीय दंड संहिता की धारा 323, 379
पुलिस अधिकारी: सब इंस्पेक्टर अजय शर्मा`,
    
    structured_data: {
      police_station: "कोतवाली, दिल्ली",
      incident_timing: "15 जनवरी 2024, रात्रि 10:30 बजे",
      people_involved: {
        accused: "राम कुमार (पिता: श्याम लाल)",
        victim: "सुनीता देवी (पिता: मोहन लाल)"
      },
      additional_fields: {
        "FIR Number": "123/2024",
        "IPC Sections": "धारा 323, 379",
        "Investigating Officer": "सब इंस्पेक्टर अजय शर्मा",
        "Location": "करोल बाग, दिल्ली",
        "Case Type": "मारपीट और चोरी का प्रयास"
      }
    }
  }
};

// Alternative mock responses for variety
const ALTERNATIVE_RESPONSES = [
  {
    clean_hindi_text: `प्राथमिकी संख्या: 456/2024
थाना: सदर बाजार, मुंबई
दिनांक: 20 फरवरी 2024
समय: दोपहर 2:15 बजे

अभियुक्त का नाम: विकास गुप्ता
पिता का नाम: राजेश गुप्ता
निवास: फ्लैट नंबर 301, अंधेरी पूर्व, मुंबई

पीड़ित का नाम: प्रिया शर्मा
पिता का नाम: सुरेश शर्मा
निवास: बिल्डिंग नंबर 15, बांद्रा पश्चिम, मुंबई

घटना का विवरण: दिनांक 20.02.2024 को दोपहर लगभग 2:15 बजे अभियुक्त विकास गुप्ता द्वारा पीड़िता प्रिया शर्मा के मोबाइल फोन को छीनने का प्रयास किया गया। जब पीड़िता ने विरोध किया तो अभियुक्त ने उसे धक्का दिया।

धारा: भारतीय दंड संहिता की धारा 356, 323
पुलिस अधिकारी: हेड कांस्टेबल रमेश पाटिल`,
    
    structured_data: {
      police_station: "सदर बाजार, मुंबई",
      incident_timing: "20 फरवरी 2024, दोपहर 2:15 बजे",
      people_involved: {
        accused: "विकास गुप्ता (पिता: राजेश गुप्ता)",
        victim: "प्रिया शर्मा (पिता: सुरेश शर्मा)"
      },
      additional_fields: {
        "FIR Number": "456/2024",
        "IPC Sections": "धारा 356, 323",
        "Investigating Officer": "हेड कांस्टेबल रमेश पाटिल",
        "Location": "अंधेरी पूर्व, मुंबई",
        "Case Type": "मोबाइल छीनने का प्रयास"
      }
    }
  },
  {
    clean_hindi_text: `प्राथमिकी संख्या: 789/2024
थाना: सिविल लाइन्स, जयपुर
दिनांक: 5 मार्च 2024
समय: शाम 6:45 बजे

अभियुक्त का नाम: अमित वर्मा
पिता का नाम: सुनील वर्मा
निवास: सेक्टर 12, मालवीय नगर, जयपुर

पीड़ित का नाम: अनिता गुप्ता
पति का नाम: राहुल गुप्ता
निवास: हाउस नंबर 67, सी-स्कीम, जयपुर

घटना का विवरण: दिनांक 05.03.2024 को शाम लगभग 6:45 बजे अभियुक्त अमित वर्मा द्वारा पीड़िता अनिता गुप्ता के पर्स को छीनने का प्रयास किया गया। घटना बस स्टैंड के पास घटित हुई। अभियुक्त मोटरसाइकिल पर सवार था।

धारा: भारतीय दंड संहिता की धारा 392, 511
पुलिस अधिकारी: एएसआई मनोज कुमार`,
    
    structured_data: {
      police_station: "सिविल लाइन्स, जयपुर",
      incident_timing: "5 मार्च 2024, शाम 6:45 बजे",
      people_involved: {
        accused: "अमित वर्मा (पिता: सुनील वर्मा)",
        victim: "अनिता गुप्ता (पति: राहुल गुप्ता)"
      },
      additional_fields: {
        "FIR Number": "789/2024",
        "IPC Sections": "धारा 392, 511",
        "Investigating Officer": "एएसआई मनोज कुमार",
        "Location": "बस स्टैंड, सी-स्कीम, जयपुर",
        "Case Type": "पर्स छीनने का प्रयास",
        "Vehicle Used": "मोटरसाइकिल"
      }
    }
  }
];

export class MockGeminiOCRService {
  private responseIndex = 0;

  async processImage(
    base64Image: string, 
    mode: OCRMode, 
    rawTextInput?: string
  ): Promise<any> {
    // Simulate API processing delay
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1000));

    // Return different responses to simulate variety
    if (mode === OCRMode.MASTER) {
      if (Math.random() > 0.5 && ALTERNATIVE_RESPONSES.length > 0) {
        const response = ALTERNATIVE_RESPONSES[this.responseIndex % ALTERNATIVE_RESPONSES.length];
        this.responseIndex++;
        return response;
      }
      return MOCK_RESPONSES[mode];
    }

    // For other modes, return appropriate mock data
    switch (mode) {
      case OCRMode.CLEANING:
        return `प्राथमिकी संख्या: 123/2024
थाना: कोतवाली, दिल्ली
दिनांक: 15 जनवरी 2024
समय: रात्रि 10:30 बजे

अभियुक्त का नाम: राम कुमार
पीड़ित का नाम: सुनीता देवी

घटना का विवरण: मारपीट और गहने छीनने का प्रयास।`;

      case OCRMode.LAYOUT:
        return {
          header: "प्राथमिकी संख्या: 123/2024",
          body: "घटना का विवरण...",
          footer: "पुलिस अधिकारी हस्ताक्षर"
        };

      case OCRMode.TRANSLATION:
        return {
          hindi_text: "अभियुक्त का नाम: राम कुमार",
          english_translation: "Name of Accused: Ram Kumar"
        };

      case OCRMode.ENTITIES:
        return {
          persons: ["राम कुमार", "सुनीता देवी"],
          locations: ["कोतवाली", "दिल्ली"],
          dates: ["15 जनवरी 2024"],
          legal_sections: ["धारा 323", "धारा 379"]
        };

      default:
        return "Mock processing completed successfully.";
    }
  }
}

export const mockGeminiService = new MockGeminiOCRService();