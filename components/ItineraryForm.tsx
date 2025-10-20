
import React, { useState, useRef } from 'react';
import { Translations } from '../types';
import { INTEREST_OPTIONS } from '../constants';
import { Send, Upload, X, Plus } from 'lucide-react';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
// 直接匯入 worker，讓 Vite 幫我們打包，而不是從網路下載
import 'pdfjs-dist/build/pdf.worker.entry';
 
interface ItineraryFormProps {
  onSubmit: (destination: string, duration: string, arrivalTime: string, interests: string[], startDate: string, draftContent: string | null) => void;
  isLoading: boolean;
  translations: Translations;
}

const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};


const ItineraryForm: React.FC<ItineraryFormProps> = ({ onSubmit, isLoading, translations }) => {
  const [destination, setDestination] = useState('');
  const [duration, setDuration] = useState('');
  const [arrivalTime, setArrivalTime] = useState('12:30');
  const [startDate, setStartDate] = useState(getTodayDateString());
  const [interests, setInterests] = useState<string[]>([]);
  const [customInterest, setCustomInterest] = useState('');
  const [draftContent, setDraftContent] = useState<string | null>(null);
  const [draftFileName, setDraftFileName] = useState<string>('');
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInterestChange = (interest: string) => {
    setInterests(prev =>
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  };

  const handleAddCustomInterest = () => {
    const trimmedInterest = customInterest.trim();
    if (trimmedInterest && !interests.includes(trimmedInterest)) {
        setInterests(prev => [...prev, trimmedInterest]);
    }
    setCustomInterest('');
  };

  const handleCustomInterestKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        handleAddCustomInterest();
    }
  };
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setDraftFileName(file.name);
    setDraftContent(null);
    event.target.value = ''; // Reset file input to allow re-uploading the same file

    try {
        let text = '';
        const extension = file.name.split('.').pop()?.toLowerCase();
        
        if (['txt', 'md'].includes(extension || '')) {
            text = await file.text();
        } else if (['doc', 'docx'].includes(extension || '')) {
            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.extractRawText({ arrayBuffer });
            text = result.value;
        } else if (extension === 'pdf') {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            const pageTexts = await Promise.all(
                Array.from({ length: pdf.numPages }, (_, i) => i + 1).map(async (pageNum) => {
                    const page = await pdf.getPage(pageNum);
                    const textContent = await page.getTextContent();
                    return textContent.items.map(item => 'str' in item ? item.str : '').join(' ');
                })
            );
            text = pageTexts.join('\n\n');
        } else {
            setDraftFileName(`Unsupported: ${file.name}`);
            setDraftContent(`[Error: Unsupported file type. Please upload .txt, .md, .doc, .docx, or .pdf]`);
            setIsParsing(false);
            return;
        }
        setDraftContent(text);
    } catch (error) {
        console.error('Error processing file:', error);
        setDraftFileName(`Error reading: ${file.name}`);
        setDraftContent(`[Error: Could not read content from the file. It might be corrupted or protected.]`);
    } finally {
        setIsParsing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (destination && duration && interests.length > 0 && startDate) {
      onSubmit(destination, duration, arrivalTime, interests, startDate, draftContent);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-1">{translations.destination}</label>
          <input
            type="text"
            id="destination"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition"
            placeholder={translations.destinationPlaceholder}
            required
          />
        </div>
        
        <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">{translations.startDate}</label>
            <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition"
            required
            />
        </div>
        <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">{translations.duration}</label>
            <input
            type="number"
            id="duration"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition"
            placeholder={translations.durationPlaceholder}
            required
            min="1"
            />
        </div>

         <div>
            <label htmlFor="arrivalTime" className="block text-sm font-medium text-gray-700 mb-1">{translations.arrivalTime}</label>
            <input
              type="time"
              id="arrivalTime"
              value={arrivalTime}
              onChange={(e) => setArrivalTime(e.target.value)}
              className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition"
              required
            />
          </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{translations.interests}</label>
          <div className="flex flex-wrap gap-2 mb-3">
             {interests.map(interest => (
                <span key={interest} className="flex items-center bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                    {translations.interestOptions[interest as keyof typeof translations.interestOptions] || interest}
                    <button type="button" onClick={() => handleInterestChange(interest)} className="ml-2 text-blue-500 hover:text-blue-700">
                        <X size={14} />
                    </button>
                </span>
             ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {INTEREST_OPTIONS.filter(opt => !interests.includes(opt)).map(interest => (
              <button
                type="button"
                key={interest}
                onClick={() => handleInterestChange(interest)}
                className="px-3 py-2 text-sm rounded-full border bg-white text-gray-700 hover:bg-gray-100 border-gray-300 transition-all duration-200"
              >
                {translations.interestOptions[interest as keyof typeof translations.interestOptions]}
              </button>
            ))}
          </div>
          <div className="flex mt-3">
             <input
                type="text"
                value={customInterest}
                onChange={(e) => setCustomInterest(e.target.value)}
                onKeyDown={handleCustomInterestKeyDown}
                placeholder={translations.customInterestPlaceholder}
                className="flex-grow w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-l-lg focus:ring-blue-500 focus:border-blue-500 transition"
             />
             <button type="button" onClick={handleAddCustomInterest} className="px-4 py-2 bg-gray-600 text-white border border-gray-600 rounded-r-lg hover:bg-gray-700 flex items-center">
                <Plus size={16} />
             </button>
          </div>
        </div>

        <div className="pt-2">
           <label className="block text-sm font-medium text-gray-700 mb-2">{translations.uploadDraft}</label>
           <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()} 
                className="w-full flex items-center justify-center text-sm bg-gray-100 text-gray-700 font-medium py-2 px-4 rounded-lg hover:bg-gray-200 border border-gray-300 transition-colors disabled:opacity-50 disabled:cursor-wait truncate"
                disabled={isParsing || isLoading}
            >
               {isParsing ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                    </>
                ) : (
                    <>
                       <Upload className="h-4 w-4 mr-2 flex-shrink-0" />
                       <span className="truncate">{draftFileName || translations.uploadDraftDescription}</span>
                    </>
                )}
           </button>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".txt,.md,.doc,.docx,.pdf"
            />
        </div>


        <button
          type="submit"
          disabled={isLoading || isParsing}
          className="w-full flex items-center justify-center bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {translations.generating}
            </>
          ) : (
            <>
            <Send className="h-5 w-5 mr-2" />
            {translations.generateItinerary}
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default ItineraryForm;
