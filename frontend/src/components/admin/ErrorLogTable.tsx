import { useState } from 'react';
import { IngestionError, formatAdminDateTime, formatTime } from '@/data/mockAdminData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  AlertCircle, 
  CheckCircle2, 
  Eye, 
  ExternalLink,
  Clock,
  Zap,
  FileWarning,
  Wifi,
  Timer,
  FileX
} from 'lucide-react';

interface ErrorLogTableProps {
  errors: IngestionError[];
}

const ErrorLogTable = ({ errors }: ErrorLogTableProps) => {
  const [localErrors, setLocalErrors] = useState(errors);

  const getErrorTypeIcon = (errorType: IngestionError['errorType']) => {
    switch (errorType) {
      case 'Timeout':
        return <Timer className="h-4 w-4 text-warning" />;
      case 'JSON Schema Mismatch':
        return <FileWarning className="h-4 w-4 text-destructive" />;
      case 'Network Error':
        return <Wifi className="h-4 w-4 text-destructive" />;
      case 'Rate Limited':
        return <Zap className="h-4 w-4 text-warning" />;
      case 'Invalid Response':
        return <FileX className="h-4 w-4 text-destructive" />;
    }
  };

  const getStatusBadge = (status: IngestionError['status']) => {
    switch (status) {
      case 'new':
        return (
          <Badge className="bg-destructive/10 text-destructive border-destructive/20">
            <AlertCircle className="h-3 w-3 mr-1" />
            New
          </Badge>
        );
      case 'acknowledged':
        return (
          <Badge className="bg-warning/10 text-warning border-warning/20">
            <Eye className="h-3 w-3 mr-1" />
            Acknowledged
          </Badge>
        );
      case 'resolved':
        return (
          <Badge className="bg-success/10 text-success border-success/20">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Resolved
          </Badge>
        );
    }
  };

  const handleAcknowledge = (errorId: string) => {
    setLocalErrors(prev => 
      prev.map(err => 
        err.id === errorId ? { ...err, status: 'acknowledged' as const } : err
      )
    );
  };

  const handleResolve = (errorId: string) => {
    setLocalErrors(prev => 
      prev.map(err => 
        err.id === errorId ? { ...err, status: 'resolved' as const } : err
      )
    );
  };

  const truncateUrl = (url: string, maxLength: number = 50) => {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + '...';
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Error Log</h2>
            <p className="text-sm text-muted-foreground">Recent ingestion errors and their status</p>
          </div>
          <Badge variant="outline" className="text-muted-foreground">
            {localErrors.filter(e => e.status === 'new').length} unresolved
          </Badge>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-[180px]">Timestamp</TableHead>
              <TableHead className="w-[250px]">Source URL</TableHead>
              <TableHead className="w-[160px]">Error Type</TableHead>
              <TableHead>Message</TableHead>
              <TableHead className="w-[120px]">Status</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {localErrors.map((error) => (
              <TableRow 
                key={error.id}
                className={error.status === 'new' ? 'bg-destructive/5' : ''}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{formatTime(error.timestamp)}</p>
                      <p className="text-xs text-muted-foreground">{formatAdminDateTime(error.timestamp).split(',')[0]}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-muted px-2 py-1 rounded text-foreground max-w-[200px] truncate block">
                      {truncateUrl(error.sourceUrl)}
                    </code>
                    <a 
                      href={error.sourceUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                  {error.ocid && (
                    <p className="text-xs text-muted-foreground mt-1 font-mono">{error.ocid}</p>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getErrorTypeIcon(error.errorType)}
                    <span className="text-sm text-foreground">{error.errorType}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <p className="text-sm text-muted-foreground max-w-[300px] truncate" title={error.message}>
                    {error.message}
                  </p>
                </TableCell>
                <TableCell>{getStatusBadge(error.status)}</TableCell>
                <TableCell className="text-right">
                  {error.status === 'new' && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleAcknowledge(error.id)}
                      className="h-7 text-xs"
                    >
                      Ack
                    </Button>
                  )}
                  {error.status === 'acknowledged' && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleResolve(error.id)}
                      className="h-7 text-xs text-success hover:text-success"
                    >
                      Resolve
                    </Button>
                  )}
                  {error.status === 'resolved' && (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ErrorLogTable;
