import type { Release, Tender, SupplierProfile } from '@/types/tender';
import type { AdminStats, IngestionError as AdminIngestionError } from '@/data/mockAdminData';

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
const AUTH_STORAGE_KEY = 'tenderlink-user-auth';

function buildQuery(params: Record<string, string | number | string[] | undefined>) {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      value.forEach(v => usp.append(key, String(v)));
    } else {
      usp.append(key, String(value));
    }
  });
  const qs = usp.toString();
  return qs ? `?${qs}` : '';
}

function normalizeTender(t: any): Tender {
  // Map backend tender shape to frontend Tender type
  const normalized: Tender = {
    ...(t as Tender),
    id: t.tender_id ?? t.id,
  };
  
  // Ensure additionalProcurementCategories is always an array
  normalized.additionalProcurementCategories = Array.isArray(t.additional_procurement_categories) 
    ? t.additional_procurement_categories 
    : Array.isArray(t.additionalProcurementCategories)
    ? t.additionalProcurementCategories
    : [];
  
  // Ensure cpvCodes is always an array
  normalized.cpvCodes = Array.isArray(t.cpvCodes) 
    ? t.cpvCodes 
    : Array.isArray(t.cpv_codes)
    ? t.cpv_codes
    : [];
  
  // Ensure submissionMethod is always an array
  normalized.submissionMethod = Array.isArray(t.submissionMethod) 
    ? t.submissionMethod 
    : Array.isArray(t.submission_methods)
    ? t.submission_methods
    : [];
  
  return normalized;
}

function normalizeReleaseFromTender(t: Tender): Release {
  return {
    id: t.ocid || t.id,
    date: new Date().toISOString(),
    tag: ['tender'],
    initiationType: 'tender',
    tender: t,
  };
}

function getAuthToken(): string | null {
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { token?: string };
    return parsed.token || null;
  } catch {
    return null;
  }
}

function authHeaders(extra: HeadersInit = {}): HeadersInit {
  const token = getAuthToken();
  const base: HeadersInit = { ...extra };
  if (token) {
    (base as Record<string, string>)['Authorization'] = `Token ${token}`;
  }
  return base;
}

// Meta helpers
export async function fetchMetaCategories(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/api/meta/categories/`);
  if (!res.ok) throw new Error('Failed to fetch categories');
  return (await res.json()) as string[];
}

export async function fetchTenderFeed(filters: {
  search: string;
  categories: string[];
  provinces: string[];
  minValue: number;
  maxValue: number;
  status: string[];
}): Promise<Release[]> {
  const qs = buildQuery({
    search: filters.search || undefined,
    categories: filters.categories.length ? filters.categories : undefined,
    provinces: filters.provinces.length ? filters.provinces : undefined,
    minValue: filters.minValue > 0 ? filters.minValue : undefined,
    maxValue: filters.maxValue < 200000000 ? filters.maxValue : undefined,
    status: filters.status.length ? filters.status : undefined,
  });

  const res = await fetch(`${API_BASE}/api/tenders${qs}`);
  if (!res.ok) throw new Error('Failed to fetch tenders');
  const data = await res.json();
  const results: any[] = Array.isArray(data) ? data : data.results || [];

  return results.map(r => {
    const tender = normalizeTender(r.tender);
    return {
      ...r,
      tender,
    } as Release;
  });
}

export async function fetchTenderDetail(tenderId: string): Promise<Tender> {
  const res = await fetch(`${API_BASE}/api/tenders/${encodeURIComponent(tenderId)}/`);
  if (!res.ok) throw new Error('Failed to fetch tender detail');
  const data = await res.json();
  return normalizeTender(data);
}

export async function fetchSupplierProfile(): Promise<SupplierProfile> {
  const res = await fetch(`${API_BASE}/api/supplier/profile/`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch supplier profile');
  return (await res.json()) as SupplierProfile;
}

export async function updateSupplierProfile(
  profile: Partial<SupplierProfile>,
): Promise<SupplierProfile> {
  const res = await fetch(`${API_BASE}/api/supplier/profile/`, {
    method: 'PUT',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(profile),
  });
  if (!res.ok) throw new Error('Failed to update supplier profile');
  return (await res.json()) as SupplierProfile;
}

export interface SavedTenderDto {
  tenderId: string;
  savedAt: string;
  notes?: string;
  calendarAdded: boolean;
}

export async function fetchSavedTenders(): Promise<Release[]> {
  const res = await fetch(`${API_BASE}/api/supplier/saved-tenders/`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch saved tenders');
  const data = (await res.json()) as SavedTenderDto[];

  const tenders = await Promise.all(
    data.map(item => fetchTenderDetail(item.tenderId).catch(() => null)),
  );

  return tenders
    .filter((t): t is Tender => t !== null)
    .map(t => normalizeReleaseFromTender(t));
}

export async function getSavedTendersCount(): Promise<number> {
  const res = await fetch(`${API_BASE}/api/supplier/saved-tenders/`, {
    headers: authHeaders(),
  });
  if (!res.ok) return 0;
  const data = (await res.json()) as SavedTenderDto[];
  return data.length;
}

export async function saveTender(tenderId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/supplier/saved-tenders/`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ tenderId }),
  });
  if (!res.ok) throw new Error('Failed to save tender');
  // Dispatch event to update saved count
  window.dispatchEvent(new Event('savedTenderUpdated'));
}

