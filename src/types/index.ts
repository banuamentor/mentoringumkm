export type UserRole = 'ADMIN' | 'MENTOR' | 'UMKM';
export type AccountStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
export type ActionPlanStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface UserProfile {
  id: number;
  firebaseUid: string;
  email: string;
  fullName: string;
  role: UserRole;
  accountStatus: AccountStatus;
  createdAt: string;
  updatedAt: string;
}

export interface UmkmProfile {
  id: number;
  profileId: number;
  businessName: string;
  ownerName: string;
  whatsapp: string | null;
  email: string | null;
  cityRegency: string | null;
  district: string | null;
  address: string | null;
  establishedYear: number | null;
  businessSector: string | null;
  commodity: string | null;
  description: string | null;
  nib: string | null;
  instagram: string | null;
  marketplace: string | null;
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MentorProfile {
  id: number;
  profileId: number;
  fullName: string;
  email: string;
  whatsapp: string | null;
  institution: string | null;
  position: string | null;
  bio: string | null;
  expertise: string | null;
  photoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: number;
  umkmId: number;
  name: string;
  sku: string | null;
  unit: string;
  defaultSellingPrice: number;
  defaultHpp: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export interface SalesChannel {
  id: number;
  name: string;
  isActive: boolean;
  sortOrder: number;
}

export interface SaleItem {
  id: number;
  saleId: number;
  productId: number;
  productNameSnapshot: string;
  quantity: number;
  sellingPrice: number;
  hppSnapshot: number;
  subtotal: number;
  totalHpp: number;
  grossProfit: number;
}

export interface Sale {
  id: number;
  umkmId: number;
  transactionDate: string;
  salesChannelId: number;
  channelName?: string;
  customerName: string | null;
  notes: string | null;
  totalRevenue: number;
  totalHpp: number;
  grossProfit: number;
  createdAt: string;
  items?: SaleItem[];
}

export interface Program {
  id: number;
  name: string;
  description: string | null;
  organizer: string | null;
  batch?: string | null;
  targetParticipants?: number | null;
  startDate: string | null;
  endDate: string | null;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  createdBy: number;
}

export interface MentorAssignment {
  id: number;
  programId: number;
  programName?: string;
  mentorId: number;
  mentorName?: string;
  mentorEmail?: string;
  mentorExpertise?: string;
  mentorPhotoUrl?: string;
  umkmId: number;
  businessName?: string;
  ownerName?: string;
  cityRegency?: string;
  businessSector?: string;
  assignedAt: string;
  assignedDate?: string;
  status: 'ACTIVE' | 'ENDED';
}

export interface MentoringSession {
  id: number;
  programId: number;
  programName?: string;
  mentorId: number;
  mentorName?: string;
  umkmId: number;
  businessName?: string;
  sessionDate: string;
  topic: string;
  problem: string | null;
  findings: string | null;
  recommendation: string;
  additionalNotes: string | null;
  createdAt: string;
}

export interface ActionPlanEvaluation {
  id: number;
  actionPlanId: number;
  mentorId: number;
  evaluationDate: string;
  status: string;
  evaluationNotes: string;
  result: string | null;
  nextRecommendation: string | null;
  createdAt: string;
}

export interface ActionPlan {
  id: number;
  programId: number;
  programName?: string;
  mentoringSessionId: number | null;
  mentorId: number;
  mentorName?: string;
  umkmId: number;
  businessName?: string;
  title: string;
  description: string | null;
  target: string | null;
  pic: string | null;
  deadline: string;
  status: ActionPlanStatus;
  completedAt: string | null;
  createdAt: string;
  isOverdue?: boolean;
  evaluations?: ActionPlanEvaluation[];
}

export interface UmkmAnalyticsData {
  period: {
    filter: string;
    start: string;
    end: string;
  };
  kpi: {
    totalRevenue: number;
    totalHpp: number;
    grossProfit: number;
    grossProfitMargin: number;
    totalTransactions: number;
    totalQuantity: number;
    averageTransactionValue: number;
    growthLabel: string;
    growthRate: number | null;
    prevRevenue: number;
  };
  products: {
    list: Array<{
      id: number;
      name: string;
      quantity: number;
      revenue: number;
      hpp: number;
      grossProfit: number;
      margin: number;
    }>;
    topByQuantity: any;
    topByRevenue: any;
    topByGrossProfit: any;
    topByMargin: any;
  };
  channels: {
    list: Array<{
      channelName: string;
      revenue: number;
      hpp: number;
      grossProfit: number;
      transactions: number;
    }>;
    topByRevenue: any;
    topByProfit: any;
    topByTransactions: any;
  };
  trend: Array<{
    date: string;
    omzet: number;
    labaKotor: number;
  }>;
}
