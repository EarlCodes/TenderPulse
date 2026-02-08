import { Release, CPVCategory, Province, SupplierProfile, IngestionStats } from '@/types/tender';

// South African Provinces
export const provinces: Province[] = [
  { code: 'GP', name: 'Gauteng', cities: ['Johannesburg', 'Pretoria', 'Midrand', 'Centurion', 'Sandton'] },
  { code: 'WC', name: 'Western Cape', cities: ['Cape Town', 'Stellenbosch', 'Paarl', 'George', 'Mossel Bay'] },
  { code: 'KZN', name: 'KwaZulu-Natal', cities: ['Durban', 'Pietermaritzburg', 'Richards Bay', 'Newcastle'] },
  { code: 'EC', name: 'Eastern Cape', cities: ['Port Elizabeth', 'East London', 'Mthatha', 'Grahamstown'] },
  { code: 'FS', name: 'Free State', cities: ['Bloemfontein', 'Welkom', 'Kroonstad', 'Bethlehem'] },
  { code: 'MP', name: 'Mpumalanga', cities: ['Nelspruit', 'Witbank', 'Secunda', 'Middelburg'] },
  { code: 'LP', name: 'Limpopo', cities: ['Polokwane', 'Tzaneen', 'Mokopane', 'Thohoyandou'] },
  { code: 'NW', name: 'North West', cities: ['Rustenburg', 'Mahikeng', 'Potchefstroom', 'Klerksdorp'] },
  { code: 'NC', name: 'Northern Cape', cities: ['Kimberley', 'Upington', 'Springbok', 'De Aar'] },
];

// Categories based on actual API data from eTenders Portal
export const cpvCategories: CPVCategory[] = [
  { code: 'Administrative and support activities', name: 'Administrative and support activities', description: 'Administrative and support service activities' },
  { code: 'Computer programming, consultancy and related activities', name: 'Computer programming, consultancy and related activities', description: 'IT services, software development and consultancy' },
  { code: 'Construction', name: 'Construction', description: 'Construction work and civil engineering' },
  { code: 'Food and beverage service activities', name: 'Food and beverage service activities', description: 'Food and beverage service activities' },
  { code: 'Information service activities', name: 'Information service activities', description: 'Information and communication service activities' },
  { code: 'Manufacture of basic metals', name: 'Manufacture of basic metals', description: 'Manufacture of basic metals and related products' },
  { code: 'Other service activities', name: 'Other service activities', description: 'Other service-related activities' },
  { code: 'Professional, scientific and technical activities', name: 'Professional, scientific and technical activities', description: 'Professional, scientific and technical services' },
  { code: 'Repair and installation of machinery and equipment', name: 'Repair and installation of machinery and equipment', description: 'Repair and installation services for machinery and equipment' },
  { code: 'Services: Electrical', name: 'Services: Electrical', description: 'Electrical service activities' },
  { code: 'Services: General', name: 'Services: General', description: 'General service activities' },
  { code: 'Services: Professional', name: 'Services: Professional', description: 'Professional service activities' },
  { code: 'Supplies: Clothing/Textiles/Footwear', name: 'Supplies: Clothing/Textiles/Footwear', description: 'Clothing, textiles and footwear supplies' },
  { code: 'Supplies: General', name: 'Supplies: General', description: 'General supplies and materials' },
  { code: 'Travel agency, tour operator, reservation service and related activities', name: 'Travel agency, tour operator, reservation service and related activities', description: 'Travel and tourism related services' },
];

