import type { BioBookProfile, RegistrationRequest } from '../types/domain';
import { allBatches } from './batches';

export interface BioBookField {
  key: string;
  label: string;
  profileKey?: keyof BioBookProfile;
  inputType?: 'text' | 'email' | 'password' | 'url' | 'number' | 'textarea' | 'select' | 'checkbox';
  options?: string[];
  required?: boolean;
  accountOnly?: boolean;
}

export const veteranStatusOptions = ['Yes', 'No', 'Prefer not to say'];

export const bioBookRegistrationFields: BioBookField[] = [
  { key: 'Full legal name', label: 'Full legal name', profileKey: 'fullLegalName', required: true },
  { key: 'Preferred name / Nickname', label: 'Preferred name / Nickname', profileKey: 'preferredNameNickname', required: true },
  { key: 'Pronouns', label: 'Pronouns', profileKey: 'pronouns' },
  { key: 'Headshot (professional)', label: 'Headshot (professional)', profileKey: 'headshotProfessional', inputType: 'url', required: true },
  { key: 'Cohort', label: 'Cohort', profileKey: 'cohortCampus', inputType: 'select', required: true },
  { key: 'WEMBA class', label: 'WEMBA class', inputType: 'select', options: allBatches, required: true },
  { key: 'Hometown (where you grew up)', label: 'Hometown (where you grew up)', profileKey: 'hometownWhereYouGrewUp' },
  { key: 'Current City of Residence', label: 'Current City of Residence', profileKey: 'currentCityOfResidence', required: true },
  { key: 'Languages spoken', label: 'Languages spoken', profileKey: 'languagesSpoken' },
  { key: 'Current employer', label: 'Current employer', profileKey: 'currentEmployer', required: true },
  { key: 'Current title / role', label: 'Current title / role', profileKey: 'currentTitleRole', required: true },
  { key: 'Industry', label: 'Industry', profileKey: 'industry', inputType: 'select', required: true },
  { key: 'Functional Area', label: 'Functional Area', profileKey: 'functionalArea', required: true },
  { key: 'Years of professional experience', label: 'Years of professional experience', profileKey: 'yearsOfProfessionalExperience' },
  { key: 'Career trajectory in 3 bullets', label: 'Career trajectory in 3 bullets', profileKey: 'careerTrajectoryIn3Bullets', inputType: 'textarea' },
  { key: 'Notable achievements / awards / patents / publications', label: 'Notable achievements / awards / patents / publications', profileKey: 'notableAchievementsAwardsPatentsPublications', inputType: 'textarea' },
  { key: "Companies you've previously worked at", label: "Companies you've previously worked at", profileKey: 'companiesYouPreviouslyWorkedAt', inputType: 'textarea' },
  { key: 'Board seats / advisory roles', label: 'Board seats / advisory roles', profileKey: 'boardSeatsAdvisoryRoles', inputType: 'textarea' },
  { key: 'Work email', label: 'Work email', inputType: 'email', required: true, accountOnly: true },
  { key: 'LinkedIn URL', label: 'LinkedIn URL', profileKey: 'linkedinUrl', inputType: 'url', required: true },
  { key: 'Undergraduate institution & Major', label: 'Undergraduate institution & Major', profileKey: 'undergraduateInstitutionMajor' },
  { key: 'Graduate institution & Major', label: 'Graduate institution & Major', profileKey: 'graduateInstitutionMajor' },
  { key: 'Certificates', label: 'Certificates', profileKey: 'certificates' },
  { key: 'Post-MBA career goal', label: 'Post-MBA career goal', profileKey: 'postMbaCareerGoal', inputType: 'textarea' },
  { key: 'Majors', label: 'Majors', profileKey: 'majors' },
  { key: 'Concentrartion', label: 'Concentrartion', profileKey: 'concentration' },
  { key: 'Hidden talent / fun fact', label: 'Hidden talent / fun fact', profileKey: 'hiddenTalentFunFact', inputType: 'textarea' },
  { key: 'Hobbies & interests', label: 'Hobbies & interests', profileKey: 'hobbiesInterests', inputType: 'textarea' },
  { key: 'Sports / fitness you play or follow', label: 'Sports / fitness you play or follow', profileKey: 'sportsFitnessYouPlayOrFollow', inputType: 'textarea' },
  { key: "I can help classmates with...", label: "I can help classmates with...", profileKey: 'canHelpClassmatesWith', inputType: 'textarea' },
  { key: "I'd love help with...", label: "I'd love help with...", profileKey: 'wouldLoveHelpWith', inputType: 'textarea' },
  { key: 'Industries I want to break into / learn', label: 'Industries I want to break into / learn', profileKey: 'industriesWantToBreakIntoLearn', inputType: 'textarea' },
  { key: 'Open to mentoring', label: 'Open to mentoring', profileKey: 'willingToMentor', inputType: 'checkbox' },
  { key: 'Side projects, startups, or ventures', label: 'Side projects, startups, or ventures', profileKey: 'sideProjectsStartupsVentures', inputType: 'textarea' },
  { key: 'Looking for co-founders / collaborators in...', label: 'Looking for co-founders / collaborators in...', profileKey: 'lookingForCoFoundersCollaboratorsIn', inputType: 'textarea' },
  { key: "Clubs you're interested in..", label: "Clubs you're interested in..", profileKey: 'clubsInterestedIn', inputType: 'textarea' },
  { key: 'Willing to host a class event in your city', label: 'Willing to host a class event in your city', profileKey: 'willingToHostClassEventInYourCity' },
  { key: 'Willing to be a guest speaker for a club', label: 'Willing to be a guest speaker for a club', profileKey: 'willingToBeGuestSpeakerForClub' },
  { key: 'Personal email (for class directory)', label: 'Personal email (for class directory)', profileKey: 'personalEmailForClassDirectory', inputType: 'email', required: true },
  { key: 'Mobile Number', label: 'Mobile Number', profileKey: 'mobileNumber' },
  { key: 'Instagram Handle', label: 'Instagram Handle', profileKey: 'instagramHandle' },
  { key: 'Instagram Handle 2', label: 'Instagram Handle 2', profileKey: 'instagramHandle2' },
  { key: 'Personal website / Substack / portfolio', label: 'Personal website / Substack / portfolio', profileKey: 'personalWebsiteSubstackPortfolio', inputType: 'url' },
  { key: 'Are you a military veteran?', label: 'Are you a military veteran?', profileKey: 'militaryVeteran', inputType: 'select', options: veteranStatusOptions, required: true },
  { key: 'Password', label: 'Password', inputType: 'password', required: true, accountOnly: true },
];

