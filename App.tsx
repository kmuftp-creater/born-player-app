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

  // --- 我們修改的函式從這裡開始 ---
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
      
      setIsGeneratingImage(true);

      // --- 包含全球各國的「智慧型圖片資料庫」 ---
      const countryImages: { [key: string]: string[] } = {
        // --- 亞洲 ---
        'japan': [
          'https://images.unsplash.com/photo-1524413840807-0c36798388a1?q=80&w=2070&auto=format&fit=crop', // 東京 淺草寺
          'https://images.unsplash.com/photo-1554797589-724ac63dc831?q=80&w=2070&auto=format&fit=crop', // 京都 伏見稻荷
          'https://images.unsplash.com/photo-1624253321171-1be53e12f5f4?q=80&w=2070&auto=format&fit=crop', // 大阪 道頓堀
          'https://images.unsplash.com/photo-1534009993213-7b4397d4a599?q=80&w=1974&auto=format&fit=crop', // 北海道 札幌
          'https://images.unsplash.com/photo-1617466487042-3ea4b95b7978?q=80&w=2070&auto=format&fit=crop', // 沖繩 海灘
        ],
        'taiwan': [
            'https://images.unsplash.com/photo-1599789438273-02b66d40f4d1?q=80&w=2070&auto=format&fit=crop', // 台北101
            'https://images.unsplash.com/photo-1629018413596-a874b8830386?q=80&w=2070&auto=format&fit=crop', // 花蓮 太魯閣
            'https://images.unsplash.com/photo-1584315794125-6351b8a5d20f?q=80&w=2070&auto=format&fit=crop', // 台中 高美濕地
            'https://images.unsplash.com/photo-1568252252103-9d10a2736822?q=80&w=2070&auto=format&fit=crop', // 高雄 龍虎塔
            'https://images.unsplash.com/photo-1620942589998-3c39ace71d7d?q=80&w=1974&auto=format&fit=crop', // 九份
        ],
        'korea': [
            'https://images.unsplash.com/photo-1558403194-6017253b2368?q=80&w=2070&auto=format&fit=crop', // 首爾 景福宮
            'https://images.unsplash.com/photo-1622332152336-24e525a74581?q=80&w=1932&auto=format&fit=crop', // 釜山 甘川洞
            'https://images.unsplash.com/photo-1582211244837-1e5f03d528b7?q=80&w=2071&auto=format&fit=crop', // 濟州島
            'https://images.unsplash.com/photo-1612683938734-7104b5a0346c?q=80&w=1974&auto=format&fit=crop', // 首爾塔
            'https://images.unsplash.com/photo-1542038784-56e28e43493b?q=80&w=2070&auto=format&fit=crop', // 首爾 街景
        ],
        'vietnam': [
            'https://images.unsplash.com/photo-1515849887535-3cfa5ab7c429?q=80&w=2098&auto=format&fit=crop', // 下龍灣
            'https://images.unsplash.com/photo-1528181304800-259b08848526?q=80&w=2070&auto=format&fit=crop', // 峴港
            'https://images.unsplash.com/photo-1555921015-5532091f6026?q=80&w=2070&auto=format&fit=crop', // 胡志明市
        ],
        'thailand': [
            'https://images.unsplash.com/photo-1597531777494-a174094a9a83?q=80&w=2070&auto=format&fit=crop', // 曼谷
            'https://images.unsplash.com/photo-1579733036613-2d131f4a97b2?q=80&w=1974&auto=format&fit=crop', // 清邁
            'https://images.unsplash.com/photo-1540202404-1b927e27f293?q=80&w=2070&auto=format&fit=crop', // 普吉島
        ],
        'china': [
            'https://images.unsplash.com/photo-1543163353-a5b512a52427?q=80&w=2070&auto=format&fit=crop', // 北京 長城
            'https://images.unsplash.com/photo-1618496424208-01383783c500?q=80&w=2070&auto=format&fit=crop', // 上海
            'https://images.unsplash.com/photo-1574042812044-b0267a1b94b7?q=80&w=2070&auto=format&fit=crop', // 桂林
        ],
        'indonesia': [
            'https://images.unsplash.com/photo-1544378382-5ea81d6c8b9d?q=80&w=2070&auto=format&fit=crop', // 峇里島
        ],
        // --- 歐洲 ---
        'italy': [
          'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?q=80&w=2070&auto=format&fit=crop', // 威尼斯
          'https://images.unsplash.com/photo-1528211516428-53e72c575a8b?q=80&w=2070&auto=format&fit=crop', // 羅馬
        ],
        'france': [
          'https://images.unsplash.com/photo-1502602898657-3e91760c0341?q=80&w=2070&auto=format&fit=crop', // 巴黎
        ],
        'uk': [
            'https://images.unsplash.com/photo-1533929736458-ca5889122775?q=80&w=2070&auto=format&fit=crop', // 倫敦
        ],
        'greece': [
            'https://images.unsplash.com/photo-1562979314-190f3c2e1092?q=80&w=2070&auto=format&fit=crop', // 聖托里尼
        ],
        'switzerland': [
            'https://images.unsplash.com/photo-1588614959068-0e97c933b342?q=80&w=2070&auto=format&fit=crop', // 瑞士
        ],
        'turkey': [
            'https://images.unsplash.com/photo-1569949381669-ecf31ae8e613?q=80&w=2070&auto=format&fit=crop', // 卡帕多奇亞
        ],
        'iceland': [
            'https://images.unsplash.com/photo-1547539329-0d196c1b3e70?q=80&w=2070&auto=format&fit=crop', // 極光
        ],
        'netherlands': [
            'https://images.unsplash.com/photo-1526048598681-46c003c2b8b9?q=80&w=2070&auto=format&fit=crop', // 阿姆斯特丹
        ],
        'spain': [
            'https://images.unsplash.com/photo-1581430049591-e27538890799?q=80&w=2070&auto=format&fit=crop', // 巴塞隆納
        ],
        // --- 美洲 ---
        'usa': [
            'https://images.unsplash.com/photo-1529655683826-1c21ef24a42b?q=80&w=1974&auto=format&fit=crop', // 紐約
        ],
        'canada': [
            'https://images.unsplash.com/photo-1505881502353-a180d4737233?q=80&w=2070&auto=format&fit=crop', // 洛磯山脈
        ],
        // --- 大洋洲 ---
        'australia': [
            'https://images.unsplash.com/photo-1541417904953-524c9c289e47?q=80&w=2071&auto=format&fit=crop', // 雪梨
        ],
        // --- 其他 ---
        'uae': [
            'https://images.unsplash.com/photo-1517935706615-2717063c2225?q=80&w=2070&auto=format&fit=crop', // 沙漠
        ],
        // --- 通用備用圖片 ---
        'general': [
            'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2070&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2074&auto=format&fit=crop',
        ]
      };
      
      const imagePrompt = `Photorealistic, vibrant travel photograph of ${plan.destination}, focusing on ${plan.tripTitle}. High quality, cinematic, 16:9 aspect ratio. No text or people.`;
      
      generateTripImage(imagePrompt).then(imageUrl => {
          let finalPlan;
          if (imageUrl) {
            finalPlan = { ...planWithId, tripImageUrl: `data:image/jpeg;base64,${imageUrl}` };
          } else {
            const lowerCaseDestination = plan.destination.toLowerCase();
            let matchedKey = 'general';

            for (const key in countryImages) {
                if (key !== 'general' && (lowerCaseDestination.includes(key) || plan.tripTitle.toLowerCase().includes(key))) {
                    matchedKey = key;
                    break;
                }
            }
            
            const imageList = countryImages[matchedKey];
            const randomIndex = Math.floor(Math.random() * imageList.length);
            const randomDefaultImageUrl = imageList[randomIndex];

            finalPlan = { ...planWithId, tripImageUrl: randomDefaultImageUrl };
          }
          setItinerary(currentItinerary => (currentItinerary?.id === finalPlan.id ? finalPlan : currentItinerary));
          setHistory(prev => prev.map(p => p.id === finalPlan.id ? finalPlan : p));
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
  // --- 函式修改結束 ---
  
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