// Mock Tender Data based on OCDS structure
export const mockReleases: Release[] = [
  {
    id: 'ocds-za-2024-001',
    date: '2024-01-15T10:00:00Z',
    tag: ['tender'],
    initiationType: 'tender',
    tender: {
      id: 'TENDER-GP-2024-001',
      ocid: 'ocds-za-2024-001',
      title: 'Supply and Delivery of Medical Equipment for Gauteng Provincial Hospitals',
      description: 'The Department of Health, Gauteng Province invites tenders for the supply and delivery of medical diagnostic equipment including X-ray machines, ultrasound devices, and patient monitoring systems for 15 provincial hospitals. The contract includes installation, training, and 3-year maintenance support.',
      status: 'active',
      category: 'Medical Equipment',
      additionalProcurementCategories: ['Installation Services', 'Maintenance'],
      province: 'Gauteng',
      city: 'Johannesburg',
      value: {
        amount: 45000000,
        currency: 'ZAR'
      },
      tenderPeriod: {
        startDate: '2024-01-15T00:00:00Z',
        endDate: '2024-02-28T16:00:00Z'
      },
      procuringEntity: {
        id: 'GP-DOH',
        name: 'Gauteng Department of Health',
        contactPoint: {
          name: 'Sarah Mokoena',
          email: 'tenders@health.gp.gov.za',
          telephone: '+27 11 355 3000'
        }
      },
      documents: [
        {
          id: 'doc-001',
          documentType: 'tenderNotice',
          title: 'Tender Notice - Medical Equipment',
          url: 'https://etenders.treasury.gov.za/doc/001',
          datePublished: '2024-01-15T10:00:00Z',
          format: 'application/pdf'
        },
        {
          id: 'doc-002',
          documentType: 'biddingDocuments',
          title: 'Technical Specifications',
          url: 'https://etenders.treasury.gov.za/doc/002',
          datePublished: '2024-01-15T10:00:00Z',
          format: 'application/pdf'
        }
      ],
      matchScore: 92,
      cpvCodes: ['33000000', '50000000'],
      submissionMethod: ['electronicSubmission', 'written']
    }
  },
  {
    id: 'ocds-za-2024-002',
    date: '2024-01-18T09:00:00Z',
    tag: ['tender'],
    initiationType: 'tender',
    tender: {
      id: 'TENDER-WC-2024-002',
      ocid: 'ocds-za-2024-002',
      title: 'IT Infrastructure Upgrade for Western Cape Government Offices',
      description: 'Comprehensive IT infrastructure modernization project including network equipment, servers, cloud migration services, and cybersecurity implementation for 45 government office locations across the Western Cape Province.',
      status: 'active',
      category: 'IT Services',
      additionalProcurementCategories: ['Network Equipment', 'Cloud Services'],
      province: 'Western Cape',
      city: 'Cape Town',
      value: {
        amount: 28500000,
        currency: 'ZAR'
      },
      tenderPeriod: {
        startDate: '2024-01-18T00:00:00Z',
        endDate: '2024-02-20T16:00:00Z'
      },
      procuringEntity: {
        id: 'WC-DCAS',
        name: 'Western Cape Department of Cultural Affairs and Sport',
        contactPoint: {
          name: 'Johan van der Berg',
          email: 'procurement@westerncape.gov.za',
          telephone: '+27 21 483 5959'
        }
      },
      documents: [
        {
          id: 'doc-003',
          documentType: 'tenderNotice',
          title: 'IT Infrastructure Tender Notice',
          url: 'https://etenders.treasury.gov.za/doc/003',
          datePublished: '2024-01-18T09:00:00Z',
          format: 'application/pdf'
        }
      ],
      matchScore: 87,
      cpvCodes: ['72000000'],
      submissionMethod: ['electronicSubmission']
    }
  },
  {
    id: 'ocds-za-2024-003',
    date: '2024-01-20T14:00:00Z',
    tag: ['tender'],
    initiationType: 'tender',
    tender: {
      id: 'TENDER-KZN-2024-003',
      ocid: 'ocds-za-2024-003',
      title: 'Construction of Community Health Centres in Rural KwaZulu-Natal',
      description: 'Design and construction of 8 community health centres in underserved rural areas of KwaZulu-Natal. Project includes full architectural design, construction, installation of medical gas systems, and essential medical equipment.',
      status: 'active',
      category: 'Construction',
      additionalProcurementCategories: ['Architectural Services', 'Medical Equipment'],
      province: 'KwaZulu-Natal',
      city: 'Pietermaritzburg',
      value: {
        amount: 156000000,
        currency: 'ZAR'
      },
      tenderPeriod: {
        startDate: '2024-01-20T00:00:00Z',
        endDate: '2024-03-15T16:00:00Z'
      },
      procuringEntity: {
        id: 'KZN-DPW',
        name: 'KwaZulu-Natal Department of Public Works',
        contactPoint: {
          name: 'Thandi Nzimande',
          email: 'scm@kzndpw.gov.za',
          telephone: '+27 33 264 3000'
        }
      },
      documents: [
        {
          id: 'doc-004',
          documentType: 'tenderNotice',
          title: 'Construction Tender Notice',
          url: 'https://etenders.treasury.gov.za/doc/004',
          datePublished: '2024-01-20T14:00:00Z',
          format: 'application/pdf'
        },
        {
          id: 'doc-005',
          documentType: 'biddingDocuments',
          title: 'Architectural Drawings',
          url: 'https://etenders.treasury.gov.za/doc/005',
          datePublished: '2024-01-20T14:00:00Z',
          format: 'application/pdf'
        },
        {
          id: 'doc-006',
          documentType: 'technicalSpecifications',
          title: 'Bill of Quantities',
          url: 'https://etenders.treasury.gov.za/doc/006',
          datePublished: '2024-01-20T14:00:00Z',
          format: 'application/xlsx'
        }
      ],
      matchScore: 75,
      cpvCodes: ['45000000', '33000000'],
      submissionMethod: ['written']
    }
  },
  {
    id: 'ocds-za-2024-004',
    date: '2024-01-22T11:00:00Z',
    tag: ['tender'],
    initiationType: 'tender',
    tender: {
      id: 'TENDER-GP-2024-004',
      ocid: 'ocds-za-2024-004',
      title: 'Fleet Vehicle Procurement for Municipal Services',
      description: 'Procurement of 120 municipal service vehicles including refuse collection trucks, water tankers, and light delivery vehicles for the City of Johannesburg metropolitan municipality.',
      status: 'active',
      category: 'Transport Equipment',
      additionalProcurementCategories: ['Vehicle Maintenance'],
      province: 'Gauteng',
      city: 'Johannesburg',
      value: {
        amount: 89000000,
        currency: 'ZAR'
      },
      tenderPeriod: {
        startDate: '2024-01-22T00:00:00Z',
        endDate: '2024-02-10T16:00:00Z'
      },
      procuringEntity: {
        id: 'COJ',
        name: 'City of Johannesburg',
        contactPoint: {
          name: 'Michael Dlamini',
          email: 'fleet@joburg.org.za',
          telephone: '+27 11 407 6111'
        }
      },
      documents: [
        {
          id: 'doc-007',
          documentType: 'tenderNotice',
          title: 'Fleet Procurement Notice',
          url: 'https://etenders.treasury.gov.za/doc/007',
          datePublished: '2024-01-22T11:00:00Z',
          format: 'application/pdf'
        }
      ],
      matchScore: 68,
      cpvCodes: ['34000000'],
      submissionMethod: ['electronicSubmission', 'written']
    }
  },
  {
    id: 'ocds-za-2024-005',
    date: '2024-01-25T08:00:00Z',
    tag: ['tender'],
    initiationType: 'tender',
    tender: {
      id: 'TENDER-EC-2024-005',
      ocid: 'ocds-za-2024-005',
      title: 'Environmental Remediation and Waste Management Services',
      description: 'Comprehensive environmental services contract including landfill remediation, hazardous waste collection and disposal, and implementation of recycling programmes across 12 municipalities in the Eastern Cape.',
      status: 'complete',
      category: 'Environmental Services',
      additionalProcurementCategories: ['Waste Collection', 'Recycling'],
      province: 'Eastern Cape',
      city: 'Port Elizabeth',
      value: {
        amount: 34500000,
        currency: 'ZAR'
      },
      tenderPeriod: {
        startDate: '2024-01-25T00:00:00Z',
        endDate: '2024-01-30T16:00:00Z'
      },
      procuringEntity: {
        id: 'EC-DEDEAT',
        name: 'Eastern Cape Dept of Economic Development',
        contactPoint: {
          name: 'Nomsa Gcilitshana',
          email: 'environment@ecprov.gov.za',
          telephone: '+27 43 605 7000'
        }
      },
      documents: [
        {
          id: 'doc-008',
          documentType: 'tenderNotice',
          title: 'Environmental Services Tender',
          url: 'https://etenders.treasury.gov.za/doc/008',
          datePublished: '2024-01-25T08:00:00Z',
          format: 'application/pdf'
        }
      ],
      matchScore: 55,
      cpvCodes: ['90000000'],
      submissionMethod: ['written']
    }
  }
];