export async function deleteSavedTender(tenderId: string): Promise<void> {
  const res = await fetch(
    `${API_BASE}/api/supplier/saved-tenders/${encodeURIComponent(tenderId)}/`,
    { method: 'DELETE', headers: authHeaders() },
  );
  if (!res.ok && res.status !== 404) throw new Error('Failed to delete saved tender');
  // Dispatch event to update saved count
  window.dispatchEvent(new Event('savedTenderUpdated'));
}

const ADMIN_AUTH_STORAGE_KEY = 'tenderlink-admin-auth';

function getAdminAuthToken(): string | null {
  try {
    const raw = window.localStorage.getItem(ADMIN_AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { token?: string };
    return parsed.token || null;
  } catch {
    return null;
  }
}

function adminAuthHeaders(extra: HeadersInit = {}): HeadersInit {
  const token = getAdminAuthToken();
  const base: HeadersInit = { ...extra };
  if (token) {
    (base as Record<string, string>)['Authorization'] = `Token ${token}`;
  }
  return base;
}

// Admin helpers (simple mapping from backend ingestion stats/errors)
export async function fetchAdminStats(): Promise<AdminStats> {
  const res = await fetch(`${API_BASE}/api/admin/ingestion/stats/`, {
    headers: adminAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch admin stats');
  const data = await res.json();

  const lastSuccessfulFetch = data.lastFetch || new Date().toISOString();

  const stats: AdminStats = {
    lastSuccessfulFetch,
    itemsIngested24h: data.itemsIngested ?? 0,
    queueDepth: 0,
    errorRate: data.itemsFailed ? Math.min(100, data.itemsFailed) : 0,
    totalErrors24h: data.itemsFailed ?? 0,
    totalReleases: data.itemsIngested ?? 0,
    uptimePercent: 99.9,
    avgResponseTime: 250,
  };

  return stats;
}

export async function fetchAdminErrors(): Promise<AdminIngestionError[]> {
  const res = await fetch(`${API_BASE}/api/admin/ingestion/errors/`, {
    headers: adminAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch admin errors');
  const data = (await res.json()) as Array<{
    occurred_at: string;
    release_id: string;
    message: string;
  }>;

  return data.map((err, idx) => ({
    id: `err-${idx}-${err.release_id || 'unknown'}`,
    timestamp: err.occurred_at,
    sourceUrl: 'https://ocds-api.etenders.gov.za/api/OCDSReleases',
    errorType: 'Invalid Response',
    message: err.message,
    status: 'new',
    ocid: err.release_id || undefined,
  }));
}

export interface AdminIngestionRun {
  id: number;
  source: string;
  started_at: string;
  finished_at: string | null;
  items_ingested: number;
  items_failed: number;
  success: boolean;
  details: string;
}

export async function fetchIngestionHistory(): Promise<AdminIngestionRun[]> {
  const res = await fetch(`${API_BASE}/api/admin/ingestion/history/`, {
    headers: adminAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch ingestion history');
  return (await res.json()) as AdminIngestionRun[];
}

export async function triggerIngestionRun(pageNumber = 1, pageSize = 100): Promise<void> {
  const res = await fetch(`${API_BASE}/api/admin/ingestion/run/`, {
    method: 'POST',
    headers: adminAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ pageNumber, pageSize }),
  });
  if (!res.ok) throw new Error('Failed to trigger ingestion run');
}

export async function triggerBackfill(params: {
  fileName?: string;
  dateFrom?: string;
  dateTo?: string;
  fileUrl?: string;
}): Promise<void> {
  const res = await fetch(`${API_BASE}/api/admin/ingestion/backfill/`, {
    method: 'POST',
    headers: adminAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error('Failed to trigger backfill');
}

// Admin supplier management
export async function fetchAdminSuppliers(search?: string): Promise<SupplierProfile[]> {
  const qs = search ? buildQuery({ search }) : '';
  const res = await fetch(`${API_BASE}/api/admin/suppliers/${qs}`, {
    headers: adminAuthHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch suppliers');
  return (await res.json()) as SupplierProfile[];
}

export async function updateAdminSupplier(
  id: string,
  data: Partial<SupplierProfile>,
): Promise<SupplierProfile> {
  const res = await fetch(`${API_BASE}/api/admin/suppliers/${id}/`, {
    method: 'PUT',
    headers: adminAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update supplier');
  return (await res.json()) as SupplierProfile;
}

// Auth APIs
export interface AuthResponse {
  user: {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
  };
  token: string;
}

export async function registerUser(params: {
  email: string;
  password: string;
  company_name?: string;
  registration_number?: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/api/auth/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || 'Failed to register');
  }
  return (await res.json()) as AuthResponse;
}

export async function loginUser(params: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/api/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || 'Failed to login');
  }
  return (await res.json()) as AuthResponse;
}

export async function loginAdmin(params: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/api/admin/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || 'Failed to login as admin');
  }

  const data = (await res.json()) as AuthResponse;

  // Persist admin auth token separately
  try {
    window.localStorage.setItem(
      ADMIN_AUTH_STORAGE_KEY,
      JSON.stringify({ token: data.token, user: data.user }),
    );
  } catch {
    // ignore storage errors
  }

  return data;
}

// Fetch new tenders from today that match user's profile
export async function fetchNewMatchingTenders(): Promise<Release[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Fetch tenders with active status
  const qs = buildQuery({
    status: ['active'],
  });

  const res = await fetch(`${API_BASE}/api/tenders${qs}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch new tenders');
  const data = await res.json();
  const results: any[] = Array.isArray(data) ? data : data.results || [];

  // Filter tenders from today and with match score > 0
  const newReleases = results
    .map(r => {
      const tender = normalizeTender(r.tender);
      return {
        ...r,
        tender,
      } as Release;
    })
    .filter(release => {
      try {
        // Check release date
        const releaseDate = release.date ? new Date(release.date) : null;
        if (!releaseDate || isNaN(releaseDate.getTime())) return false;
        
        releaseDate.setHours(0, 0, 0, 0);
        const isToday = releaseDate.getTime() === today.getTime();
        
        // Only include tenders with match score > 0 (matching profile)
        const hasMatch = release.tender.matchScore && release.tender.matchScore > 0;
        
        return isToday && hasMatch;
      } catch {
        return false;
      }
    });

  return newReleases;
}
