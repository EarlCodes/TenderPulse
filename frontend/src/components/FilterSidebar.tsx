import { useState, useEffect } from 'react';
import { cpvCategories, provinces } from '@/data/mockData';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, SlidersHorizontal, X, RotateCcw } from 'lucide-react';
import { fetchMetaCategories } from '@/lib/api';

interface FilterSidebarProps {
  onFilterChange: (filters: FilterState) => void;
  initialFilters?: FilterState;
  className?: string;
}

export interface FilterState {
  search: string;
  categories: string[];
  provinces: string[];
  minValue: number;
  maxValue: number;
  status: string[];
}

const FilterSidebar = ({ onFilterChange, initialFilters, className = '' }: FilterSidebarProps) => {
  const [filters, setFilters] = useState<FilterState>(
    initialFilters || {
    search: '',
    categories: [],
    provinces: [],
    minValue: 0,
    maxValue: 200000000,
    status: ['active'],
    }
  );

  // Sync with parent when initialFilters change
  useEffect(() => {
    if (initialFilters) {
      setFilters(initialFilters);
      setSearchValue(initialFilters.search);
    }
  }, [initialFilters]);

  // Debounce search input
  const [searchValue, setSearchValue] = useState(filters.search);
  const [categoryOptions, setCategoryOptions] = useState(
    cpvCategories.map(c => ({ code: c.code, name: c.name })),
  );

  // Load dynamic categories from backend
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await fetchMetaCategories();
        if (!cancelled && Array.isArray(data) && data.length) {
          setCategoryOptions(data.map(name => ({ code: name, name })));
        }
      } catch {
        // fallback to static cpvCategories
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      updateFilters({ search: searchValue });
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue]);

  const updateFilters = (newFilters: Partial<FilterState>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    onFilterChange(updated);
  };

  const toggleCategory = (code: string) => {
    const newCategories = filters.categories.includes(code)
      ? filters.categories.filter(c => c !== code)
      : [...filters.categories, code];
    updateFilters({ categories: newCategories });
  };

  const toggleProvince = (code: string) => {
    // Map province code to name for backend
    const province = provinces.find(p => p.code === code);
    const provinceValue = province ? province.name : code;
    
    const newProvinces = filters.provinces.includes(provinceValue)
      ? filters.provinces.filter(p => p !== provinceValue)
      : [...filters.provinces, provinceValue];
    updateFilters({ provinces: newProvinces });
  };

  const toggleStatus = (status: string) => {
    const newStatus = filters.status.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...filters.status, status];
    updateFilters({ status: newStatus });
  };

  const resetFilters = () => {
    const defaultFilters: FilterState = {
      search: '',
      categories: [],
      provinces: [],
      minValue: 0,
      maxValue: 200000000,
      status: ['active'],
    };
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `R${(value / 1000000).toFixed(0)}M`;
    }
    return `R${(value / 1000).toFixed(0)}K`;
  };

  const hasActiveFilters = 
    filters.search || 
    filters.categories.length > 0 || 
    filters.provinces.length > 0 ||
    filters.minValue > 0 ||
    filters.maxValue < 200000000 ||
    filters.status.length !== 1 ||
    !filters.status.includes('active');

  return (
    <aside className={`bg-card rounded-xl border border-border p-5 ${className}`}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-foreground">Filters</h2>
        </div>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={resetFilters} className="h-8 gap-1.5 text-xs">
            <RotateCcw className="h-3 w-3" />
            Reset
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="filter-section">
        <Label className="text-sm font-medium text-foreground">Search</Label>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tenders..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Status */}
      <div className="filter-section">
        <Label className="text-sm font-medium text-foreground">Status</Label>
        <div className="flex flex-wrap gap-2 mt-3">
          {[
            { value: 'active', label: 'Open' },
            { value: 'complete', label: 'Closed' },
            { value: 'cancelled', label: 'Cancelled' },
          ].map((status) => (
            <Badge
              key={status.value}
              variant={filters.status.includes(status.value) ? 'default' : 'outline'}
              className="cursor-pointer transition-all"
              onClick={() => toggleStatus(status.value)}
            >
              {status.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="filter-section">
        <Label className="text-sm font-medium text-foreground">Categories</Label>
        <div className="space-y-2 mt-3 max-h-64 overflow-y-auto">
          {categoryOptions.map((category) => (
            <label
              key={category.code}
              className="flex items-center gap-2 cursor-pointer text-sm hover:text-foreground transition-colors"
            >
              <Checkbox
                checked={filters.categories.includes(category.code)}
                onCheckedChange={() => toggleCategory(category.code)}
              />
              <span className={filters.categories.includes(category.code) ? 'text-foreground' : 'text-muted-foreground'}>
                {category.name}
              </span>
            </label>
          ))}
        </div>
        {filters.categories.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {filters.categories.map(code => {
              const cat = categoryOptions.find(c => c.code === code);
              return (
                <Badge key={code} variant="secondary" className="text-xs gap-1 cursor-pointer" onClick={() => toggleCategory(code)}>
                  {cat?.name || code}
                  <X className="h-3 w-3" />
                </Badge>
              );
            })}
          </div>
        )}
        {filters.provinces.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {filters.provinces.map(provinceName => (
              <Badge key={provinceName} variant="secondary" className="text-xs gap-1 cursor-pointer" onClick={() => {
                const province = provinces.find(p => p.name === provinceName);
                if (province) toggleProvince(province.code);
              }}>
                {provinceName}
                <X className="h-3 w-3" />
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Province */}
      <div className="filter-section">
        <Label className="text-sm font-medium text-foreground">Province</Label>
        <div className="space-y-2 mt-3 max-h-40 overflow-y-auto">
          {provinces.map((province) => {
            const isSelected = filters.provinces.includes(province.name);
            return (
            <label
              key={province.code}
              className="flex items-center gap-2 cursor-pointer text-sm hover:text-foreground transition-colors"
            >
              <Checkbox
                  checked={isSelected}
                onCheckedChange={() => toggleProvince(province.code)}
              />
                <span className={isSelected ? 'text-foreground' : 'text-muted-foreground'}>
                {province.name}
              </span>
            </label>
            );
          })}
        </div>
      </div>

      {/* Value Range */}
      <div className="filter-section border-b-0">
        <Label className="text-sm font-medium text-foreground">Value Range</Label>
        <div className="mt-4 px-1">
          <Slider
            value={[filters.minValue, filters.maxValue]}
            min={0}
            max={200000000}
            step={1000000}
            onValueChange={([min, max]) => updateFilters({ minValue: min, maxValue: max })}
          />
        </div>
        <div className="flex justify-between text-xs mt-2">
          <span className="text-muted-foreground">{formatCurrency(filters.minValue)}</span>
          <span className="text-muted-foreground">{formatCurrency(filters.maxValue)}</span>
        </div>
      </div>
    </aside>
  );
};

export default FilterSidebar;
