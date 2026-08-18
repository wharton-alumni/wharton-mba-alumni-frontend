export interface JobListing {
  id: string;
  title: string;
  company: string;
  industry: string;
  city: string;
  state: string;
  type: string;
  seniority: string;
  postedBy: string;
  postedById?: string;
  externalLink?: string;
  applicationLink?: string;
  description: string;
  startDate?: string;
  endDate?: string;
}

export const jobListings: JobListing[] = [
  {
    id: 'job-001',
    title: 'VP, Corporate Strategy',
    company: 'Helio Health',
    industry: 'Healthcare',
    city: 'Miami',
    state: 'FL',
    type: 'Full-time',
    seniority: 'Executive',
    postedBy: 'Diego Ramirez',
    description: 'Lead market expansion, strategic partnerships, and executive planning for a scaled healthtech platform.',
  },
  {
    id: 'job-002',
    title: 'Operating Partner, AI Portfolio',
    company: 'Fogline Ventures',
    industry: 'PE/VC',
    city: 'Palo Alto',
    state: 'CA',
    type: 'Full-time',
    seniority: 'Partner',
    postedBy: 'Ben Carter',
    description: 'Work with seed and growth-stage founders on go-to-market design, enterprise sales, and pricing.',
  },
  {
    id: 'job-003',
    title: 'Director, Energy Project Finance',
    company: 'Longhorn Renewables',
    industry: 'Energy',
    city: 'Houston',
    state: 'TX',
    type: 'Full-time',
    seniority: 'Director',
    postedBy: 'Rachel Kim',
    description: 'Structure renewable infrastructure financing across storage, solar, and grid modernization assets.',
  },
  {
    id: 'job-004',
    title: 'Chief of Staff to CEO',
    company: 'Atlas Mobility',
    industry: 'Transportation',
    city: 'Mexico City',
    state: 'Mexico',
    type: 'Full-time',
    seniority: 'Senior Manager',
    postedBy: 'Omar Alvarez',
    description: 'Drive operating cadence, investor materials, and regional launch planning for fleet electrification software.',
  },
  {
    id: 'job-005',
    title: 'M&A Integration Lead',
    company: 'Harborline Consumer Brands',
    industry: 'Consumer',
    city: 'Boston',
    state: 'MA',
    type: 'Contract',
    seniority: 'Director',
    postedBy: 'Nora Sullivan',
    description: 'Lead post-close integration planning for premium consumer acquisitions and portfolio operations.',
  },
  {
    id: 'job-006',
    title: 'Head of Enterprise Product',
    company: 'Northstar AI',
    industry: 'Technology',
    city: 'San Francisco',
    state: 'CA',
    type: 'Full-time',
    seniority: 'VP',
    postedBy: 'Maya Chen',
    description: 'Own enterprise AI roadmap, governance workflows, and strategic customer adoption programs.',
  },
];
