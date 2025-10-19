
import { GoogleGenAI, Type } from "@google/genai";
import { ItineraryPlan, Language } from '../types';

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
        9.  **Holidays:** In the 'holidays' tip, mention only public holidays or major festivals that overlap with the travel period. If none, state that.
        10. **Transportation:** The 'transportation' tip should be a comprehensive guide to local transit, covering public transport options, payment methods (like IC cards), and any useful passes. Do not create a separate transport summary.
        11. **Budget:** Create a detailed 'budgetEstimate' for a single traveler, excluding flights and accommodation, in the local currency.
            - **totalEstimate:** A range for the entire trip duration (e.g., '75,000 - 100,000 JPY for 5 days').
            - **category:** A short description (e.g., 'Solo Traveler, excluding flights & accommodation').
            - **details:** This MUST be a detailed, itemized breakdown formatted as a single string with newlines. Follow this structure precisely:
                - Start with a general disclaimer (e.g., "This budget is an estimate and does not include airfare or lodging...").
                - Use bolded headers for categories, including a category total, like '**Transportation Costs (Total approx. ¥5,000):**'.
                - List individual items under each category with an asterisk, including which day the cost occurs if applicable, e.g., '* Tokyo Subway Ticket (Days 1-3): approx. ¥1,500'.
                - Include categories for: Transportation, Food & Drink, Attractions & Activities, and Other (e.g., eSIM, souvenirs, luggage lockers).
                - Conclude with a summary of the **daily average cost**.
                - This entire detailed breakdown should be a single string in the 'details' field.
        12. **Nearby Recommendations:** For each day, based on the day's route, suggest 2-3 nearby points of interest (attractions, restaurants, or shops) that the user could visit if they have extra time. These should be optional and not part of the main timed schedule. For each recommendation, provide its name, type (attraction, food, or shopping), a brief description, and a Google Maps URL. Add this to the 'nearbyRecommendations' field.
        13. Provide 3-4 concise, relevant "suggestedFollowUps" (e.g., "Add more family-friendly activities", "Find some vegetarian restaurants", "What are some good souvenir shops near Asakusa?").
        14. The entire output must be in ${languageName} and strictly follow the provided JSON schema. Do not output markdown.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: itinerarySchema,
            },
        });
        
        const jsonText = response.text.trim();
        const plan = JSON.parse(jsonText);
        return plan;
    } catch (error) {
        console.error("Error generating itinerary:", error);
        throw new Error("Failed to generate itinerary from Gemini API.");
    }
};

export const refineItinerary = async (
    existingPlan: ItineraryPlan,
    followUpPrompt: string,
    language: Language
): Promise<Omit<ItineraryPlan, 'id'>> => {
    const languageName = getLanguageName(language);
    
    const { id, tripImageUrl, ...planForPrompt } = existingPlan;

    const prompt = `
        You are a travel planner assistant. You are given an existing travel itinerary and a follow-up request.
        Modify the itinerary based on the user's request and return the complete, updated itinerary in the same JSON format.
        Integrate the request thoughtfully (e.g., adjust other activities to make time for a new one).
        Recalculate dates if necessary.
        Update the 'nearbyRecommendations' to be relevant to the new daily routes.
        Recalculate the 'budgetEstimate' for the whole trip if the changes significantly impact costs, maintaining the detailed, itemized format.
        Update the 'suggestedFollowUps' with new, relevant suggestions based on the refined plan.
        Ensure the response language is ${languageName}.
        When modifying, follow these rules:
        - Provide specific, detailed transit instructions ('transportToNext').
        - Ensure 'weatherAndAttire' is relevant to the travel dates.
        - Ensure 'holidays' are only those relevant to the travel dates.
        - Ensure 'transportation' is a single, comprehensive guide.

        **Existing Itinerary:**
        ${JSON.stringify(planForPrompt)}

        **User's Follow-up Request:**
        "${followUpPrompt}"

        Generate the updated and complete itinerary. The entire output must be in ${languageName} and strictly follow the JSON schema. Do not output markdown.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: itinerarySchema,
            },
        });
        
        const jsonText = response.text.trim();
        const plan = JSON.parse(jsonText);
        return plan;
    } catch (error) {
        console.error("Error refining itinerary:", error);
        throw new Error("Failed to refine itinerary from Gemini API.");
    }
}


export const generateTripImage = async (prompt: string): Promise<string> => {
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/jpeg',
              aspectRatio: '16:9',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            return response.generatedImages[0].image.imageBytes;
        }
        throw new Error("No image was generated.");
    } catch (error) {
        console.error("Error generating image:", error);
        // Don't throw, just return an empty string to not break the app
        return ""; 
    }
};