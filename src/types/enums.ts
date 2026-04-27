export enum SubscriptionPlan {
  STARTER = 'starter',
  PROFESSIONAL = 'professional',
  BUSINESS = 'business',
  ADMIN = 'admin',
}

export enum JobStatus {
  DRAFT = 'draft',
  QUOTED = 'quoted',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  INVOICED = 'invoiced',
}

export enum LineItemCategory {
  LABOUR = 'labour',
  MATERIALS = 'materials',
  EQUIPMENT = 'equipment',
  SUBCONTRACTOR = 'subcontractor',
  OTHER = 'other',
}

export enum QuoteStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

export enum LeadStatus {
  LEAD = 'lead',
  TRIAL = 'trial',
  CUSTOMER = 'customer',
  LOST = 'lost',
}

export enum LeadSource {
  ORGANIC = 'organic',
  REFERRAL = 'referral',
  PAID = 'paid',
  DIRECT = 'direct',
  OTHER = 'other',
}

export enum CampaignStatus {
  DRAFT = 'draft',
  SENT = 'sent',
}

export enum AdPlatform {
  GOOGLE_ADS = 'google_ads',
  META = 'meta',
  YOUTUBE = 'youtube',
}

export enum AdCampaignStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
}

export enum AdCreativeType {
  IMAGE = 'image',
  VIDEO = 'video',
  TEXT = 'text',
}

export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum TeamMemberRole {
  OWNER = 'owner',
  MANAGER = 'manager',
  TECHNICIAN = 'technician',
}
