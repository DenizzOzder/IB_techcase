/**
 * İşlem (Tapu vs.) Aşama Statüleri
 * AGREEMENT: Anlaşma Sağlandı
 * EARNEST_MONEY: Kapora Alındı
 * TITLE_DEED: Tapu Devri Aşamasında
 * COMPLETED: İşlem Tamamlandı (Komisyon hakediliş noktası)
 * CANCELLED: İptal Edildi
 */
export enum TransactionStatus {
  AGREEMENT = 'AGREEMENT',
  EARNEST_MONEY = 'EARNEST_MONEY',
  TITLE_DEED = 'TITLE_DEED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

/**
 * Komisyonun Tahsilat Durumu
 */
export enum CommissionStatus {
  UNPAID = 'UNPAID',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED' // Eğer tapuda sorun çıkar vs iptal olursa
}

export interface ITransaction {
  _id?: string;
  propertyTitle: string;     // İlan / Gayrimenkul Adı
  propertyPrice: number;     // Mülkün veya sözleşmenin toplam tutarı
  agentId: string;           // İşlemi açan danışmanın User._id referansı (JWT'den alınır)
  agentName?: string;        // Geriye dönük uyumluluk için optional
  commissionRate: number;    // Yüzdelik Oran (Örn: 2 => %2)
  status: TransactionStatus;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface ICommission {
  _id?: string;
  transactionId: string; // MongoDB ObjectId Referansı bağlanacak
  amount: number; // Hesaplanmış komisyon (propertyPrice * commissionRate / 100)
  status: CommissionStatus;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

// Request & Response Typings
export interface ICreateTransactionRequest {
  propertyTitle: string;
  propertyPrice: number;
  // agentId: backend JWT token'dan otomatik alınır, client göndermez
  commissionRate: number;
}

export interface IUpdateTransactionStatusRequest {
  status: TransactionStatus;
}

export enum Role {
  ADMIN = 'ADMIN',
  AGENT = 'AGENT'
}

export interface IUser {
  _id?: string;
  name: string;
  email: string;
  password?: string;
  role: Role;
  hashedRefreshToken?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface IJwtPayload {
  sub: string;
  email: string;
  role: Role;
}

export interface ILoginRequest {
  email: string;
  password?: string;
}

export interface ILoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    _id: string;
    email: string;
    name: string;
    role: Role;
  };
}

export interface IRegisterAgentRequest {
  name: string;
  email: string;
  password?: string;
}

// ─── Admin İstatistik Tipleri ──────────────────────────────────────────────

export interface IStatsTrendItem {
  label: string;       // "Oca", "Şub" ... veya "2021", "2022"
  volume: number;      // O dönemdeki toplam satış tutarı
  commission: number;  // O dönemdeki toplam komisyon
  count: number;       // İşlem sayısı
}

export interface IStatsStatusItem {
  status: TransactionStatus;
  count: number;
}

export interface IStatsSummary {
  totalVolume: number;       // Tamamlanan işlemlerin toplam satış tutarı
  totalCommission: number;   // Toplam komisyon geliri
  totalTransactions: number; // Tüm zamanların toplam işlem sayısı
  completedCount: number;
  cancelledCount: number;
  activeCount: number;       // AGREEMENT + EARNEST_MONEY + TITLE_DEED
}

export interface IStatsResponse {
  summary: IStatsSummary;
  trend: IStatsTrendItem[];
  statusDistribution: IStatsStatusItem[];
  period: 'monthly' | 'yearly';
}

// ─── Danışman (Agent) Yönetimi Tipleri ─────────────────────────────────────────

export interface IAgentResponse {
  _id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
  isActive: boolean;
}

export interface IAgentStats {
  totalTransactions: number;
  completedTransactions: number;
  totalVolume: number;
  totalCommission: number;
}

export interface IAgentDetailResponse extends IAgentResponse {
  stats: IAgentStats;
}

// ─── Sistem Logları (Audit Logs) Tipleri ───────────────────────────────────────

export enum AuditLogAction {
  CREATED = 'CREATED',
  ADVANCED = 'ADVANCED',
  ROLLED_BACK = 'ROLLED_BACK',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

export interface IAuditLog {
  _id: string;
  transactionId: string;
  agentId: string;
  agentName: string; // Hızlı gösterim için
  propertyTitle: string; // Hızlı gösterim için
  action: AuditLogAction;
  previousStatus?: TransactionStatus;
  newStatus: TransactionStatus;
  createdAt: string;
}

export interface IAuditLogsResponse {
  data: IAuditLog[];
  total: number;
  page: number;
  totalPages: number;
}
