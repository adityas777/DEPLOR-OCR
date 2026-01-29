# 🚀 DEVANAGARI LEGAL - Hindi OCR System

A sophisticated Hindi OCR (Optical Character Recognition) system specifically designed for Indian legal documents like FIRs (First Information Reports). Features a beautiful dark UI with real-time processing and intelligent data extraction.

![Hindi OCR Demo](https://img.shields.io/badge/Status-Live-brightgreen) ![OCR Engine](https://img.shields.io/badge/OCR-Tesseract.js-blue) ![Framework](https://img.shields.io/badge/Framework-React-61dafb) ![Language](https://img.shields.io/badge/Language-Hindi%20%2B%20English-orange)

## ✨ Features

### 🎯 **Dual Mode Operation**
- **Demo Mode**: Instant results with realistic legal document data
- **Real OCR Mode**: Actual text recognition from uploaded images

### 🔍 **Intelligent Extraction**
- **Police Station** (थाना) detection
- **FIR Number** (प्राथमिकी संख्या) extraction
- **Accused** (अभियुक्त) identification
- **Victim** (पीड़ित) details
- **Incident Timing** (घटना का समय)
- **IPC Sections** (धारा) recognition

### 🎨 **Professional Interface**
- Dark theme with forensic styling
- Real-time progress tracking
- Confidence scoring for OCR results
- Side-by-side image and text comparison
- PDF export functionality
- Copy-to-clipboard support

### 🌐 **Offline Capability**
- No API keys required
- Completely offline after initial load
- Client-side processing
- Privacy-focused design

## 🚀 Live Demo

**[View Live Application](https://adityas777.github.io/DEPLOR-OCR/)**

## 📸 Screenshots

### Main Interface
![Main Interface](https://via.placeholder.com/800x400/0a0c10/ffffff?text=Hindi+OCR+Interface)

### Processing View
![Processing](https://via.placeholder.com/800x400/1e293b/ffffff?text=OCR+Processing+View)

### Results Dashboard
![Results](https://via.placeholder.com/800x400/0f172a/ffffff?text=Extracted+Data+Dashboard)

## 🛠️ Technology Stack

- **Frontend**: React 19.2.3 + TypeScript
- **OCR Engine**: Tesseract.js (Hindi + English)
- **Image Processing**: Jimp
- **PDF Generation**: jsPDF + html2canvas
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Styling**: Tailwind CSS (via classes)

## 🏃‍♂️ Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/adityas777/DEPLOR-OCR.git
cd DEPLOR-OCR

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Development URLs
- **Development**: http://localhost:3001
- **Production Preview**: http://localhost:4173

## 📖 Usage Guide

### 1. **Demo Mode** (Recommended for First Use)
- Toggle is set to "Demo Mode" by default
- Upload any image
- Click "Generate Demo"
- See instant realistic results

### 2. **Real OCR Mode** (For Actual Processing)
- Toggle switch to "Real OCR"
- Upload clear Hindi legal document image
- Click "Extract Text"
- Wait for processing (10-30 seconds)
- View extracted and structured data

### 3. **Best OCR Results**
- **High resolution images** (300+ DPI)
- **Good lighting** and contrast
- **Straight text** (not rotated)
- **Clear printed text** works better than handwritten
- **Clean background** without noise

## 📁 Project Structure

```
DEPLOR-OCR/
├── src/
│   ├── App.tsx                 # Main application component
│   ├── types.ts               # TypeScript type definitions
│   ├── constants.tsx          # OCR prompts and configurations
│   └── services/
│       ├── mockGeminiService.ts    # Demo mode service
│       ├── simpleOCRService.ts     # Real OCR implementation
│       ├── tesseractOCRService.ts  # Advanced OCR (backup)
│       └── enhancedOCRService.ts   # Enhanced OCR (experimental)
├── dist/                      # Production build
├── public/                    # Static assets
└── package.json              # Dependencies and scripts
```

## 🔧 Configuration

### Environment Variables
```bash
# Optional - not required for current implementation
VITE_GEMINI_API_KEY=""
```

### OCR Settings
The OCR engine can be configured in `services/simpleOCRService.ts`:
- Language models: Hindi + English
- Page segmentation mode: AUTO
- Character whitelist: Customizable
- Confidence thresholds: Adjustable

## 🚀 Deployment

### GitHub Pages (Recommended)
```bash
# Build the project
npm run build

# Deploy to GitHub Pages
# (Automated via GitHub Actions)
```

### Manual Deployment
```bash
# Build for production
npm run build

# Deploy the dist/ folder to any static hosting service
# - Netlify
# - Vercel  
# - Firebase Hosting
# - AWS S3
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Tesseract.js** - OCR engine
- **Google Fonts** - Typography
- **Lucide** - Beautiful icons
- **React Community** - Framework and ecosystem

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/adityas777/DEPLOR-OCR/issues)
- **Discussions**: [GitHub Discussions](https://github.com/adityas777/DEPLOR-OCR/discussions)

## 🔮 Roadmap

- [ ] Mobile app version
- [ ] Batch processing support
- [ ] More Indian languages
- [ ] Advanced legal document templates
- [ ] Cloud sync capabilities
- [ ] API integration options

---

**Made with ❤️ for the Indian Legal System**

*Empowering legal professionals with modern OCR technology*