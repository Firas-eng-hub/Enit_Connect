export type Audience = 'student' | 'company';

/** Real stages of an ENIT student's career, and the real steps of hiring on the platform. */
export const STOPS: Record<Audience, readonly string[]> = {
  student: ['worker', 'pfa', 'engineer', 'pfe', 'job'],
  company: ['account', 'publish', 'receive', 'review', 'reply'],
};

export const REGISTER_LINK: Record<Audience, string> = {
  student: '/register',
  company: '/register?type=company',
};
