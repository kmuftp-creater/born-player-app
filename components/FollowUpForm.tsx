import React, { useState } from 'react';
import { Translations } from '../types';
import { Send, Sparkles } from 'lucide-react';

interface FollowUpFormProps {
  onSubmit: (prompt: string) => void;
  isLoading: boolean;
  translations: Translations;
  suggestions: string[];
}

const FollowUpForm: React.FC<FollowUpFormProps> = ({ onSubmit, isLoading, translations, suggestions }) => {
    const [prompt, setPrompt] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (prompt.trim()) {
            onSubmit(prompt);
            setPrompt('');
        }
    };
    
    const handleSuggestionClick = (suggestion: string) => {
        setPrompt(suggestion);
    }

    return (
        <div className="bg-gray-800 text-white p-6 rounded-2xl shadow-lg">
            <h3 className="text-lg font-bold mb-3">{translations.addContent}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={translations.addContentPlaceholder}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition text-white placeholder-gray-400"
                    rows={3}
                    disabled={isLoading}
                />
                
                {suggestions.length > 0 && (
                     <div>
                        <h4 className="text-sm font-semibold text-gray-300 mb-2 flex items-center"><Sparkles size={16} className="mr-2"/>{translations.suggestions}</h4>
                        <div className="flex flex-wrap gap-2">
                            {suggestions.map((s, i) => (
                                <button
                                    type="button"
                                    key={i}
                                    onClick={() => handleSuggestionClick(s)}
                                    className="px-3 py-1 bg-gray-600 text-gray-200 text-sm rounded-full hover:bg-gray-500 transition-colors"
                                    disabled={isLoading}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isLoading || !prompt.trim()}
                    className="w-full flex items-center justify-center bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
                    >
                    {isLoading ? (
                        <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {translations.refiningItinerary}
                        </>
                    ) : (
                        <>
                        <Send className="h-5 w-5 mr-2" />
                        {translations.addContentButton}
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};

export default FollowUpForm;
