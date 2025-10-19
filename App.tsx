
import React, { useState, useCallback, useEffect } from 'react';
import ItineraryForm from './components/ItineraryForm';
import ItineraryDisplay from './components/ItineraryDisplay';
import LanguageSwitcher from './components/LanguageSwitcher';
import FollowUpForm from './components/FollowUpForm';
import HistoryPanel from './components/HistoryPanel';
import { ItineraryPlan, Language } from './types';
import { generateItinerary, refineItinerary, generateTripImage } from './services/geminiService';
import { TRANSLATIONS } from './constants';
import { PlaneTakeoff, PlusSquare, History, RotateCcw } from 'lucide-react';

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>('zh-TW');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefining, setIsRefining] = useState<boolean>(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [itinerary, setItinerary] = useState<ItineraryPlan | null>(null);
  const [history, setHistory] = useState<ItineraryPlan[]>([]);
  const [sidebarView, setSidebarView] = useState<'form' | 'history'>('form');
  const [formKey, setFormKey] = useState(() => Date.now());

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem('tripHistory');
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (e) {
      console.error("Failed to parse history from localStorage", e);
      setHistory([]);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('tripHistory', JSON.stringify(history));
    } catch (e) {
      console.error("Failed to save history to localStorage", e);
    }
  }, [history]);

  const t = TRANSLATIONS[language];

  const handleStartOver = () => {
    setItinerary(null);
    setError(null);
    setIsLoading(false);
    setIsRefining(false);
    setIsGeneratingImage(false);
    setSidebarView('form');
    setFormKey(Date.now());
  };

  const handleGenerateItinerary = useCallback(async (
    destination: string,
    duration: string,
    arrivalTime: string,
    interests: string[],
    startDate: string,
    draftContent: string | null,
  ) => {
    setIsLoading(true);
    setIsGeneratingImage(false);
    setError(null);
    setItinerary(null);
    try {
      const plan = await generateItinerary(destination, duration, arrivalTime, interests, startDate, language, draftContent);
      const planWithId = { ...plan, id: Date.now().toString() };
      setItinerary(planWithId);
      setHistory(prev => [planWithId, ...prev.filter(p => p.id !== planWithId.id)]);
      
      // Start generating image non-blockingly
      setIsGeneratingImage(true);
      const imagePrompt = `Photorealistic, vibrant travel photograph of ${plan.destination}, focusing on ${plan.tripTitle}. High quality, cinematic, 16:9 aspect ratio. No text or people.`;
      generateTripImage(imagePrompt).then(imageUrl => {
          if (imageUrl) {
              const finalPlan = { ...planWithId, tripImageUrl: `data:image/jpeg;base64,${imageUrl}` };
              setItinerary(currentItinerary => (currentItinerary?.id === finalPlan.id ? finalPlan : currentItinerary));
              setHistory(prev => prev.map(p => p.id === finalPlan.id ? finalPlan : p));
          }
      }).finally(() => {
          setIsGeneratingImage(false);
      });

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [language]);
  
  const handleRefineItinerary = useCallback(async (prompt: string) => {
    if (!itinerary) return;
    setIsRefining(true);
    setError(null);
    try {
      const refinedPlan = await refineItinerary(itinerary, prompt, language);
      const updatedPlan = { ...refinedPlan, id: itinerary.id, tripImageUrl: itinerary.tripImageUrl }; // Keep existing image
      setItinerary(updatedPlan);
      setHistory(prev => prev.map(p => p.id === updatedPlan.id ? updatedPlan : p));
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred while refining.');
    } finally {
      setIsRefining(false);
    }
  }, [itinerary, language]);

  const handleSelectHistory = (plan: ItineraryPlan) => {
    setItinerary(plan);
    setError(null);
  };

  const handleDeleteHistory = (id: string) => {
    setHistory(prev => prev.filter(p => p.id !== id));
    if (itinerary?.id === id) {
      setItinerary(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 flex flex-col print:bg-white">
      <header className="bg-white shadow-md sticky top-0 z-20 print:hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <PlaneTakeoff className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t.appName}</h1>
            </div>
            <div className="flex items-center space-x-2">
               <button onClick={handleStartOver} className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm">
                 <RotateCcw className="h-4 w-4" />
                 <span>{t.startOver}</span>
               </button>
              <LanguageSwitcher
                currentLanguage={language}
                onLanguageChange={setLanguage}
                translations={t}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
          <div className="lg:col-span-4 xl:col-span-3 print:hidden">
            <div className="sticky top-24">
              <div className="flex border-b border-gray-200 mb-4">
                  <button onClick={() => setSidebarView('form')} className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-2 ${sidebarView === 'form' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}>
                      <PlusSquare size={16}/> {t.newTrip}
                  </button>
                  <button onClick={() => setSidebarView('history')} className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-2 ${sidebarView === 'history' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}>
                      <History size={16}/> {t.tripHistory}
                  </button>
              </div>
              <div className={sidebarView === 'form' ? '' : 'hidden'}>
                <ItineraryForm
                  key={formKey}
                  onSubmit={handleGenerateItinerary}
                  isLoading={isLoading}
                  translations={t}
                />
              </div>
              <div className={sidebarView === 'history' ? '' : 'hidden'}>
                <HistoryPanel 
                  history={history}
                  onSelect={handleSelectHistory}
                  onDelete={handleDeleteHistory}
                  translations={t}
                />
              </div>
            </div>
          </div>
          <div className="lg:col-span-8 xl:col-span-9">
             <ItineraryDisplay
              itinerary={itinerary}
              isLoading={isRefining}
              isGeneratingImage={isGeneratingImage}
              error={error}
              translations={t}
            />
            {itinerary && !isLoading && !error && (
              <div className="mt-8 print:hidden">
                <FollowUpForm
                  onSubmit={handleRefineItinerary}
                  isLoading={isRefining}
                  translations={t}
                  suggestions={itinerary.suggestedFollowUps || []}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="bg-white border-t mt-8 print:hidden">
        <div className="container mx-auto py-4 px-4 sm:px-6 lg:px-8 text-center text-gray-500 text-sm">
          <p>v.0.3.3 &copy; {t.copyright}</p>
        </div>
      </footer>
    </div>
  );
};

export default App;