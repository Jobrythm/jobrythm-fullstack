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
