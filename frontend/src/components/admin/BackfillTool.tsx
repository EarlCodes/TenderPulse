import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  CalendarIcon,
  RefreshCw,
  Loader2,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { triggerBackfill } from '@/lib/api';

const BackfillTool = () => {
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [isStartingJob, setIsStartingJob] = useState(false);

  const startBackfill = async () => {
    if (!dateFrom || !dateTo) {
      toast.error('Please select both start and end dates');
      return;
    }

    if (dateFrom > dateTo) {
      toast.error('Start date must be before end date');
      return;
    }

    setIsStartingJob(true);

    try {
      await triggerBackfill({
        dateFrom: format(dateFrom, 'yyyy-MM-dd'),
        dateTo: format(dateTo, 'yyyy-MM-dd'),
      });
    } catch (err) {
      setIsStartingJob(false);
      toast.error('Failed to trigger backfill job');
      return;
    }

    setIsStartingJob(false);
    toast.success('Backfill job started');
  };

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <h2 className="text-lg font-semibold text-foreground mb-1">Backfill Tool</h2>
      <p className="text-sm text-muted-foreground mb-6">Re-sync historical OCDS data for a specific date range</p>

      {/* Date Range Picker */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 space-y-2">
          <Label className="text-sm font-medium text-foreground">From Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dateFrom && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFrom ? format(dateFrom, "PPP") : "Select start date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateFrom}
                onSelect={setDateFrom}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex items-end justify-center pb-2">
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </div>

        <div className="flex-1 space-y-2">
          <Label className="text-sm font-medium text-foreground">To Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dateTo && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateTo ? format(dateTo, "PPP") : "Select end date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateTo}
                onSelect={setDateTo}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex items-end">
          <Button 
            onClick={startBackfill}
            disabled={isStartingJob || !dateFrom || !dateTo}
            className="gap-2 h-10"
          >
            {isStartingJob ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Re-run Sync
          </Button>
        </div>
      </div>

      {/* Active Jobs note */}
      <p className="text-xs text-muted-foreground">
        Once started, progress and outcomes will appear in the ingestion history panel.
      </p>
    </div>
  );
};

export default BackfillTool;
