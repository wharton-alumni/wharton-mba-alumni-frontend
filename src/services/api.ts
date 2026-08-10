import type { JobListing } from '../data/jobs';
import type {
  AlumniEvent,
  AlumniProfile,
  BioBookClaimResponse,
  BioBookLookupResponse,
  BioBookProfile,
  EventStatus,
  LoginResponse,
  PasswordResetResponse,
  RegistrationRequest,
} from '../types/domain';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://api.whartonemba.com/api';
const TOKEN_KEY = 'wharton.token';
const PENDING_CONSENT_KEY = 'wharton.pendingConsent';
const UNIVERSITY_DOMAIN = 'wharton.upenn.edu';

export interface DirectoryFilters {
  search?: string;
  cohortCampus?: string;
  industry?: string;
  location?: string;
  classYearFrom?: string;
  classYearTo?: string;
  willingToMentor?: boolean;
  hiring?: boolean;
}

interface BackendJobPost {
  id: string;
  title: string;
  company: string;
  location?: string;
  externalLink?: string;
  description: string;
  postedByName?: string;
  createdAt?: string;
}

export const api = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: toUniversityEmail(email), password }),
      skipAuth: true,
    });
    persistSession(response);
    await flushPendingConsent();
    return response;
  },

  register: async (payload: RegistrationRequest): Promise<LoginResponse> => {
    const response = await request<LoginResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ ...payload, email: toUniversityEmail(payload.email) }),
      skipAuth: true,
    });
    persistSession(response);
    await flushPendingConsent();
    return response;
  },

  lookupBioBook: async (email: string): Promise<BioBookLookupResponse> =>
    request<BioBookLookupResponse>('/auth/biobook/lookup', {
      method: 'POST',
      body: JSON.stringify({ email: toUniversityEmail(email) }),
      skipAuth: true,
    }),

  recordConsent: async (email: string, source: string): Promise<void> => {
    const consentText = `Consent accepted for ${source} by ${toUniversityEmail(email)}.`;
    if (!getToken()) {
      sessionStorage.setItem(PENDING_CONSENT_KEY, JSON.stringify({ consentText }));
      return;
    }
    await request('/consents', {
      method: 'POST',
      body: JSON.stringify({ consentText }),
    });
  },

  sendPasswordReset: async (email: string): Promise<PasswordResetResponse> => {
    await request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: toUniversityEmail(email) }),
      skipAuth: true,
    });
    return {
      sent: true,
      destination: toUniversityEmail(email),
    };
  },

  claimBioBook: async (email: string, password: string): Promise<BioBookClaimResponse> => {
    const response = await request<BioBookClaimResponse>('/auth/biobook/claim', {
      method: 'POST',
      body: JSON.stringify({ email: toUniversityEmail(email), password }),
      skipAuth: true,
    });
    persistSession(response);
    await flushPendingConsent();
    return response;
  },

  getBioBookProfiles: async (): Promise<BioBookProfile[]> => request<BioBookProfile[]>('/biobook/profiles'),

  getBioBookProfileById: async (id: string): Promise<BioBookProfile | undefined> => {
    try {
      return await request<BioBookProfile>(`/biobook/profiles/${encodeURIComponent(id)}`);
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) return undefined;
      throw error;
    }
  },

  updateProfile: async (_id: string, payload: Partial<AlumniProfile>): Promise<AlumniProfile> =>
    request<AlumniProfile>('/profiles/me', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  getProfiles: async (filters: DirectoryFilters = {}): Promise<AlumniProfile[]> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && value !== false) {
        params.set(key, String(value));
      }
    });
    const query = params.toString();
    return request<AlumniProfile[]>(`/profiles${query ? `?${query}` : ''}`);
  },

  getEvents: async (status: EventStatus = 'APPROVED'): Promise<AlumniEvent[]> =>
    request<AlumniEvent[]>(`/events?status=${encodeURIComponent(status)}`),

  submitEvent: async (payload: Partial<AlumniEvent>): Promise<AlumniEvent> =>
    request<AlumniEvent>('/events', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  moderateEvent: async (id: string, status: EventStatus): Promise<AlumniEvent> =>
    request<AlumniEvent>(`/admin/events/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  getJobs: async (): Promise<JobListing[]> => {
    const jobs = await request<BackendJobPost[]>('/jobs');
    return jobs.map((job) => toJobListing(job));
  },

  createJob: async (payload: Omit<JobListing, 'id' | 'postedBy'>): Promise<JobListing> => {
    const location = [payload.city, payload.state].filter(Boolean).join(', ');
    const job = await request<BackendJobPost>('/jobs', {
      method: 'POST',
      body: JSON.stringify({
        title: payload.title,
        company: payload.company,
        location,
        description: payload.description,
      }),
    });
    return toJobListing(job, payload);
  },
};

async function request<T = unknown>(
  path: string,
  options: RequestInit & { skipAuth?: boolean } = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (!options.skipAuth) {
    const token = getToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

async function flushPendingConsent() {
  const stored = sessionStorage.getItem(PENDING_CONSENT_KEY);
  if (!stored || !getToken()) return;
  sessionStorage.removeItem(PENDING_CONSENT_KEY);
  try {
    const pending = JSON.parse(stored) as { consentText: string };
    await request('/consents', {
      method: 'POST',
      body: JSON.stringify({ consentText: pending.consentText }),
    });
  } catch {
    sessionStorage.setItem(PENDING_CONSENT_KEY, stored);
  }
}

function persistSession(response: LoginResponse) {
  localStorage.setItem(TOKEN_KEY, response.token);
  localStorage.setItem('wharton.profile', JSON.stringify(response.profile));
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function toUniversityEmail(value: string) {
  const trimmed = value.trim().toLowerCase();
  return trimmed.includes('@') ? trimmed : `${trimmed}@${UNIVERSITY_DOMAIN}`;
}

function toJobListing(job: BackendJobPost, fallback?: Partial<JobListing>): JobListing {
  const [city = fallback?.city ?? '', state = fallback?.state ?? ''] = (job.location ?? '').split(',').map((part) => part.trim());
  return {
    id: job.id,
    title: job.title,
    company: job.company,
    industry: fallback?.industry ?? 'General Management',
    city,
    state,
    type: fallback?.type ?? 'Full-time',
    seniority: fallback?.seniority ?? 'Executive',
    description: job.description,
    postedBy: job.postedByName ?? 'Wharton Alumni',
  };
}
