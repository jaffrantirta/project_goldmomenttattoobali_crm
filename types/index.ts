export type ReferralSource = "google" | "instagram" | "friend" | "tour_guide";
export type InquiryStatus = "not_followed_up" | "followed_up";
export type BookingStatus = "confirmed" | "completed" | "cancelled";
export type AdminRole = "super_admin" | "admin";

export interface Inquiry {
  id: string;
  name: string;
  whatsapp: string;
  referral_source: ReferralSource;
  status: InquiryStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  inquiry_id: string | null;
  client_name: string;
  whatsapp: string;
  source: string | null;
  booking_date: string | null;
  booking_end_date: string | null;
  tattoo_description: string | null;
  deposit_amount: number | null;
  booking_status: BookingStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  inquiry?: Inquiry;
}

export const SOURCE_LABELS: Record<string, string> = {
  google: "Google",
  instagram: "Instagram",
  friend: "Friend",
  tour_guide: "Tour Guide",
  walk_in: "Walk-in",
  direct: "Direct",
};

export interface Admin {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  created_at: string;
  created_by: string | null;
  creator?: { name: string; email: string };
}

export interface AuditLog {
  id: string;
  admin_id: string | null;
  admin_email: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  created_at: string;
}

export const REFERRAL_LABELS: Record<ReferralSource, string> = {
  google: "Google",
  instagram: "Instagram",
  friend: "Friend",
  tour_guide: "Tour Guide",
};

export const INQUIRY_STATUS_LABELS: Record<InquiryStatus, string> = {
  not_followed_up: "Not Followed Up",
  followed_up: "Followed Up",
};

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};
