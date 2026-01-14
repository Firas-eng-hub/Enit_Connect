// News entity types

export interface News {
  _id: string;
  title: string;
  content: string;
  image?: string;
  documents?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateNewsRequest {
  title: string;
  content: string;
  image?: string;
}
