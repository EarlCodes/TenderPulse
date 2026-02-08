import { AdminStats } from '@/data/mockAdminData';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  Database, 
  ListTodo, 
  AlertTriangle,
  TrendingUp,
  Activity
} from 'lucide-react';

interface AdminStatCardsProps {
  stats: AdminStats;
}

const AdminStatCards = ({ stats }: AdminStatCardsProps) => {
  const formatDateTime = (dateString: string): { date: string; time: string } => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const lastFetch = formatDateTime(stats.lastSuccessfulFetch);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Last Successful Fetch */}
      <div className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="w-11 h-11 rounded-xl bg-success/10 flex items-center justify-center">
            <Clock className="h-5 w-5 text-success" />
          </div>
          <Badge variant="outline" className="text-xs border-success/30 text-success bg-success/5">
            <Activity className="h-3 w-3 mr-1" />
            Live
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">Last Successful Fetch</p>
        <p className="text-xl font-bold text-foreground">{lastFetch.date}</p>
        <p className="text-sm text-muted-foreground mt-1">{lastFetch.time}</p>
      </div>

      {/* Items Ingested (24h) */}
      <div className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
            <Database className="h-5 w-5 text-primary" />
          </div>
          <div className="flex items-center gap-1 text-success text-xs font-medium">
            <TrendingUp className="h-3 w-3" />
            +12%
          </div>
        </div>
        <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">Items Ingested (24h)</p>
        <p className="text-3xl font-bold text-foreground">{stats.itemsIngested24h.toLocaleString()}</p>
        <p className="text-sm text-muted-foreground mt-1">{stats.totalReleases.toLocaleString()} total releases</p>
      </div>

      {/* Queue Depth */}
      <div className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="w-11 h-11 rounded-xl bg-info/10 flex items-center justify-center">
            <ListTodo className="h-5 w-5 text-info" />
          </div>
          <Badge 
            variant="outline" 
            className={`text-xs ${stats.queueDepth === 0 ? 'border-success/30 text-success bg-success/5' : 'border-warning/30 text-warning bg-warning/5'}`}
          >
            {stats.queueDepth === 0 ? 'Idle' : 'Processing'}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">Queue Depth</p>
        <p className="text-3xl font-bold text-foreground">{stats.queueDepth}</p>
        <p className="text-sm text-muted-foreground mt-1">items in queue</p>
      </div>

      {/* Error Rate */}
      <div className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${stats.errorRate > 5 ? 'bg-destructive/10' : 'bg-warning/10'}`}>
            <AlertTriangle className={`h-5 w-5 ${stats.errorRate > 5 ? 'text-destructive' : 'text-warning'}`} />
          </div>
          <Badge 
            variant="outline" 
            className={`text-xs ${stats.errorRate < 2 ? 'border-success/30 text-success bg-success/5' : stats.errorRate < 5 ? 'border-warning/30 text-warning bg-warning/5' : 'border-destructive/30 text-destructive bg-destructive/5'}`}
          >
            {stats.errorRate < 2 ? 'Healthy' : stats.errorRate < 5 ? 'Warning' : 'Critical'}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">Error Rate</p>
        <p className="text-3xl font-bold text-foreground">{stats.errorRate}%</p>
        <p className="text-sm text-muted-foreground mt-1">{stats.totalErrors24h} errors in 24h</p>
      </div>
    </div>
  );
};

export default AdminStatCards;
