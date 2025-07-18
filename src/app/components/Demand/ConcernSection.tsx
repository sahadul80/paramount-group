import { Input } from "../ui/input";
import { Label } from "../ui/label";

interface ConcernSectionProps {
  searchConcern: string;
  setSearchConcern: (value: string) => void;
  filteredConcerns: string[];
  handleConcernSelect: (concern: string) => void;
}

export default function ConcernSection({
  searchConcern,
  setSearchConcern,
  filteredConcerns,
  handleConcernSelect,
}: ConcernSectionProps) {
  return (
    <div className="space-y-2">
      <Label className="text-md p-2" htmlFor="concern-search">Select Concern</Label>
      <div className="relative">
        <Input
          id="concern-search"
          type="text"
          value={searchConcern}
          onChange={e => setSearchConcern(e.target.value)}
          placeholder="Search concern..."
          className="pl-8 text-sm h-8 sm:h-9"
        />
        <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-2 top-2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      <div className="text-sm border rounded-md overflow-hidden">
        <div className="max-h-30 overflow-y-auto">
          {filteredConcerns.map(c => (
            <button
              key={c}
              className={`block w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${searchConcern === c
                  ? 'bg-indigo-400/50 border-l-2 border-indigo-500'
                  : ''
                } border-b`}
              onClick={() => handleConcernSelect(c)}
            >
              <div className="flex items-center justify-between">
                <span>{c}</span>
                {searchConcern === c && (
                  <div className="bg-indigo-500 rounded-full p-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-2 w-2 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}