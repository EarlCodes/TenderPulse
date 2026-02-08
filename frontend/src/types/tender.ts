// OCDS-based types for South African Government Tenders

export interface TenderDocument {
  id: string;
  documentType: string;
  title: string;
  url: string;
  datePublished: string;
  format: string;
}

export interface TenderValue {
  amount: number;
  currency: string;
}

export interface TenderPeriod {
  startDate: string;
  endDate: string;
}

export interface ProcuringEntity {
  id: string;
  name: string;
  contactPoint?: {
    name: string;
    email: string;
    telephone: string;
  };
}

export interface BriefingSession {
  date: string;
  venue: string;
  isSession: boolean;
  compulsory: boolean;
}

export interface ContactPerson {
  name: string;
  email?: string;
  telephone?: string;
}

export interface Tender {
  id: string;
  ocid: string;
  title: string;
  description: string;
  status: 'active' | 'complete' | 'cancelled' | 'planning' | 'planned';
  category: string;
  additionalProcurementCategories: string[];
  province: string;
  city: string;
  value: TenderValue;
  tenderPeriod: TenderPeriod;
  procuringEntity: ProcuringEntity;
  documents: TenderDocument[];
  matchScore?: number;
  cpvCodes: string[];
  submissionMethod: string[];
  briefingSession?: BriefingSession;
  deliveryLocation?: string;
  procurementMethod?: string;
  procurementMethodDetails?: string;
  specialConditions?: string;
  contactPerson?: ContactPerson;
}

export interface Release {
  id: string;
  date: string;
  tag: string[];
  initiationType: string;
  tender: Tender;
}

export interface OCDSResponse {
  uri: string;
  publishedDate: string;
  version: string;
  releases: Release[];
}

// CPV Categories for South African Procurement
export interface CPVCategory {
  code: string;
  name: string;
  description: string;
}

// Province data
export interface Province {
  code: string;
  name: string;
  cities: string[];
}

// User/Supplier Profile
export interface SupplierProfile {
  id: string;
  companyName: string;
  registrationNumber: string;
  bbbeeLevel: string;
  email: string;
  phone: string;
  province: string;
  city: string;
  preferredCPVs: string[];
  preferredBuyers: string[];
  minValue: number;
  maxValue: number;
  emailNotifications: boolean;
  smsNotifications: boolean;
  whatsappNotifications: boolean;
  isPaused: boolean;
  createdAt: string;
  updatedAt: string;
}

// Saved Tender
export interface SavedTender {
  tenderId: string;
  savedAt: string;
  notes?: string;
  calendarAdded: boolean;
}

// Admin Stats
export interface IngestionStats {
  lastFetch: string;
  itemsIngested: number;
  itemsFailed: number;
  syncStatus: 'idle' | 'running' | 'error';
  sources: {
    name: string;
    lastSync: string;
    itemCount: number;
    status: 'success' | 'error' | 'pending';
  }[];
}
