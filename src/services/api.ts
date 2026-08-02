import seedAlumniProfiles from '../data/seedAlumniProfiles.json';
import seedEvents from '../data/seedEvents.json';
import type {
  AlumniEvent,
  AlumniProfile,
  BioBookClaimResponse,
  BioBookLookupResponse,
  CohortCampus,
  EventStatus,
  LoginResponse,
  RegistrationRequest,
  Role,
} from '../types/domain';

const ACCOUNTS_KEY = 'wharton.localAccounts';
const EVENTS_KEY = 'wharton.localEvents';

interface LocalAccount {
  email: string;
  password: string;
  profile: AlumniProfile;
}

interface SeedAlumniProfile {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  cohortCampus: CohortCampus;
  classYear: number;
  currentTitle: string;
  currentCompany: string;
  industry: string;
  city: string;
  stateCountry: string;
  linkedinUrl?: string;
  bio: string;
  willingToMentor: boolean;
  hiring: boolean;
  avatarUrl?: string;
  role: Role;
  approved: boolean;
}

interface SeedEvent {
  title: string;
  description: string;
  category: AlumniEvent['category'];
  eventDate?: string | null;
  location: string;
  externalLink?: string;
  imageUrl?: string;
  postedByEmail: string;
  status: EventStatus;
}

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

export const api = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const account = getAccounts().find((item) => item.email === normalizeEmail(email));
    if (!account || account.password !== password) {
      throw new Error('Invalid email or password.');
    }
    return toSession(account.profile);
  },

  register: async (payload: RegistrationRequest): Promise<LoginResponse> => {
    const accounts = getAccounts();
    const email = normalizeEmail(payload.email);
    if (accounts.some((account) => account.email === email)) {
      throw new Error('An alumni profile already exists for that email.');
    }

    const profile: AlumniProfile = {
      id: crypto.randomUUID(),
      email,
      firstName: payload.firstName,
      lastName: payload.lastName,
      phoneNumber: payload.phoneNumber,
      cohortCampus: payload.cohortCampus,
      classYear: payload.classYear,
      currentTitle: payload.currentTitle,
      currentCompany: payload.currentCompany,
      industry: payload.industry,
      city: payload.city,
      stateCountry: payload.stateCountry,
      linkedinUrl: payload.linkedinUrl,
      bio: payload.bio,
      willingToMentor: payload.willingToMentor,
      hiring: payload.hiring,
      avatarUrl: payload.avatarUrl,
      role: 'ALUMNI',
      approved: true,
      createdAt: new Date().toISOString(),
    };

    saveAccounts([...accounts, { email, password: payload.password, profile }]);
    return toSession(profile);
  },

  lookupBioBook: async (email: string): Promise<BioBookLookupResponse> => {
    void email;
    return { exists: false };
  },

  claimBioBook: async (email: string, password: string): Promise<BioBookClaimResponse> => {
    void email;
    void password;
    throw new Error('BioBook claiming requires a secure backend and is disabled in frontend-only mode.');
  },

  updateProfile: async (id: string, payload: Partial<AlumniProfile>): Promise<AlumniProfile> => {
    const accounts = getAccounts();
    const index = accounts.findIndex((account) => account.profile.id === id);
    if (index === -1) {
      const currentProfile = getCurrentProfile();
      if (!currentProfile || currentProfile.id !== id) {
        throw new Error('Profile not found.');
      }
      const updated = { ...currentProfile, ...payload, id };
      saveAccounts([...accounts, { email: normalizeEmail(updated.email), password: '', profile: updated }]);
      localStorage.setItem('wharton.profile', JSON.stringify(updated));
      return updated;
    }
    const updated = { ...accounts[index].profile, ...payload, id };
    accounts[index] = { ...accounts[index], profile: updated };
    saveAccounts(accounts);
    localStorage.setItem('wharton.profile', JSON.stringify(updated));
    return updated;
  },

  getProfiles: async (filters: DirectoryFilters = {}): Promise<AlumniProfile[]> =>
    getAccounts()
      .map((account) => account.profile)
      .filter((profile) => profile.approved)
      .filter((profile) => matchesProfileFilters(profile, filters))
      .sort((a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName)),

  getEvents: async (status: EventStatus = 'APPROVED'): Promise<AlumniEvent[]> =>
    getEvents()
      .filter((event) => event.status === status)
      .sort((a, b) => (a.eventDate ?? '').localeCompare(b.eventDate ?? '')),

  submitEvent: async (payload: Partial<AlumniEvent>): Promise<AlumniEvent> => {
    const currentProfile = getCurrentProfile();
    const event: AlumniEvent = {
      id: crypto.randomUUID(),
      title: payload.title ?? '',
      description: payload.description ?? '',
      category: payload.category ?? 'Networking',
      eventDate: payload.eventDate,
      location: payload.location ?? '',
      externalLink: payload.externalLink,
      imageUrl: payload.imageUrl,
      postedById: currentProfile?.id ?? payload.postedById ?? 'local-user',
      postedByName: currentProfile ? `${currentProfile.firstName} ${currentProfile.lastName}` : 'Wharton Alumni',
      postedByCohort: currentProfile?.cohortCampus ?? 'Philadelphia',
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };
    saveEvents([...getEvents(), event]);
    return event;
  },

  moderateEvent: async (id: string, status: EventStatus): Promise<AlumniEvent> => {
    const events = getEvents();
    const index = events.findIndex((event) => event.id === id);
    if (index === -1) {
      throw new Error('Event not found.');
    }
    const updated = { ...events[index], status };
    events[index] = updated;
    saveEvents(events);
    return updated;
  },
};

