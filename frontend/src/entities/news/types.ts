// News entity types

export interface News {
  _id: string;
  title: string;
  content: string;
  date?: string;
  image?: string;
  picture?: string;
  documents?: string[];
  status?: 'draft' | 'published' | string;
  audience?: Array<'student' | 'company' | 'visitor'> | string;
  category?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateNewsRequest {
  title: string;
  content: string;
  date: string;
  image?: string;
  status?: 'draft' | 'published';
  audience?: Array<'student' | 'company' | 'visitor'>;
  category?: string;
  tags?: string[];
}