// Mock Supplier Profile
export const mockSupplierProfile: SupplierProfile = {
  id: 'supplier-001',
  companyName: 'TechVentures (Pty) Ltd',
  registrationNumber: '2019/123456/07',
  bbbeeLevel: 'Level 2',
  email: 'procurement@techventures.co.za',
  phone: '+27 11 555 0123',
  province: 'Gauteng',
  city: 'Johannesburg',
  preferredCPVs: ['72000000', '33000000'],
  preferredBuyers: ['Gauteng Department of Health', 'City of Johannesburg'],
  minValue: 500000,
  maxValue: 50000000,
  emailNotifications: true,
  smsNotifications: false,
  whatsappNotifications: true
};

// Mock Ingestion Stats
export const mockIngestionStats: IngestionStats = {
  lastFetch: '2024-01-28T06:00:00Z',
  itemsIngested: 1247,
  itemsFailed: 3,
  syncStatus: 'idle',
  sources: [
    {
      name: 'eTenders Portal',
      lastSync: '2024-01-28T06:00:00Z',
      itemCount: 892,
      status: 'success'
    },
    {
      name: 'Provincial Gazettes',
      lastSync: '2024-01-28T05:30:00Z',
      itemCount: 234,
      status: 'success'
    },
    {
      name: 'Municipal Portals',
      lastSync: '2024-01-28T04:45:00Z',
      itemCount: 121,
      status: 'success'
    }
  ]
};

// Helper function to format ZAR currency
export const formatZAR = (amount: number): string => {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Helper function to format dates
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

// Helper to calculate days remaining
export const getDaysRemaining = (endDate: string): number => {
  const end = new Date(endDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};
