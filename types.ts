
export type Language = 'zh-TW' | 'zh-CN' | 'en' | 'ja' | 'ko';

export interface ItineraryItem {
  startTime: string;
  endTime: string;
  type: 'sightseeing' | 'meal' | 'transport' | 'accommodation' | 'activity' | 'note';
  description: string;
  details: string;
  address?: string;
  googleMapsUrl?: string;
  transportToNext?: {
    mode: string;
    duration: string;
    details: string;
  };
}

export interface NearbyRecommendation {
  name: string;
  type: 'attraction' | 'food' | 'shopping';
  description: string;
  googleMapsUrl: string;
}

export interface DailyPlan {
  day: number;
  date: string;
  theme: string;
  items: ItineraryItem[];
  nearbyRecommendations?: NearbyRecommendation[];
}

export interface GeneralTips {
  etiquette: string;
  cashAndCards: string;
  businessHours: string;
  holidays: string;
  transportation: string;
  wifi: string;
  reservations: string;
  trash: string;
  weatherAndAttire: string;
}

export interface BudgetEstimate {
  totalEstimate: string;
  category: string;
  details: string;
}

export interface ItineraryPlan {
  id: string;
  tripTitle: string;
  destination: string;
  duration: string;
  accommodationSuggestion: string;
  generalTips: GeneralTips;
  dailyPlans: DailyPlan[];
  budgetEstimate: BudgetEstimate;
  tripImageUrl?: string;
  suggestedFollowUps?: string[];
}

export interface Translations {
    appName: string;
    destination: string;
    destinationPlaceholder: string;
    duration: string;
    durationPlaceholder: string;
    arrivalTime: string;
    startDate: string;
    interests: string;
    generateItinerary: string;
    generating: string;
    interestOptions: {
        food: string;
        history: string;
        shopping: string;
        nature: string;
        art: string;
    };
    welcomeMessage: string;
    welcomeSubMessage: string;
    loadingMessages: string[];
    dayPrefix: string;
    daySuffix: string;
    accommodationSuggestion: string;
    generalTips: string;
    errorTitle: string;
    errorSuggestion: string;
    language: string;
    copyright: string;
    viewOnGoogleMaps: string;
    addContent: string;
    addContentPlaceholder: string;
    addContentButton: string;
    refiningItinerary: string;
    export: string;
    exportHTML: string;
    exportWord: string;
    uploadDraft: string;
    uploadDraftDescription: string;
    startOver: string;
    newTrip: string;
    tripHistory: string;
    noHistory: string;
    deleteTrip: string;
    suggestions: string;
    viewMap: string;
    estimatedBudget: string;
    customInterestPlaceholder: string;
    addInterest: string;
    generatingImage: string;
    nearbyRecommendations: string;
    recommendationTypes: {
        attraction: string;
        food: string;
        shopping: string;
    };
    generalTipCategories: {
      etiquette: string;
      cashAndCards: string;
      businessHours: string;
      holidays: string;
      transportation: string;
      wifi: string;
      reservations: string;
      trash: string;
      weatherAndAttire: string;
    }
}
