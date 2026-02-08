import type { AdminIngestionRun } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, CheckCircle2, XCircle, Database } from 'lucide-react';

interface IngestionHistoryProps {
  runs: AdminIngestionRun[];
}

const IngestionHistory = ({ runs }: IngestionHistoryProps) => {
  if (!runs.length) {
    return (
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-1">Ingestion History</h2>
        <p className="text-sm text-muted-foreground mb-4">
          No ingestion runs have been recorded yet.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Ingestion History</h2>
          <p className="text-sm text-muted-foreground">
            Recent automatic and manual ingestion runs
          </p>
        </div>
        <Badge variant="outline" className="text-xs text-muted-foreground">
          {runs.length} runs
        </Badge>
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto">
        {runs.map(run => {
          const started = new Date(run.started_at);
          const finished = run.finished_at ? new Date(run.finished_at) : null;
          const durationSeconds =
            finished && finished > started
              ? Math.round((finished.getTime() - started.getTime()) / 1000)
              : null;

          const total = run.items_ingested + run.items_failed;
          const successRate = total > 0 ? Math.round((run.items_ingested / total) * 100) : 0;

          return (
            <div
              key={run.id}
              className="p-3 rounded-lg border border-border/70 bg-muted/30 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Database className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Run #{run.id} · {run.source === 'bulk' ? 'Bulk backfill' : 'API sync'}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {started.toLocaleString('en-ZA', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {durationSeconds !== null && (
                        <span className="ml-1">
                          · {durationSeconds}s
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <Badge
                  className={
                    run.success
                      ? 'bg-success/10 text-success border-success/20'
                      : 'bg-destructive/10 text-destructive border-destructive/20'
                  }
                >
                  {run.success ? (
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Success
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <XCircle className="h-3 w-3" />
                      Failed
                    </span>
                  )}
                </Badge>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {run.items_ingested.toLocaleString()} ingested ·{' '}
                    {run.items_failed.toLocaleString()} failed
                  </span>
                  <span>{successRate}% success</span>
                </div>
                <Progress value={successRate} className="h-1.5" />
              </div>

              {run.details && (
                <p className="text-xs text-muted-foreground line-clamp-2" title={run.details}>
                  {run.details}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default IngestionHistory;

