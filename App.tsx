
import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  X, 
  Loader2, 
  Copy, 
  Check, 
  FileDown, 
  Zap, 
  FileText, 
  User, 
  MapPin, 
  Calendar,
  Building2,
  Clock,
  AlertCircle,
  Users,
  Image as ImageIcon,
  Columns as ColumnsIcon
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { OCRMode, OCRResult, ProcessingState } from './types';
import { mockGeminiService } from './services/mockGeminiService';
import { simpleOCRService } from './services/simpleOCRService';

const App: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [processing, setProcessing] = useState<ProcessingState>({
    isProcessing: false,
    step: '',
    progress: 0
  });
  const [result, setResult] = useState<OCRResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [useRealOCR, setUseRealOCR] = useState(false); // Start with demo mode
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProcess = async () => {
    if (!selectedImage) return;

    const service = useRealOCR ? simpleOCRService : mockGeminiService;

    setProcessing({
      isProcessing: true,
      step: useRealOCR ? 'Initializing OCR...' : 'Generating Demo Data...',
      progress: 10
    });

    try {
      const output = await service.processImage(
        selectedImage, 
        OCRMode.MASTER,
        undefined,
        useRealOCR ? (progress, step) => {
          setProcessing({
            isProcessing: true,
            step: step,
            progress: progress
          });
        } : undefined
      );

      const ocrResult: OCRResult = {
        mode: OCRMode.MASTER,
        timestamp: Date.now(),
        imageUrl: selectedImage,
        rawText: output.clean_hindi_text || '',
        jsonOutput: output
      };

      setResult(ocrResult);
    } catch (error) {
      console.error('Processing Error:', error);
      
      if (useRealOCR) {
        const switchToDemo = confirm(
          `OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}\n\nSwitch to Demo Mode?`
        );
        
        if (switchToDemo) {
          setUseRealOCR(false);
          setTimeout(() => handleProcess(), 500);
          return;
        }
      }
      
      alert(`Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setProcessing({ isProcessing: false, step: '', progress: 0 });
    }
  };

  const downloadAsPDF = async () => {
    if (!result) return;
    const renderArea = document.getElementById('pdf-render-area');
    if (!renderArea) return;

    try {
      setProcessing(prev => ({ ...prev, isProcessing: true, step: 'Generating Forensic PDF Snapshot...' }));
      
      const sd = result.jsonOutput?.structured_data || {};
      const people = sd.people_involved || {};
      const extras = sd.additional_fields || {};

      renderArea.innerHTML = `
        <div style="padding: 20px; border: 10px solid #1e293b; background: #fff;">
          <h1 style="font-size: 28px; font-weight: 900; border-bottom: 3px solid #000; padding-bottom: 10px; margin-bottom: 20px;">LEGAL INTELLIGENCE REPORT</h1>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px;">
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px;">
              <div style="font-size: 10px; color: #64748b; font-weight: 800;">POLICE STATION</div>
              <div style="font-size: 14px; font-weight: 700;">${sd.police_station || 'Null'}</div>
            </div>
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px;">
              <div style="font-size: 10px; color: #64748b; font-weight: 800;">INCIDENT TIMING</div>
              <div style="font-size: 14px; font-weight: 700;">${sd.incident_timing || 'Null'}</div>
            </div>
            <div style="background: #fef2f2; padding: 15px; border-radius: 8px;">
              <div style="font-size: 10px; color: #991b1b; font-weight: 800;">ACCUSED (अभियुक्त)</div>
              <div style="font-size: 14px; font-weight: 700;">${people.accused || 'Null'}</div>
            </div>
            <div style="background: #f0fdf4; padding: 15px; border-radius: 8px;">
              <div style="font-size: 10px; color: #166534; font-weight: 800;">VICTIM (पीड़ित)</div>
              <div style="font-size: 14px; font-weight: 700;">${people.victim || 'Null'}</div>
            </div>
          </div>

          ${Object.entries(extras).length > 0 ? `
            <div style="margin-bottom: 30px; padding: 15px; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px;">
              <div style="font-size: 10px; color: #64748b; font-weight: 800; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 10px;">ADDITIONAL METADATA</div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                ${Object.entries(extras).map(([k, v]) => `
                  <div><span style="font-weight: 800; font-size: 11px;">${k}:</span> <span style="font-size: 11px;">${v}</span></div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <div style="font-size: 10px; color: #64748b; font-weight: 800; margin-bottom: 10px;">NORMALIZED TEXT</div>
          <div style="font-size: 15px; line-height: 2; white-space: pre-wrap; background: #fff; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px;">
            ${result.rawText}
          </div>

          <div style="margin-top: 40px; font-size: 10px; color: #94a3b8; text-align: center;">
            VERIFIED NEURAL EXTRACTION REPORT • ${new Date().toLocaleString()}
          </div>
        </div>
      `;

      const canvas = await html2canvas(renderArea, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const doc = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = doc.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      doc.save(`Legal_Reconstruction_${Date.now()}.pdf`);
    } catch (error) {
      console.error("PDF Export failed:", error);
    } finally {
      setProcessing(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const copyToClipboard = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.rawText || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sd = result?.jsonOutput?.structured_data || {};
  const people = sd.people_involved || {};
  const additionalFields = sd.additional_fields || {};

  // Cleanup OCR worker on unmount
  useEffect(() => {
    return () => {
      if (useRealOCR) {
        simpleOCRService.terminate();
      }
    };
  }, [useRealOCR]);

  return (
    <div className="h-full w-full flex flex-col bg-[#010204]">
      {/* Background Glows */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-900/10 blur-[150px] rounded-full pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-900/10 blur-[150px] rounded-full pointer-events-none"></div>

      {/* Header */}
      <header className="w-full px-8 h-20 flex items-center justify-between z-50 sticky-header flex-shrink-0">
        <div className="flex items-center gap-5 group">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 via-indigo-800 to-slate-900 rounded-2xl flex items-center justify-center shadow-[0_0_35px_rgba(79,70,229,0.3)] group-hover:scale-105 transition-all duration-500 border border-white/5">
            <Zap className="text-white fill-white" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-white flex items-center gap-2">
              DEVANAGARI <span className="text-indigo-400">LEGAL</span>
            </h1>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.5em]">Forensic Reconstruction Core</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* OCR Mode Toggle */}
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-900/50 rounded-xl border border-white/10">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              {useRealOCR ? 'Real OCR' : 'Demo Mode'}
            </span>
            <button
              onClick={() => setUseRealOCR(!useRealOCR)}
              className={`w-8 h-4 rounded-full transition-all ${
                useRealOCR ? 'bg-indigo-600' : 'bg-slate-600'
              }`}
            >
              <div className={`w-3 h-3 bg-white rounded-full transition-transform ${
                useRealOCR ? 'translate-x-4' : 'translate-x-0.5'
              }`}></div>
            </button>
          </div>
          
          {!result && selectedImage && (
             <button
              onClick={handleProcess}
              disabled={processing.isProcessing}
              className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center gap-3 glow-button shadow-2xl disabled:opacity-50"
            >
              {processing.isProcessing ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />}
              {processing.isProcessing ? 'Processing...' : (useRealOCR ? 'Extract Text' : 'Generate Demo')}
            </button>
          )}
          {result && (
            <div className="flex gap-2">
               <button onClick={copyToClipboard} className="p-3 bg-slate-900 border border-white/10 hover:bg-slate-800 rounded-xl text-slate-400 transition-all">
                {copied ? <Check size={20} className="text-emerald-400" /> : <Copy size={20} />}
              </button>
              <button onClick={downloadAsPDF} disabled={processing.isProcessing} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/30 glow-button disabled:opacity-50 flex items-center gap-2">
                 <FileDown size={18} />
                 <span>Export PDF Snapshot</span>
              </button>
            </div>
          )}
          <div className="w-[1px] h-8 bg-white/5 mx-1"></div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-slate-400 transition-all group"
          >
            <Upload size={20} className="group-hover:text-white transition-colors" />
          </button>
        </div>
      </header>

      <main className="flex-1 w-full overflow-hidden flex flex-col p-6 z-10 gap-6">
        
        {!result && !processing.isProcessing && (
          <section className="h-full flex flex-col items-center justify-center animate-in fade-in duration-700">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-full max-w-xl aspect-video rounded-[3rem] border-2 border-dashed border-white/10 glass-card flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500/30 transition-all group overflow-hidden"
            >
              {selectedImage ? (
                <img src={selectedImage} alt="Preview" className="w-full h-full object-contain p-10 opacity-40 group-hover:opacity-100 transition-all duration-700" />
              ) : (
                <div className="flex flex-col items-center gap-6 p-10 text-center">
                  <div className="w-20 h-20 bg-white/5 rounded-[2.5rem] flex items-center justify-center border border-white/5 group-hover:bg-indigo-600/10 transition-all duration-500">
                    <ImageIcon className="text-slate-600 group-hover:text-indigo-400 group-hover:scale-110 transition-all" size={40} />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-3xl font-black text-white tracking-tight uppercase">Import Source</h2>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Legal Documents • FIRs • Affidavits</p>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {(result || processing.isProcessing) && (
          <section className="h-full flex flex-col gap-6 animate-in fade-in duration-1000 overflow-hidden">
            
            {/* Structured Insights Dashboard - FIXED COLUMNS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-shrink-0">
              <div className="glass-card p-4 rounded-2xl border-l-4 border-l-indigo-500">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 size={14} className="text-indigo-400" />
                  <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Police Station / थाना</span>
                </div>
                <p className={`text-sm font-bold truncate ${sd.police_station === 'Null' ? 'text-slate-600' : 'text-white'}`}>
                  {sd.police_station || 'Null'}
                </p>
              </div>
              <div className="glass-card p-4 rounded-2xl border-l-4 border-l-amber-500">
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={14} className="text-amber-400" />
                  <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Incident Timing / समय</span>
                </div>
                <p className={`text-sm font-bold truncate ${sd.incident_timing === 'Null' ? 'text-slate-600' : 'text-white'}`}>
                  {sd.incident_timing || 'Null'}
                </p>
              </div>
              <div className="glass-card p-4 rounded-2xl border-l-4 border-l-red-500">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle size={14} className="text-red-400" />
                  <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Accused / अभियुक्त</span>
                </div>
                <p className={`text-sm font-bold truncate ${people.accused === 'Null' ? 'text-slate-600' : 'text-white'}`}>
                  {people.accused || 'Null'}
                </p>
              </div>
              <div className="glass-card p-4 rounded-2xl border-l-4 border-l-emerald-500">
                <div className="flex items-center gap-2 mb-2">
                  <User size={14} className="text-emerald-400" />
                  <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Victim / पीड़ित</span>
                </div>
                <p className={`text-sm font-bold truncate ${people.victim === 'Null' ? 'text-slate-600' : 'text-white'}`}>
                  {people.victim || 'Null'}
                </p>
              </div>
            </div>

            {/* Dynamic Columns Row */}
            {Object.entries(additionalFields).length > 0 && (
              <div className="flex gap-4 overflow-x-auto pb-2 flex-shrink-0 custom-scrollbar">
                {Object.entries(additionalFields).map(([key, val]) => (
                  <div key={key} className="glass-card px-5 py-3 rounded-xl border border-white/5 flex flex-col gap-1 min-w-[180px]">
                    <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest truncate">{key}</span>
                    <p className="text-[11px] font-bold text-slate-200 truncate">{val as string}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Side-by-Side Comparison Workspace */}
            <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden min-h-0">
              
              {/* Left Pane: Source Image */}
              <div className="flex-1 glass-card rounded-[2.5rem] border border-white/5 flex flex-col shadow-2xl relative overflow-hidden">
                <div className="px-8 py-4 border-b border-white/5 flex items-center justify-between bg-white/5">
                  <div className="flex items-center gap-4">
                    <ImageIcon size={18} className="text-indigo-400" />
                    <span className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500">Original Source Document</span>
                  </div>
                </div>
                <div className="flex-1 p-8 overflow-auto bg-[#0a0c10]/40 custom-scrollbar">
                  <img 
                    src={selectedImage || ''} 
                    alt="Source" 
                    className={`max-w-full h-auto rounded-xl shadow-2xl transition-all duration-1000 ${processing.isProcessing ? 'blur-md opacity-20' : 'opacity-90'}`} 
                  />
                </div>
                {processing.isProcessing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-500 rounded-full animate-spin"></div>
                      <div className="text-center">
                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-indigo-400 animate-pulse mb-2">
                          {processing.step}
                        </p>
                        {useRealOCR && (
                          <div className="w-48 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300 ease-out"
                              style={{ width: `${processing.progress}%` }}
                            ></div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Pane: Normalized Text */}
              <div className="flex-1 glass-card rounded-[2.5rem] border border-white/5 flex flex-col shadow-2xl relative overflow-hidden">
                <div className="px-8 py-4 border-b border-white/5 flex items-center justify-between bg-white/5">
                  <div className="flex items-center gap-4">
                    <ColumnsIcon size={18} className="text-emerald-400" />
                    <span className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500">
                      {useRealOCR ? 'OCR Extract' : 'Demo Extract'}
                    </span>
                  </div>
                  {!processing.isProcessing && (
                    <div className="flex items-center gap-3">
                      {result?.jsonOutput?.confidence && (
                        <div className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full">
                          <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest">
                            {Math.round(result.jsonOutput.confidence * 100)}% Confidence
                          </p>
                        </div>
                      )}
                      <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                        <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">
                          {useRealOCR ? 'OCR Result' : 'Demo Result'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex-1 p-12 overflow-auto bg-[#0a0c10]/40 custom-scrollbar">
                  {processing.isProcessing ? (
                    <div className="space-y-8">
                      <div className="h-4 bg-white/5 rounded-full w-3/4 animate-pulse"></div>
                      <div className="h-3 bg-white/5 rounded-full w-full animate-pulse"></div>
                      <div className="h-3 bg-white/5 rounded-full w-5/6 animate-pulse"></div>
                      <div className="h-64 bg-white/5 rounded-3xl w-full animate-pulse"></div>
                    </div>
                  ) : (
                    <div className="devanagari text-2xl leading-[2.4] text-slate-200 whitespace-pre-wrap selection:bg-indigo-500/50">
                      {result?.rawText || "Awaiting intelligence execution..."}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
      </main>

      <footer className="w-full py-5 text-center z-10 opacity-30 flex-shrink-0">
        <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.8em]">
          End-to-End Neural Normalization &bull; Gemini 3.0 Vision
        </p>
      </footer>
    </div>
  );
};

export default App;
