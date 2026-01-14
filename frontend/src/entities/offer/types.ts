// Offer entity types

export type OfferType = 'PFA' | 'PFE' | 'Intership' | 'Job';

export interface Offer {
  _id: string;
  title: string;
  content: string;
  type: OfferType;
  start?: string;
  end?: string;
  companyid: string;
  documents?: string[];
  candidacies?: Candidacy[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Candidacy {
  _id: string;
  studentId: string;
  body: string;
  documents?: string[];
  status?: 'pending' | 'accepted' | 'rejected';
  createdAt?: string;
}

export interface CreateOfferRequest {
  title: string;
  content: string;
  type: OfferType;
  start?: string;
  end?: string;
}

export interface ApplyToOfferRequest {
  body: string;
  documents?: string[];
}

export interface OfferWithCompany extends Offer {
  company?: {
    _id: string;
    name: string;
    logo?: string;
    sector?: string;
  };
}
