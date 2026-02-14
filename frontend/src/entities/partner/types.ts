export interface Partner {
  _id: string;
  id: string;
  name: string;
  logoUrl: string;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreatePartnerPayload {
  name: string;
  logoUrl: string;
}
