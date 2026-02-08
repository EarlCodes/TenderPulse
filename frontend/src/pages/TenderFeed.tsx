import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import TenderCard from '@/components/TenderCard';
import FilterSidebar, { FilterState } from '@/components/FilterSidebar';
import { provinces, cpvCategories } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { SlidersHorizontal, Grid3X3, List, TrendingUp } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

import { fetchTenderFeed } from '@/lib/api';
import type { Release } from '@/types/tender';

const TenderFeed = () => {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    categories: [],
    provinces: [],
    minValue: 0,
    maxValue: 200000000,
    status: ['active'],
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [releases, setReleases] = useState<Release[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchTenderFeed(filters);
        if (!cancelled) {
          setReleases(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError('Failed to load tenders from backend');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [filters]);

  return (
    <AppLayout>
      <div className="p-4 lg:p-6">
        {/* Stats Banner */}
        <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-6 mb-6 text-primary-foreground">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold mb-1">Welcome back!</h1>
              <p className="text-primary-foreground/80">
                {releases.filter(r => r.tender.status === 'active').length} open tenders match your profile
              </p>
            </div>
            <div className="flex items-center gap-6">
              {releases.length > 0 && releases[0].tender.matchScore && (
                <div className="text-center">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    <span className="text-2xl font-bold">{releases[0].tender.matchScore}%</span>
                  </div>
                  <p className="text-xs text-primary-foreground/70">Top Match</p>
                </div>
              )}
              <div className="text-center">
                <span className="text-2xl font-bold">
                  {releases.filter(r => {
                    const today = new Date();
                    const releaseDate = new Date(r.date);
                    return releaseDate.toDateString() === today.toDateString();
                  }).length}
                </span>
                <p className="text-xs text-primary-foreground/70">New Today</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Desktop Filters */}
          <div className="hidden lg:block w-72 shrink-0">
            <FilterSidebar onFilterChange={setFilters} initialFilters={filters} />
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                Showing{' '}
                <span className="font-medium text-foreground">
                  {isLoading ? '…' : releases.length}
                </span>{' '}
                tenders
              </p>
              
              <div className="flex items-center gap-2">
                {/* Mobile Filter Button */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="lg:hidden gap-2">
                      <SlidersHorizontal className="h-4 w-4" />
                      Filters
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80 p-0">
                    <SheetHeader className="p-4 border-b">
                      <SheetTitle>Filters</SheetTitle>
                    </SheetHeader>
                    <div className="p-4 overflow-y-auto h-full">
                      <FilterSidebar onFilterChange={setFilters} initialFilters={filters} className="border-0 p-0 shadow-none" />
                    </div>
                  </SheetContent>
                </Sheet>

                {/* View Toggle */}
                <div className="hidden sm:flex items-center border border-border rounded-lg p-1">
                  <Button 
                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="h-7 w-7 p-0"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="h-7 w-7 p-0"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Tender Grid/List */}
            {error && (
              <div className="text-sm text-destructive mb-4">
                {error}
              </div>
            )}

            {isLoading ? (
              <div className="text-sm text-muted-foreground py-8">Loading tenders…</div>
            ) : releases.length > 0 ? (
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 xl:grid-cols-2 gap-4'
                    : 'space-y-4'
                }
              >
                {releases.map(release => (
                  <TenderCard key={release.id} release={release} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <SlidersHorizontal className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No tenders found</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Try adjusting your filters or search criteria to find more tenders.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default TenderFeed;
