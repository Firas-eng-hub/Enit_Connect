// Company entity types

export interface Company {
  _id: string;
  name: string;
  email: string;
  status: 'Pending' | 'Active';
  confirmationCode?: string;
  sector?: string;
  description?: string;
  address?: string;
  phone?: string;
  website?: string;
  logo?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CompanyLoginRequest {
  email: string;
  password: string;
}

export interface CompanyLoginResponse {
  id: string;
  email: string;
  name: string;
  message: string;
}

export interface CompanyRegisterRequest {
  name: string;
  email: string;
  password: string;
  sector?: string;
  description?: string;
}

export interface CompanyUpdateRequest {
  name?: string;
  sector?: string;
  description?: string;
  address?: string;
  phone?: string;
  website?: string;
}
