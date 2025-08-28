import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, Filter } from 'lucide-react';
import { ProductMarkDetail } from '@/types/ProductMark';
import { CodeDisplay } from '@/components/CodeDisplay';

interface GlobalSearchProps {
  productMarks: ProductMarkDetail[];
  onSearchResults: (results: ProductMarkDetail[]) => void;
  onClearSearch: () => void;
}

export function GlobalSearch({ productMarks, onSearchResults, onClearSearch }: GlobalSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [shownCodes, setShownCodes] = useState<Set<string>>(new Set());

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return productMarks;
    }

    const query = searchQuery.toLowerCase();
    const results = productMarks.filter(mark => {
      return (
        mark.product?.toLowerCase().includes(query) ||
        mark.barcode?.toLowerCase().includes(query) ||
        mark.supplierCode?.toLowerCase().includes(query) ||
        mark.brandType?.toLowerCase().includes(query) ||
        mark.brand?.toLowerCase().includes(query) ||
        mark.datamatrix?.toLowerCase().includes(query) ||
        mark.status?.toLowerCase().includes(query)
      );
    });

    return results;
  }, [productMarks, searchQuery]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setIsSearching(query.length > 0);
    onSearchResults(searchResults);
  };

  const handleClear = () => {
    setSearchQuery('');
    setIsSearching(false);
    onClearSearch();
  };

  const toggleCodeDisplay = (markId: string) => {
    const newShownCodes = new Set(shownCodes);
    if (newShownCodes.has(markId)) {
      newShownCodes.delete(markId);
    } else {
      newShownCodes.add(markId);
    }
    setShownCodes(newShownCodes);
  };

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search in all fields..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10 pr-10"
        />
        {isSearching && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isSearching && (
        <div className="text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span>
              Found {searchResults.length} of {productMarks.length} marks
            </span>
          </div>
        </div>
      )}

      {isSearching && searchResults.length > 0 && (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {searchResults.slice(0, 10).map((mark) => {
            const isCodeShown = shownCodes.has(mark._id);
            return (
              <div
                key={mark._id}
                className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="font-medium">
                      {highlightText(mark.product || 'No product', searchQuery)}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>
                        <span className="font-medium">Barcode:</span>{' '}
                        {highlightText(mark.barcode || 'N/A', searchQuery)}
                      </div>
                      <div>
                        <span className="font-medium">Brand:</span>{' '}
                        {highlightText(mark.brand || 'N/A', searchQuery)}
                      </div>
                      <div className="flex gap-2">
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded text-xs">
                          {mark.brandType}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs border ${
                          mark.status === 'В обороте' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800' :
                          mark.status === 'Выбыла' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800' :
                          'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800'
                        }`}>
                          {mark.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    {isCodeShown && mark.brand ? (
                      <div 
                        className="border border-border bg-card rounded p-2 cursor-pointer hover:bg-muted/50 transition-colors high-contrast:hover:bg-white high-contrast:hover:text-black"
                        onClick={() => toggleCodeDisplay(mark._id)}
                      >
                        <CodeDisplay 
                          data={mark.brand} 
                          brandType={mark.brandType as 'КМДМ' | 'КМЧЗ'} 
                          size={80}
                        />
                      </div>
                    ) : (
                      <div 
                        className="border border-border bg-card rounded p-2 cursor-pointer hover:bg-muted/50 transition-colors high-contrast:hover:bg-white high-contrast:hover:text-black"
                        onClick={() => toggleCodeDisplay(mark._id)}
                      >
                        <span className="text-sm text-muted-foreground high-contrast:text-white high-contrast:hover:text-black">
                          Click to show
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {searchResults.length > 10 && (
            <div className="text-center text-sm text-muted-foreground py-2">
              Showing first 10 results. Use table filters for more options.
            </div>
          )}
        </div>
      )}

      {isSearching && searchResults.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No marks found matching "{searchQuery}"</p>
          <p className="text-sm">Try different keywords or check spelling</p>
        </div>
      )}
    </div>
  );
}
