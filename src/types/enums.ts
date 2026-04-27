export enum SubscriptionPlan {
  STARTER = 'starter',
  PROFESSIONAL = 'professional',
  BUSINESS = 'business',
  ADMIN = 'admin',
}

export enum JobStatus {
  DRAFT = 'Draft',
  QUOTED = 'Quoted',
  ACTIVE = 'Active',
  COMPLETED = 'Completed',
  INVOICED = 'Invoiced',
}

export enum LineItemCategory {
  LABOUR = 'Labour',
  MATERIALS = 'Materials',
  EQUIPMENT = 'Equipment',
  SUBCONTRACTOR = 'Subcontractor',
  OTHER = 'Other',
}

export enum QuoteStatus {
  DRAFT = 'Draft',
  SENT = 'Sent',
  ACCEPTED = 'Accepted',
  REJECTED = 'Rejected',
  EXPIRED = 'Expired',
}

export enum InvoiceStatus {
  DRAFT = 'Draft',
  SENT = 'Sent',
  PAID = 'Paid',
  OVERDUE = 'Overdue',
  CANCELLED = 'Cancelled',
}