export const publicBioBookFields = bioBookRegistrationFields.filter((field) => field.profileKey && !field.accountOnly);

export function bioBookProfileToRegistration(
  values: Record<string, string | boolean>,
): RegistrationRequest {
  const fullName = String(values['Full legal name'] ?? '').trim();
  const [firstName = '', ...lastNameParts] = fullName.split(/\s+/);
  const currentCity = String(values['Current City of Residence'] ?? '').trim();
  const [city, ...stateParts] = currentCity.split(',').map((part) => part.trim());
  const cohortValue = String(values.Cohort ?? 'Philadelphia');
  const bio = String(values['Career trajectory in 3 bullets'] || values['I can help classmates with...'] || 'New Wharton Executive MBA alumni profile.');
  const classYear = wembaBatchToClassYear(String(values['WEMBA class'] ?? "WEMBA'52"));

  return {
    email: String(values['Work email'] ?? '').trim(),
    password: String(values.Password ?? ''),
    firstName,
    lastName: lastNameParts.join(' ') || firstName,
    phoneNumber: 'Not provided',
    cohortCampus: cohortValue === 'SF' ? 'San Francisco' : cohortValue === 'Global' ? 'Global' : 'Philadelphia',
    classYear,
    currentTitle: String(values['Current title / role'] ?? ''),
    currentCompany: String(values['Current employer'] ?? ''),
    industry: String(values.Industry ?? 'Technology'),
    city: city || currentCity,
    stateCountry: stateParts.join(', ') || '',
    linkedinUrl: String(values['LinkedIn URL'] ?? ''),
    bio,
    willingToMentor: Boolean(values['Open to mentoring']),
    hiring: false,
    avatarUrl: String(values['Headshot (professional)'] ?? ''),
    bioBookProfileJson: JSON.stringify(values),
  };
}

export function wembaBatchToClassYear(batch: string) {
  const batchNumber = Number(batch.match(/\d+/)?.[0]);
  return Number.isFinite(batchNumber) && batchNumber > 0 ? 1976 + batchNumber : 2028;
}

export function classYearToWembaBatch(classYear: number) {
  const batchNumber = classYear - 1976;
  return batchNumber > 0 ? `WEMBA'${batchNumber}` : "WEMBA'52";
}
