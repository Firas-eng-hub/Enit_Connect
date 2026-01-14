// Student/User entity types

export interface Student {
  _id: string;
  firstname: string;
  lastname: string;
  email: string;
  type: string;
  status: 'Pending' | 'Active';
  confirmationCode?: string;
  class?: string;
  promotion?: string;
  country?: string;
  city?: string;
  phone?: string;
  picture?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StudentLoginRequest {
  email: string;
  password: string;
}

export interface StudentLoginResponse {
  id: string;
  email: string;
  name: string;
  message: string;
}

export interface StudentRegisterRequest {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  type: string;
  class?: string;
  promotion?: string;
}

export interface StudentUpdateRequest {
  firstname?: string;
  lastname?: string;
  class?: string;
  promotion?: string;
  country?: string;
  city?: string;
  phone?: string;
}
