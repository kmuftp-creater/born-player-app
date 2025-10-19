import React from 'react';
import { ItineraryPlan, Translations } from '../types';
import { Trash2, Map } from 'lucide-react';

interface HistoryPanelProps {
  history: ItineraryPlan[];
  onSelect: (plan: ItineraryPlan) => void;
  onDelete: (id: string) => void;
  translations: Translations;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, onSelect, onDelete, translations }) => {
  if (history.length === 0) {
    return (
      <div className="text-center p-6 bg-white rounded-2xl shadow-lg border border-gray-200">
        <p className="text-gray-500">{translations.noHistory}</p>
      </div>
    );
  }

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent onSelect from firing
    if (window.confirm('Are you sure you want to delete this trip?')) {
        onDelete(id);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 max-h-[calc(100vh-12rem)] overflow-y-auto">
      <ul className="divide-y divide-gray-200">
        {history.map(plan => (
          <li
            key={plan.id}
            onClick={() => onSelect(plan)}
            className="p-4 hover:bg-gray-50 cursor-pointer transition-colors group"
          >
            <div className="flex items-center justify-between">
                <div className="flex-grow min-w-0">
                    <p className="text-sm font-semibold text-blue-700 truncate">{plan.tripTitle}</p>
                    <div className="flex items-center mt-1 text-xs text-gray-500">
                        <Map size={12} className="mr-1.5 flex-shrink-0" />
                        <span className="truncate">{plan.destination} - {plan.duration}</span>
                    </div>
                </div>
                <button 
                    onClick={(e) => handleDelete(e, plan.id)} 
                    title={translations.deleteTrip}
                    className="ml-4 flex-shrink-0 p-2 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 size={16} />
                </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default HistoryPanel;
