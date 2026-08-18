import type { CohortCampus, EventCategory } from '../types/domain';

export const cohorts: CohortCampus[] = ['Philadelphia', 'San Francisco', 'Global'];

export const industries = [
  'Finance',
  'Private Equity',
  'PE/VC',
  'Technology',
  'Healthcare',
  'Consulting',
  'Real Estate',
  'Media',
  'Consumer',
  'Energy',
  'Education',
  'Transportation',
];

export const eventCategories: EventCategory[] = [
  'Networking',
  'Industry Insights',
  'Reunion',
  'Career Opportunity',
  'Community Event',
  'Dinner',
];

export const classYears = Array.from({ length: 2028 - 1975 + 1 }, (_, index) => 2028 - index);
