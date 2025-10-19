
import React, { useState, useEffect, useMemo } from 'react';
import { ItineraryPlan, Translations, ItineraryItem, GeneralTips, BudgetEstimate, NearbyRecommendation } from '../types';
import { 
    MapPin, Utensils, TramFront, Bed, Activity, StickyNote, Ship, Info, ChevronDown, ChevronUp, ExternalLink,
    Smile, CreditCard, Clock, Calendar, Bus, Wifi, CheckSquare, Trash2, FileText, Download, ThermometerSun, Wallet,
    Building2, ShoppingBag, UtensilsCrossed, Star
} from 'lucide-react';

interface ItineraryDisplayProps {
  itinerary: ItineraryPlan | null;
  isLoading: boolean;
  isGeneratingImage: boolean;
  error: string | null;
  translations: Translations;
}

const LoadingState: React.FC<{ translations: Translations }> = ({ translations }) => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex(prevIndex => (prevIndex + 1) % translations.loadingMessages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [translations.loadingMessages.length]);

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
      <div className="w-16 h-16 border-4 border-blue-500 border-dashed rounded-full animate-spin mb-6"></div>
      <p className="text-xl font-semibold text-gray-700">{translations.generating}</p>
      <p className="text-gray-500 mt-2 transition-opacity duration-500">{translations.loadingMessages[messageIndex]}</p>
    </div>
  );
};

const WelcomeState: React.FC<{ translations: Translations }> = ({ translations }) => (
  <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
    <Ship className="w-20 h-20 text-blue-500 mb-6" />
    <h2 className="text-2xl font-bold text-gray-800">{translations.welcomeMessage}</h2>
    <p className="text-gray-600 mt-2 max-w-md">{translations.welcomeSubMessage}</p>
  </div>
);

const ErrorState: React.FC<{ message: string; translations: Translations }> = ({ message, translations }) => (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-red-50 border border-red-200 rounded-2xl">
        <Info className="w-16 h-16 text-red-500 mb-4" />
        <h3 className="text-xl font-bold text-red-700">{translations.errorTitle}</h3>
        <p className="text-red-600 mt-2">{translations.errorSuggestion}</p>
        <p className="text-xs text-red-500 mt-4 bg-red-100 p-2 rounded">{message}</p>
    </div>
);