function getAccounts(): LocalAccount[] {
  const stored = localStorage.getItem(ACCOUNTS_KEY);
  if (stored) return JSON.parse(stored) as LocalAccount[];

  const seeded = (seedAlumniProfiles as SeedAlumniProfile[]).map((profile, index) => {
    const alumniProfile = seedProfileToAlumniProfile(profile, index);
    return {
      email: normalizeEmail(profile.email),
      password: 'password',
      profile: alumniProfile,
    };
  });
  saveAccounts(seeded);
  return seeded;
}

function saveAccounts(accounts: LocalAccount[]) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

function getEvents(): AlumniEvent[] {
  const stored = localStorage.getItem(EVENTS_KEY);
  if (stored) return JSON.parse(stored) as AlumniEvent[];

  const profiles = getAccounts().map((account) => account.profile);
  const seeded = (seedEvents as SeedEvent[]).map((event, index) => {
    const poster = profiles.find((profile) => profile.email === normalizeEmail(event.postedByEmail));
    return {
      id: `seed-event-${index + 1}`,
      title: event.title,
      description: event.description,
      category: event.category,
      eventDate: event.eventDate ?? undefined,
      location: event.location,
      externalLink: event.externalLink,
      imageUrl: event.imageUrl,
      postedById: poster?.id ?? 'seed-admin',
      postedByName: poster ? `${poster.firstName} ${poster.lastName}` : 'Wharton Alumni',
      postedByCohort: poster?.cohortCampus ?? 'Philadelphia',
      status: event.status,
      createdAt: new Date(Date.now() - index * 86400000).toISOString(),
    } satisfies AlumniEvent;
  });
  saveEvents(seeded);
  return seeded;
}

function saveEvents(events: AlumniEvent[]) {
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
}

function getCurrentProfile() {
  const stored = localStorage.getItem('wharton.profile');
  return stored ? JSON.parse(stored) as AlumniProfile : null;
}

function seedProfileToAlumniProfile(profile: SeedAlumniProfile, index: number): AlumniProfile {
  return {
    ...profile,
    id: crypto.randomUUID(),
    email: normalizeEmail(profile.email),
    createdAt: new Date(Date.now() - index * 86400000).toISOString(),
  };
}

function matchesProfileFilters(profile: AlumniProfile, filters: DirectoryFilters) {
  const search = filters.search?.trim().toLowerCase();
  if (search && ![
    profile.firstName,
    profile.lastName,
    profile.currentCompany,
    profile.currentTitle,
    profile.industry,
    profile.bio,
  ].join(' ').toLowerCase().includes(search)) return false;
  if (filters.cohortCampus && profile.cohortCampus !== filters.cohortCampus) return false;
  if (filters.industry && profile.industry !== filters.industry) return false;
  if (filters.location && !`${profile.city} ${profile.stateCountry}`.toLowerCase().includes(filters.location.toLowerCase())) return false;
  if (filters.classYearFrom && profile.classYear < Number(filters.classYearFrom)) return false;
  if (filters.classYearTo && profile.classYear > Number(filters.classYearTo)) return false;
  if (filters.willingToMentor && !profile.willingToMentor) return false;
  if (filters.hiring && !profile.hiring) return false;
  return true;
}

function toSession(profile: AlumniProfile): LoginResponse {
  return {
    token: `local-token-${profile.id}`,
    profile,
  };
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}
