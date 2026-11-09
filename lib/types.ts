export type InvoiceStatus = 'open' | 'partial' | 'paid';
export type ParticipantStatus = 'pending' | 'paid';

export type Invoice = {
  id: string;
  seller_id: string;
  title: string;
  total_amount: number;
  status: InvoiceStatus;
  note: string | null;
  card_number: string | null;
  customer_phone: string | null;
  public_token: string;
  created_at: string;
  updated_at: string;
};

export type Participant = {
  id: string;
  invoice_id: string;
  seller_id: string;
  name: string;
  phone: string;
  amount: number;
  status: ParticipantStatus;
  share_token: string;
  created_at: string;
  paid_at: string | null;
};
