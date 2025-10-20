import { GoogleGenAI, Type } from "@google/genai";
import { ItineraryPlan, Language } from '../types';

// 這是整個檔案唯一需要的 ai 宣告，使用您專案最原始、最正確的寫法
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const itinerarySchema = {
    type: Type.OBJECT,
    properties: {
        tripTitle: { type: Type.STRING },
        destination: { type: Type.STRING },
        duration: { type: Type.STRING },
        accommodationSuggestion: { type: Type.STRING },
        generalTips: {
            type: Type.OBJECT,
            properties: {
                etiquette: { type: Type.STRING },
                cashAndCards: { type: Type.STRING },
                businessHours: { type: Type.STRING },
                holidays: { type: Type.STRING },
                transportation: { type: Type.STRING },
                wifi: { type: Type.STRING },
                reservations: { type: Type.STRING },
                trash: { type: Type.STRING },
                weatherAndAttire: { type: Type.STRING },
            },
            required: ["etiquette", "cashAndCards", "businessHours", "holidays", "transportation", "wifi", "reservations", "trash", "weatherAndAttire"],
        },
        dailyPlans: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    day: { type: Type.INTEGER },
                    date: { type: Type.STRING },
                    theme: { type: Type.STRING },
                    items: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                startTime: { type: Type.STRING },
                                endTime: { type: Type.STRING },
                                type: { type: Type.STRING, enum: ['sightseeing', 'meal', 'transport', 'accommodation', 'activity', 'note'] },
                                description: { type: Type.STRING },
                                details: { type: Type.STRING },
                                address: { type: Type.STRING },
                                googleMapsUrl: { type: Type.STRING },
                                transportToNext: {
                                    type: Type.OBJECT,
                                    properties: {
                                        mode: { type: Type.STRING },
                                        duration: { type: Type.STRING },
                                        details: { type: Type.STRING },
                                    },
                                },
                            },
                            required: ["startTime", "endTime", "type", "description", "details"],
                        },
                    },
                    nearbyRecommendations: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                type: { type: Type.STRING, enum: ['attraction', 'food', 'shopping'] },
                                description: { type: Type.STRING },
                                googleMapsUrl: { type: Type.STRING },
                            },
                            required: ["name", "type", "description", "googleMapsUrl"],
                        }
                    }
                },
                required: ["day", "date", "theme", "items"],
            },
        },
        budgetEstimate: {
            type: Type.OBJECT,
            properties: {
                totalEstimate: { type: Type.STRING, description: "e.g., '75,000 - 100,000 JPY for 5 days'" },
                category: { type: Type.STRING, description: "e.g., 'Solo Traveler, excluding flights & accommodation'" },
                details: { type: Type.STRING, description: "A highly detailed, itemized breakdown of estimated costs. Use markdown-style formatting with newlines. Group items into categories like 'Transportation', 'Food', and 'Other Costs'. Start each category with a bolded header like '**Transportation Costs:**' and list items with an asterisk like '* Tokyo Subway Ticket: ¥1500'." },
            },
            required: ["totalEstimate", "category", "details"],
        },
        suggestedFollowUps: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
        }
    },
    required: ["tripTitle", "destination", "duration", "accommodationSuggestion", "generalTips", "dailyPlans", "budgetEstimate"],
};

const getLanguageName = (language: Language) => {
    const languageMap = {
        'zh-TW': 'Traditional Chinese (繁體中文)',
        'zh-CN': 'Simplified Chinese (简体中文)',
        'en': 'English',
        'ja': 'Japanese (日本語)',
        'ko': 'Korean (한국어)',
    };
    return languageMap[language];
}


export const generateItinerary = async (
    destination: string,
    duration: string,
    arrivalTime: string,
    interests: string[],
    startDate: string,
    language: Language,
    draftContent: string | null,
): Promise<Omit<ItineraryPlan, 'id'>> => {
    
    const languageName = getLanguageName(language);

    const draftPromptSection = draftContent 
        ? `
        **User's Draft Itinerary:**
        The user has provided a draft. Use this as a strong foundation for the itinerary. Enhance, structure, and fill in the details based on this draft.
        ---
        ${draftContent}
        ---
        ` 
        : '';

    const prompt = `
        You are a world-class travel planner AI. Create a detailed, thoughtful, and exciting travel itinerary.

        **Travel Details:**
        - **Destination:** ${destination}
        - **Trip Duration:** ${duration} days
        - **Start Date:** ${startDate}
        - **Arrival Time on Day 1:** ${arrivalTime}
        - **Interests and Keywords:** ${interests.join(', ')}
        - **Response Language:** ${languageName}

        ${draftPromptSection}

        **Instructions:**
        1.  **Mandatory Keywords:** The 'Interests and Keywords' list may contain specific places, restaurants, or activities (e.g., "Disneyland", "Ghibli Museum", a specific ramen shop). These are MUST-INCLUDE items. You must integrate them into the itinerary at appropriate times. General interests (e.g., 'shopping', 'history') should guide the overall theme and fill the rest of the schedule.
        2.  Create a day-by-day itinerary. Dates must be correct, starting from the specified Start Date.
        3.  First day's activities must start after the arrival time.
        4.  For each activity, provide: start/end times, a description, interesting details, its full address, and a Google Maps URL.
        5.  Include diverse meal recommendations (breakfast, lunch, dinner).
        6.  Suggest the best transport between activities ('transportToNext'). Provide specific, detailed instructions, e.g., "Take the Ginza Line subway towards Shibuya for 3 stops to Omotesando Station" or "Walk 5 minutes east along Chuo Dori". Include estimated duration. Omit transport after the final activity of each day.
        7.  Provide a detailed "General Tips" section using the specified JSON structure. This is critical. Be comprehensive and specific to the destination.
        8.  **Weather and Attire:** In the 'weatherAndAttire' tip, provide advice on the expected weather and average temperatures for the destination during the travel dates. Suggest appropriate clothing.
        9.  **Holidays:** In the 'holidays' tip, mention only public holidays or major festivals that overlap with the travel period. If none,
