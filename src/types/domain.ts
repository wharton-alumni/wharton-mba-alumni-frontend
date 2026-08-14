export type CohortCampus = 'Philadelphia' | 'San Francisco' | 'Global';
export type Role = 'ALUMNI' | 'ADMIN';
export type EventStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type EventCategory =
  | 'Networking'
  | 'Industry Insights'
  | 'Reunion'
  | 'Career Opportunity'
  | 'Community Event';

export interface AlumniProfile {
  id: string;
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
  bioBookProfileJson?: string;
  role: Role;
  approved: boolean;
  createdAt: string;
}

export interface AlumniEvent {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  eventDate?: string;
  location: string;
  externalLink?: string;
  imageUrl?: string;
  postedById: string;
  postedByName: string;
  postedByCohort: CohortCampus;
  status: EventStatus;
  createdAt: string;
}

export interface LoginResponse {
  token: string;
  profile: AlumniProfile;
}

export interface BioBookProfile {
  id: string;
  batch: string;
  universityEmailAlias?: string;
  fullLegalName: string;
  preferredNameNickname: string;
  pronouns: string;
  headshotProfessional?: string;
  cohort: string;
  cohortCampus: CohortCampus;
  hometownWhereYouGrewUp: string;
  currentCityOfResidence: string;
  city: string;
  stateCountry: string;
  languagesSpoken: string;
  currentEmployer: string;
  currentTitleRole: string;
  industry: string;
  functionalArea: string;
  yearsOfProfessionalExperience: string;
  careerTrajectoryIn3Bullets: string;
  notableAchievementsAwardsPatentsPublications: string;
  companiesYouPreviouslyWorkedAt: string;
  boardSeatsAdvisoryRoles: string;
  linkedinUrl: string;
  undergraduateInstitutionMajor: string;
  graduateInstitutionMajor: string;
  certificates: string;
  postMbaCareerGoal: string;
  majors: string;
  concentration: string;
  hiddenTalentFunFact: string;
  hobbiesInterests: string;
  sportsFitnessYouPlayOrFollow: string;
  canHelpClassmatesWith: string;
  wouldLoveHelpWith: string;
  industriesWantToBreakIntoLearn: string;
  openToMentoring: string;
  willingToMentor: boolean;
  sideProjectsStartupsVentures: string;
  lookingForCoFoundersCollaboratorsIn: string;
  clubsInterestedIn: string;
  willingToHostClassEventInYourCity: string;
  willingToBeGuestSpeakerForClub: string;
  personalEmailForClassDirectory?: string;
  mobileNumber?: string;
  instagramHandle?: string;
  instagramHandle2?: string;
  personalWebsiteSubstackPortfolio?: string;
  militaryVeteran?: string;
  classYear: number;
  hiring: boolean;
}

export interface BioBookLookupResponse {
  exists: boolean;
  alreadyClaimed?: boolean;
  profile?: BioBookProfile;
}

export interface BioBookClaimResponse extends LoginResponse {
  biobookProfile: BioBookProfile;
}

export interface PasswordResetResponse {
  sent: boolean;
  destination: string;
}

export interface OnboardingLookupResponse {
  exists: boolean;
  alreadyClaimed: boolean;
  fullLegalName?: string;
  cohort?: string;
  batch?: string;
  currentEmployer?: string;
  currentTitleRole?: string;
}

export type RegistrationRequest = Omit<
  AlumniProfile,
  'id' | 'avatarUrl' | 'bioBookProfileJson' | 'role' | 'approved' | 'createdAt'
> & {
  password: string;
  avatarUrl?: string;
  bioBookProfileJson?: string;
};

export type IntelligenceCategory =
  | 'Events'
  | 'Network'
  | 'AI & Tech'
  | 'Healthcare'
  | 'VC / Startups'
  | 'Research & Data'
  | 'Career'
  | 'Alumni';

export type AttendanceMode = 'Virtual' | 'In-person' | 'Hybrid' | 'Unknown';

export interface IntelligenceHubItem {
  source: string;
  category: IntelligenceCategory;
  subCategory?: string;
  title: string;
  description?: string;
  eventDate?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  city?: string;
  state?: string;
  attendanceMode: AttendanceMode;
  club?: string;
  speaker?: string;
  industry?: string;
  registrationUrl?: string;
  sourceUrl: string;
  imageUrl?: string;
  lastScrapedAt: string;
}

export type EventRsvpStatus = 'JOINED' | 'INTERESTED' | 'CANCELLED';

export interface EventRsvp {
  eventId: string;
  profileId: string;
  status: EventRsvpStatus;
  joinedCount: number;
  interestedCount: number;
  updatedAt: string;
  participants?: EventParticipant[];
}

export interface EventParticipant {
  profileId: string;
  fullName: string;
  currentTitle: string;
  currentCompany: string;
  cohortCampus: CohortCampus;
  classYear: number;
  avatarUrl?: string;
  joinedAt: string;
}
