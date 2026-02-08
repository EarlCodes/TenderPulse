import { Release, Tender } from '@/types/tender';
import { formatZAR, formatDate, getDaysRemaining } from '@/data/mockData';
import { Building2, Calendar, MapPin, Clock, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

interface TenderCardProps {
  release: Release;
  onSave?: (tenderId: string) => void;
  isSaved?: boolean;
}

const TenderCard = ({ release, onSave, isSaved = false }: TenderCardProps) => {
  const { tender } = release;
  const navigate = useNavigate();
  const daysRemaining = getDaysRemaining(tender.tenderPeriod.endDate);
  
  const getStatusClasses = () => {
    if (tender.status === 'complete' || tender.status === 'cancelled') {
      return 'status-badge status-badge-closed';
    }
    if (daysRemaining <= 7 && daysRemaining > 0) {
      return 'status-badge status-badge-closing';
    }
    return 'status-badge status-badge-active';
  };

  const getStatusText = () => {
    if (tender.status === 'complete') return 'Closed';
    if (tender.status === 'cancelled') return 'Cancelled';
    if (daysRemaining <= 0) return 'Closed';
    if (daysRemaining <= 7) return 'Closing Soon';
    return 'Open';
  };

  const getMatchScoreClass = () => {
    if (!tender.matchScore) return 'match-score match-score-low';
    if (tender.matchScore >= 80) return 'match-score match-score-high';
    if (tender.matchScore >= 60) return 'match-score match-score-medium';
    return 'match-score match-score-low';
  };

  const handleClick = () => {
    navigate(`/tender/${tender.id}`);
  };

  return (
    <article 
      className="tender-card cursor-pointer group animate-fade-in"
      onClick={handleClick}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Header with status and match score */}
          <div className="flex items-center gap-3 mb-3">
            <span className={getStatusClasses()}>
              {getStatusText()}
            </span>
            <Badge variant="secondary" className="text-xs">
              {tender.category}
            </Badge>
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {tender.title}
          </h3>

          {/* Description */}
          {tender.description && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {tender.description}
            </p>
          )}

          {/* Buyer */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <Building2 className="h-4 w-4 shrink-0" />
            <span className="truncate">{tender.procuringEntity.name}</span>
          </div>

          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{tender.province}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Closes {formatDate(tender.tenderPeriod.endDate)}</span>
            </div>
            {daysRemaining > 0 && (
              <div className={`flex items-center gap-1.5 ${daysRemaining <= 7 ? 'text-warning' : 'text-muted-foreground'}`}>
                <Clock className="h-4 w-4" />
                <span>{daysRemaining} days left</span>
              </div>
            )}
          </div>

          {/* Value */}
          <div className="mt-4 pt-3 border-t border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Estimated Value</p>
                <p className="text-lg font-bold text-primary">{formatZAR(tender.value.amount)}</p>
              </div>
              
              {/* Match Score */}
              {tender.matchScore && (
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Match</p>
                  </div>
                  <div className={getMatchScoreClass()}>
                    {tender.matchScore}%
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

export default TenderCard;
