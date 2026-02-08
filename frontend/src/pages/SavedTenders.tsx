import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import TenderCard from '@/components/TenderCard';
import { Bookmark } from 'lucide-react';
import { fetchSavedTenders } from '@/lib/api';
import type { Release } from '@/types/tender';

const SavedTenders = () => {
  const [savedReleases, setSavedReleases] = useState<Release[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchSavedTenders();
        if (!cancelled) {
          setSavedReleases(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError('Failed to load saved tenders');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    load();
    
    // Listen for saved tender updates
    const handleSavedUpdate = () => {
      load();
    };
    window.addEventListener('savedTenderUpdated', handleSavedUpdate);
    
    return () => {
      cancelled = true;
      window.removeEventListener('savedTenderUpdated', handleSavedUpdate);
    };
  }, []);

  return (
    <AppLayout>
      <div className="p-4 lg:p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Saved Tenders</h1>
          <p className="text-muted-foreground">
            {savedReleases.length} tender{savedReleases.length !== 1 ? 's' : ''} saved
          </p>
        </div>

        {error && (
          <p className="text-sm text-destructive mb-4">{error}</p>
        )}

        {isLoading && (
          <p className="text-sm text-muted-foreground mb-4">Loading saved tenders…</p>
        )}

        {!isLoading && savedReleases.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {savedReleases.map((release) => (
              <TenderCard key={release.id} release={release} isSaved />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Bookmark className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No saved tenders</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Start saving tenders you're interested in to keep track of them here.
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default SavedTenders;
