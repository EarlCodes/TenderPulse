export interface IngestionError {
  id: string;
  timestamp: string;
  sourceUrl: string;
  errorType: 'Timeout' | 'JSON Schema Mismatch' | 'Network Error' | 'Rate Limited' | 'Invalid Response';
  message: string;
  status: 'new' | 'acknowledged' | 'resolved';
  ocid?: string;
}

export interface AdminStats {
  lastSuccessfulFetch: string;
  itemsIngested24h: number;
  queueDepth: number;
  errorRate: number;
  totalErrors24h: number;
  totalReleases: number;
  uptimePercent: number;
  avgResponseTime: number;
}

// Mock admin statistics
export const mockAdminStats: AdminStats = {
  lastSuccessfulFetch: '2026-02-03T05:55:00Z',
  itemsIngested24h: 156,
  queueDepth: 0,
  errorRate: 0.8,
  totalErrors24h: 3,
  totalReleases: 2847,
  uptimePercent: 99.9,
  avgResponseTime: 245,
};

// Mock ingestion errors
export const mockIngestionErrors: IngestionError[] = [
  {
    id: 'err-001',
    timestamp: '2026-02-03T04:22:15Z',
    sourceUrl: 'https://data.treasury.gov.za/api/3/action/package_show?id=ocds-123456',
    errorType: 'Timeout',
    message: 'Request timed out after 30000ms',
    status: 'new',
    ocid: 'ocds-abc123-tender-2024-0892',
  },
  {
    id: 'err-002',
    timestamp: '2026-02-03T03:45:33Z',
    sourceUrl: 'https://data.treasury.gov.za/api/3/action/datastore_search',
    errorType: 'JSON Schema Mismatch',
    message: 'Missing required field: tender.procuringEntity.name',
    status: 'acknowledged',
    ocid: 'ocds-abc123-tender-2024-0756',
  },
  {
    id: 'err-003',
    timestamp: '2026-02-03T02:18:09Z',
    sourceUrl: 'https://etenders.gov.za/api/v2/tenders',
    errorType: 'Rate Limited',
    message: 'API rate limit exceeded. Retry after 60 seconds.',
    status: 'resolved',
  },
  {
    id: 'err-004',
    timestamp: '2026-02-02T23:55:41Z',
    sourceUrl: 'https://data.treasury.gov.za/api/3/action/package_list',
    errorType: 'Network Error',
    message: 'ECONNREFUSED - Connection refused by remote host',
    status: 'resolved',
  },
  {
    id: 'err-005',
    timestamp: '2026-02-02T21:12:28Z',
    sourceUrl: 'https://provincial.gov.za/procurement/feed',
    errorType: 'Invalid Response',
    message: 'Response content-type is text/html, expected application/json',
    status: 'resolved',
  },
];

// Format date for display
export const formatAdminDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatAdminDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-ZA', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};
