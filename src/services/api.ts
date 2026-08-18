import type { JobListing } from '../data/jobs';
import type {
  AlumniEvent,
  AlumniProfile,
  BioBookClaimResponse,
  BioBookLookupResponse,
  BioBookProfile,
  EventParticipant,
  EventRsvp,
  EventRsvpStatus,
  EventStatus,
  LoginResponse,
  OnboardingLookupResponse,
  PasswordResetResponse,
  RegistrationRequest,
  SendCodeResponse,
  VerifyCodeResponse,
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
  applicationLink?: string;
  description: string;
  postedByName?: string;
  postedById?: string;
  createdAt?: string;
  startDate?: string;
  endDate?: string;
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

  lookupOnboarding: async (email: string): Promise<OnboardingLookupResponse> =>
    request<OnboardingLookupResponse>('/onboarding/lookup', {
      method: 'POST',
      body: JSON.stringify({ email: toClaimEmail(email) }),
      skipAuth: true,
    }),

  sendOnboardingCode: async (email: string): Promise<SendCodeResponse> =>
    request<SendCodeResponse>('/onboarding/send-code', {
      method: 'POST',
      body: JSON.stringify({ email: toClaimEmail(email) }),
      skipAuth: true,
    }),

  verifyOnboardingCode: async (email: string, code: string): Promise<VerifyCodeResponse> =>
    request<VerifyCodeResponse>('/onboarding/verify-code', {
      method: 'POST',
      body: JSON.stringify({ email: toClaimEmail(email), code }),
      skipAuth: true,
    }),

  claimOnboarding: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await request<LoginResponse>('/onboarding/claim', {
      method: 'POST',
      body: JSON.stringify({ email: toClaimEmail(email), password }),
      skipAuth: true,
    });
    persistSession(response);
    await flushPendingConsent();
    return response;
  },

  recordConsent: async (email: string, source: string): Promise<void> => {
    const consentText = `Your profile may be pre-populated with existing alumni details. By continuing, ${toUniversityEmail(email)} agreed to allow us to store and use account and profile information to provide access to the alumni portal. Source: ${source}.`;
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
    const destination = toUniversityEmail(email);
    await request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: destination }),
      skipAuth: true,
    });
    return {
      sent: true,
      destination,
    };
  },

  resetPassword: async (token: string, password: string): Promise<void> => {
    await request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
      skipAuth: true,
    });
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

  uploadProfilePhoto: async (file: File): Promise<{ key: string; url: string }> => {
    const token = getToken();
    if (!token) throw new ApiError(401, 'Please log in to continue.');
    const body = new FormData();
    body.set('file', file);
    const response = await fetch(`${API_BASE_URL}/headshots/me`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body,
    });
    if (!response.ok) {
      throw new ApiError(response.status, friendlyErrorMessage(response.status, '/headshots/me', await response.text()));
    }
    return response.json() as Promise<{ key: string; url: string }>;
  },

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

  updateEvent: async (id: string, payload: Partial<AlumniEvent>): Promise<AlumniEvent> =>
    request<AlumniEvent>(`/events/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteEvent: async (id: string): Promise<void> => {
    await request(`/events/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  getMyEventRsvps: async (): Promise<EventRsvp[]> =>
    request<EventRsvp[]>('/events/rsvps/me'),

  updateEventRsvp: async (eventId: string, status: EventRsvpStatus): Promise<EventRsvp> =>
    request<EventRsvp>(`/events/${encodeURIComponent(eventId)}/rsvp`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),

  getEventParticipants: async (eventId: string): Promise<EventParticipant[]> =>
    request<EventParticipant[]>(`/events/${encodeURIComponent(eventId)}/participants`, {
      suppressAuthRedirect: true,
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

  getJobById: async (id: string): Promise<JobListing | undefined> => {
    try {
      const job = await request<BackendJobPost>(`/jobs/${encodeURIComponent(id)}`);
      return toJobListing(job);
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) return undefined;
      throw error;
    }
  },

  createJob: async (payload: Omit<JobListing, 'id' | 'postedBy'>): Promise<JobListing> => {
    const location = [payload.city, payload.state].filter(Boolean).join(', ');
    const job = await request<BackendJobPost>('/jobs', {
      method: 'POST',
      body: JSON.stringify({
        title: payload.title,
        company: payload.company,
        location: location || null,
        externalLink: payload.externalLink || null,
        applicationLink: payload.applicationLink || null,
        description: payload.description,
        startDate: payload.startDate || null,
        endDate: payload.endDate || null,
      }),
    });
    return toJobListing(job, payload);
  },

  updateJob: async (id: string, payload: Omit<JobListing, 'id' | 'postedBy'>): Promise<JobListing> => {
    const location = [payload.city, payload.state].filter(Boolean).join(', ');
    const job = await request<BackendJobPost>(`/jobs/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify({
        title: payload.title,
        company: payload.company,
        location: location || null,
        externalLink: payload.externalLink || null,
        applicationLink: payload.applicationLink || null,
        description: payload.description,
        startDate: payload.startDate || null,
        endDate: payload.endDate || null,
      }),
    });
    return toJobListing(job, payload);
  },

  deleteJob: async (id: string): Promise<void> => {
    await request(`/jobs/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },
};

async function request<T = unknown>(
  path: string,
  options: RequestInit & { skipAuth?: boolean; suppressAuthRedirect?: boolean } = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (!options.skipAuth) {
    const token = getToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new ApiError(0, 'Unable to reach the server. Please check your connection and try again.');
  }

  if (!response.ok) {
    const message = await response.text();
    if (!options.skipAuth && !options.suppressAuthRedirect && (response.status === 401 || response.status === 403)) {
      clearSession();
      redirectToLogin();
      throw new Error('Please login again, your session has expired.');
    }
    throw new ApiError(response.status, friendlyErrorMessage(response.status, path, message));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
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

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem('wharton.profile');
  localStorage.removeItem('wharton.biobookProfile');
}

function redirectToLogin() {
  if (window.location.pathname !== '/login') {
    window.location.assign('/login');
  }
}

function friendlyErrorMessage(status: number, path: string, body: string) {
  if (path.includes('/auth/login') && status === 401) {
    return 'Invalid email or password. Please try again.';
  }
  if (status === 400) return 'Please check the information entered and try again.';
  if (status === 401) return 'Please log in to continue.';
  if (status === 403) return 'You do not have permission to complete this action.';
  if (status === 404) return 'We could not find the requested item.';
  if (status === 409) return 'This record already exists or has already been claimed.';
  if (status >= 500) return 'Something went wrong on the server. Please try again shortly.';

  const parsedMessage = extractBackendMessage(body);
  return parsedMessage || 'Unable to complete the request. Please try again.';
}

function extractBackendMessage(body: string) {
  if (!body) return '';
  try {
    const parsed = JSON.parse(body) as { message?: unknown; error?: unknown };
    const message = typeof parsed.message === 'string' ? parsed.message : typeof parsed.error === 'string' ? parsed.error : '';
    return message && !message.startsWith('{') ? message : '';
  } catch {
    return body.trim().startsWith('{') ? '' : body.trim();
  }
}

function toUniversityEmail(value: string) {
  const trimmed = value.trim().toLowerCase();
  return trimmed.includes('@') ? trimmed : `${trimmed}@${UNIVERSITY_DOMAIN}`;
}

function toClaimEmail(value: string) {
  const trimmed = value.trim().toLowerCase();
  if (trimmed.includes('@')) return trimmed;
  return `${trimmed}@${UNIVERSITY_DOMAIN}`;
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
    externalLink: job.externalLink ?? fallback?.externalLink,
    applicationLink: job.applicationLink ?? fallback?.applicationLink,
    description: job.description,
    postedBy: job.postedByName ?? 'Wharton Alumni',
    postedById: job.postedById,
    startDate: job.startDate ?? fallback?.startDate,
    endDate: job.endDate ?? fallback?.endDate,
  };
}