const ItemIcon: React.FC<{ type: ItineraryItem['type'] }> = ({ type }) => {
    const iconProps = { className: "w-5 h-5 text-white" };
    const colorMap = {
        sightseeing: 'bg-blue-500', meal: 'bg-green-500', transport: 'bg-purple-500', 
        accommodation: 'bg-indigo-500', activity: 'bg-yellow-500', note: 'bg-gray-500'
    };
    const iconMapping = {
        sightseeing: <MapPin {...iconProps} />,
        meal: <Utensils {...iconProps} />,
        transport: <TramFront {...iconProps} />,
        accommodation: <Bed {...iconProps} />,
        activity: <Activity {...iconProps} />,
        note: <StickyNote {...iconProps} />
    };
    return (
      <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 flex-shrink-0 print:hidden ${colorMap[type]}`}>
        {iconMapping[type]}
      </div>
    );
};

const RecommendationIcon: React.FC<{ type: NearbyRecommendation['type'] }> = ({ type }) => {
    const iconProps = { className: "w-5 h-5 flex-shrink-0 mr-3 text-gray-500" };
    const iconMapping = {
        attraction: <Building2 {...iconProps} />,
        food: <UtensilsCrossed {...iconProps} />,
        shopping: <ShoppingBag {...iconProps} />
    };
    return iconMapping[type];
};

const DailyPlanView: React.FC<{ plan: ItineraryPlan['dailyPlans'][0], translations: Translations }> = ({ plan, translations }) => {
    const [isOpen, setIsOpen] = useState(true);
    const dayLabel = `${translations.dayPrefix} ${plan.day} ${translations.daySuffix}`.trim();

    const mapUrl = useMemo(() => {
        const locations = plan.items
            .map(item => item.address)
            .filter((address): address is string => !!address && address.trim() !== '');

        if (locations.length === 0) return null;

        if (locations.length === 1) {
            return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locations[0])}`;
        }
        
        const origin = encodeURIComponent(locations[0]);
        const destination = encodeURIComponent(locations[locations.length - 1]);
        const waypoints = locations.slice(1, -1).map(addr => encodeURIComponent(addr)).join('|');

        return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&waypoints=${waypoints}`;
    }, [plan.items]);
    
    const recommendationTypeBadge = (type: NearbyRecommendation['type']) => {
        const styles = {
            attraction: 'bg-blue-100 text-blue-800',
            food: 'bg-green-100 text-green-800',
            shopping: 'bg-purple-100 text-purple-800',
        };
        return (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[type]}`}>
                {translations.recommendationTypes[type]}
            </span>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6 border border-gray-200 break-inside-avoid">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full p-4 flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition print:hidden">
                <div className="text-left">
                    <h3 className="text-xl font-bold text-blue-800">{dayLabel}: {plan.date}</h3>
                    <p className="text-sm text-gray-600 italic">{plan.theme}</p>
                </div>
                <div className="flex items-center">
                    {mapUrl && (
                        <a href={mapUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-xs flex items-center space-x-1 px-2 py-1 bg-white border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 mr-2">
                           <MapPin size={12}/> <span>{translations.viewMap}</span>
                        </a>
                    )}
                    {isOpen ? <ChevronUp className="h-6 w-6 text-gray-500" /> : <ChevronDown className="h-6 w-6 text-gray-500" />}
                </div>
            </button>
            <div className={`print:block ${isOpen ? 'block' : 'hidden'}`}>
                <div className="p-4 sm:p-6">
                    <div className="print:hidden">
                        <h3 className="text-xl font-bold text-blue-800">{dayLabel}: {plan.date}</h3>
                        <p className="text-sm text-gray-600 italic mb-4">{plan.theme}</p>
                    </div>
                     <div className="hidden print:block mb-4">
                        <h3 className="text-xl font-bold text-blue-800">{dayLabel}: {plan.date}</h3>
                        <p className="text-sm text-gray-600 italic">{plan.theme}</p>
                    </div>
                    {plan.items.map((item, index) => (
                        <div key={index} className="break-inside-avoid">
                            <div className="flex items-start my-4">
                                <ItemIcon type={item.type} />
                                <div className="flex-grow">
                                    <p className="font-bold text-gray-800">{item.startTime} - {item.endTime}</p>
                                    <h4 className="font-semibold text-lg text-gray-900">{item.description}</h4>
                                    <p className="text-gray-600">{item.details}</p>
                                    {item.address && (
                                        <p className="text-sm text-gray-500 mt-2 flex items-start">
                                            <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-gray-400 lucide lucide-map-pin" />
                                            <span>{item.address}</span>
                                        </p>
                                    )}
                                    {item.googleMapsUrl && (
                                        <a href={item.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline mt-1 inline-flex items-center print:hidden">
                                            <ExternalLink className="w-4 h-4 mr-2" />
                                            {translations.viewOnGoogleMaps}
                                        </a>
                                    )}
                                </div>
                            </div>
                            {item.transportToNext && index < plan.items.length - 1 && (
                                <div className="pl-6 my-4 border-l-2 border-dashed border-blue-300 ml-5">
                                    <div className="flex items-center text-sm text-gray-700">
                                       <TramFront className="w-4 h-4 mr-2 text-blue-600 lucide lucide-tram-front" />
                                        <span className="font-semibold">{item.transportToNext.mode}</span>
                                        <span className="ml-1.5 text-gray-500">(~{item.transportToNext.duration})</span>
                                    </div>
                                    <p className="text-xs text-gray-500 pl-6">{item.transportToNext.details}</p>
                                </div>
                            )}
                        </div>
                    ))}

                    {plan.nearbyRecommendations && plan.nearbyRecommendations.length > 0 && (
                        <div className="mt-6 pt-4 border-t border-gray-200 break-inside-avoid">
                            <h4 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
                                <Star size={16} className="mr-2 text-yellow-500" />
                                {translations.nearbyRecommendations}
                            </h4>
                            <div className="space-y-3">
                                {plan.nearbyRecommendations.map((rec, index) => (
                                    <div key={index} className="flex items-start text-sm">
                                        <RecommendationIcon type={rec.type} />
                                        <div className="flex-grow">
                                            <div className="flex items-center justify-between">
                                                <p className="font-semibold text-gray-800">{rec.name}</p>
                                                {recommendationTypeBadge(rec.type)}
                                            </div>
                                            <p className="text-gray-600">{rec.description}</p>
                                            <a href={rec.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline mt-1 inline-flex items-center print:hidden">
                                                <ExternalLink className="w-3 h-3 mr-1" />
                                                {translations.viewOnGoogleMaps}
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

const GeneralTipsView: React.FC<{tips: GeneralTips, translations: Translations}> = ({ tips, translations }) => {
    const tipCategories: {key: keyof GeneralTips, icon: React.ReactNode}[] = [
        { key: 'weatherAndAttire', icon: <ThermometerSun size={20} className="text-orange-500"/>},
        { key: 'etiquette', icon: <Smile size={20} className="text-blue-600 lucide lucide-smile"/> },
        { key: 'cashAndCards', icon: <CreditCard size={20} className="text-green-600 lucide lucide-credit-card"/> },
        { key: 'businessHours', icon: <Clock size={20} className="text-yellow-600 lucide lucide-clock"/> },
        { key: 'holidays', icon: <Calendar size={20} className="text-red-600 lucide lucide-calendar"/> },
        { key: 'transportation', icon: <Bus size={20} className="text-purple-600 lucide lucide-bus"/> },
        { key: 'wifi', icon: <Wifi size={20} className="text-sky-600 lucide lucide-wifi"/> },
        { key: 'reservations', icon: <CheckSquare size={20} className="text-teal-600 lucide lucide-check-square"/> },
        { key: 'trash', icon: <Trash2 size={20} className="text-orange-600 lucide lucide-trash-2"/> },
    ];

    return (
         <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 break-inside-avoid">
            <h3 className="text-xl font-bold mb-4 flex items-center"><Info className="w-6 h-6 mr-2 text-blue-600 lucide lucide-info"/>{translations.generalTips}</h3>
            <div className="space-y-4">
            {tipCategories.map(({key, icon}) => (
                tips[key] && <div key={key} className="flex items-start">
                    <div className="w-8 h-8 flex-shrink-0 mr-3">{icon}</div>
                    <div className="flex-grow">
                        <h4 className="font-semibold text-gray-800">{translations.generalTipCategories[key]}</h4>
                        <p className="text-gray-600 text-sm">{tips[key]}</p>
                    </div>
                </div>
            ))}
            </div>
        </div>
    )
}

const BudgetView: React.FC<{budget: BudgetEstimate, translations: Translations}> = ({ budget, translations }) => {
    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 break-inside-avoid">
          <h3 className="text-xl font-bold mb-2 flex items-center"><Wallet className="w-6 h-6 mr-2 text-blue-600"/>{translations.estimatedBudget}</h3>
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
            <p className="text-lg font-bold text-blue-800">{budget.totalEstimate}</p>
            <p className="text-sm text-gray-600 mb-3">{budget.category}</p>
            <p className="text-gray-700 text-sm whitespace-pre-wrap">{budget.details}</p>
          </div>
        </div>
    );
};

const ItineraryDisplay: React.FC<ItineraryDisplayProps> = ({ itinerary, isLoading, isGeneratingImage, error, translations }) => {
  const [isWordExporting, setIsWordExporting] = useState<boolean>(false);

  if (error) return <ErrorState message={error} translations={translations} />;
  
  // Handle initial states before an itinerary is created
  if (!itinerary) {
    if (isLoading) {
      return <LoadingState translations={translations} />;
    }
    return <WelcomeState translations={translations} />;
  }
  
  const handleExportHTML = () => {
    const contentElement = document.getElementById("itinerary-content");
    if (!contentElement) {
      console.error("Itinerary content element not found for export.");
      return;
    }

    const clonedContent = contentElement.cloneNode(true) as HTMLElement;
    // Remove export buttons from cloned content
    clonedContent.querySelectorAll('.export-buttons').forEach(el => el.remove());

    const sourceHTML = `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${itinerary.tripTitle}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: 'Roboto', 'Noto Sans TC', sans-serif;
            background-color: #f9fafb; /* bg-gray-50 */
            padding: 2rem;
          }
        </style>
      </head>
      <body>
        <div class="container mx-auto max-w-4xl">
          ${clonedContent.innerHTML}
        </div>
      </body>
    </html>`;

    const blob = new Blob([sourceHTML], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${itinerary.tripTitle}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportWord = () => {
    setIsWordExporting(true);
    
    setTimeout(() => {
        try {
            const contentElement = document.getElementById("itinerary-content");
            if (!contentElement) {
                console.error("Itinerary content element not found for export.");
                return;
            }

            const clonedContent = contentElement.cloneNode(true) as HTMLElement;
            clonedContent.querySelectorAll('.export-buttons').forEach(el => el.remove());
            
            const linksToReplace: { oldNode: HTMLAnchorElement; href: string }[] = [];
            clonedContent.querySelectorAll('a[href*="google.com/maps"]').forEach(link => {
                linksToReplace.push({
                    oldNode: link as HTMLAnchorElement,
                    href: (link as HTMLAnchorElement).href
                });
            });

            linksToReplace.forEach(({ oldNode, href }) => {
                const newParagraph = document.createElement('p');
                newParagraph.style.margin = '4px 0 0 0';
                newParagraph.style.fontSize = '12px';

                const newLink = document.createElement('a');
                newLink.href = href;
                newLink.textContent = translations.viewOnGoogleMaps;
                newLink.style.color = '#0000EE';
                newLink.style.textDecoration = 'underline';
                
                newParagraph.appendChild(newLink);
                oldNode.parentNode?.replaceChild(newParagraph, oldNode);
            });

            clonedContent.querySelectorAll('.print\\:hidden').forEach(el => el.remove());
            clonedContent.querySelectorAll('.print\\:block').forEach(el => {
                (el as HTMLElement).style.display = 'block';
                (el as HTMLElement).classList.remove('hidden');
            });

            const iconMap: { [key: string]: string } = {
                'lucide-map-pin': '📍', 'lucide-utensils': '🍴', 'lucide-tram-front': '🚆', 'lucide-bed': '🛏️', 'lucide-activity': '🎉', 'lucide-sticky-note': '📝', 'lucide-info': 'ℹ️', 'lucide-smile': '😊', 'lucide-credit-card': '💳', 'lucide-clock': '🕒', 'lucide-calendar': '📅', 'lucide-bus': '🚌', 'lucide-wifi': '📶', 'lucide-check-square': '✅', 'lucide-trash-2': '🗑️', 'lucide-file-text': '📄'
            };

            clonedContent.querySelectorAll('svg.lucide').forEach(svg => {
                const iconClass = Array.from(svg.classList).find(cls => cls.startsWith('lucide-'));
                if (iconClass && iconMap[iconClass]) {
                    const emojiSpan = document.createElement('span');
                    emojiSpan.textContent = iconMap[iconClass];
                    svg.replaceWith(emojiSpan);
                } else {
                    svg.remove();
                }
            });

            const styles = `
                <style>
                body { font-family: Calibri, sans-serif; font-size: 11pt; line-height: 1.5; color: #000; }
                h2 { font-size: 20pt; font-weight: bold; color: #000; margin-bottom: 6pt; }
                h3 { font-size: 16pt; font-weight: bold; color: #1E40AF; margin-top: 18pt; margin-bottom: 9pt; }
                h4 { font-size: 14pt; font-weight: bold; color: #000; margin-top: 12pt; margin-bottom: 3pt; }
                p { margin: 0 0 6pt 0; }
                a { color: #0000EE; text-decoration: underline; }
                .italic { font-style: italic; }
                .text-gray-600 { color: #595959; }
                .text-sm { font-size: 9pt; }
                </style>
            `;

            const sourceHTML = `<!DOCTYPE html><html><head><meta charset='utf-8'><title>${itinerary.tripTitle}</title>${styles}</head><body>${clonedContent.innerHTML}</body></html>`;

            const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
            const fileDownload = document.createElement("a");
            document.body.appendChild(fileDownload);
            fileDownload.href = source;
            fileDownload.download = `${itinerary.tripTitle}.doc`;
            fileDownload.click();
            document.body.removeChild(fileDownload);
        } catch (err) {
            console.error("Failed to export Word document:", err);
        } finally {
            setIsWordExporting(false);
        }
    }, 50);
  }

  return (
    <div className="relative">
      {/* Overlay for refining state */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-20 rounded-2xl">
          <div className="w-12 h-12 border-4 border-blue-500 border-dashed rounded-full animate-spin mb-4"></div>
          <p className="text-lg font-semibold text-gray-700">{translations.refiningItinerary}</p>
        </div>
      )}
      
      <div className={`${isLoading ? 'blur-sm pointer-events-none' : ''}`}>
        <style>
          {`
            @media print {
              body { 
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .print\\:hidden { display: none !important; }
              .print\\:block { display: block !important; }
              .print\\:block.hidden { display: block !important; }
              .shadow-lg { box-shadow: none !important; }
              .border { border: none !important; }
              .break-inside-avoid { break-inside: avoid; }
            }
          `}
        </style>
        <div id="itinerary-content" className="space-y-8">
          <div className="relative rounded-2xl overflow-hidden shadow-lg border border-gray-200 mb-8">
              {itinerary.tripImageUrl ? (
                  <img src={itinerary.tripImageUrl} alt={itinerary.tripTitle} className="w-full h-64 object-cover" />
              ) : (
                  <div className="w-full h-64 bg-gray-200 animate-pulse flex items-center justify-center">
                      {isGeneratingImage && <p className="text-gray-500">{translations.generatingImage}</p>}
                  </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-6">
                  <h2 className="text-3xl font-extrabold text-white tracking-tight">{itinerary.tripTitle}</h2>
              </div>
              <div className="absolute top-4 right-4 flex space-x-2 print:hidden export-buttons">
                <button 
                    onClick={handleExportHTML}
                    disabled={isWordExporting}
                    className="flex items-center space-x-2 px-3 py-2 bg-white/90 backdrop-blur-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-white text-sm disabled:opacity-50">
                    <Download size={16}/><span>{translations.exportHTML}</span>
                </button>
                <button 
                    onClick={handleExportWord} 
                    disabled={isWordExporting}
                    className="flex items-center space-x-2 px-3 py-2 bg-white/90 backdrop-blur-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-white text-sm disabled:opacity-50 disabled:cursor-wait">
                    {isWordExporting ? (
                        <svg className="animate-spin h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                    ) : (
                        <><FileText size={16}/><span>{translations.exportWord}</span></>
                    )}
                </button>
              </div>
          </div>
          
          <GeneralTipsView tips={itinerary.generalTips} translations={translations} />
          
          {itinerary.budgetEstimate && <BudgetView budget={itinerary.budgetEstimate} translations={translations} />}

          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 break-inside-avoid">
            <h3 className="text-xl font-bold mb-4 flex items-center"><Bed className="w-6 h-6 mr-2 text-blue-600 lucide lucide-bed"/>{translations.accommodationSuggestion}</h3>
            <p className="text-gray-700">{itinerary.accommodationSuggestion}</p>
          </div>

          <div>
            {itinerary.dailyPlans.map((plan) => (
                <DailyPlanView key={plan.day} plan={plan} translations={translations}/>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItineraryDisplay;
