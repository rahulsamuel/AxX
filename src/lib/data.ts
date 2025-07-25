

import { DateRange } from "react-day-picker";

export interface Event {
  id: string;
  name: string;
  acronym: string;
  showWebsite: string;
  eventType: string;
  dates: { from: Date; to: Date };
  location: string;
  enteredBy: string;
}

export type ProjectStatus = "Planning" | "In Progress" | "Completed" | "On Hold" | "Setup";
export type Priority = "High" | "Medium" | "Low" | "Critical";

export interface TrainingSession {
  id: string;
  courseName: string;
  description: string;
  dates: { from: Date; to: Date };
  attendees: string[]; // array of TeamMember IDs
  status: 'Scheduled' | 'Completed' | 'Cancelled';
}

export interface PtoRequest {
  id: string;
  teamMemberId: string;
  type: 'Vacation' | 'Sick Leave' | 'Personal Day';
  dates: { from: Date; to: Date };
  status: 'Approved' | 'Pending' | 'Denied';
}

export const initialEventTypes: string[] = [
    "Public Trade Show", 
    "Industry Trade Show", 
    "Corporate Conference", 
    "Music Festival", 
    "Film Premiere",
    "Sports Event",
    "Event Industry"
];

export interface Staff {
  id: string;
  name: string;
  role: "Project Manager" | "AV Technician" | "Lighting Designer" | "Audio Engineer";
  email: string;
  phone: string;
  availability: boolean;
  avatarUrl: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  department: string;
  avatarUrl: string;
  email: string;
  phone: string;
  status?: 'Active' | 'Archived';
  dashboardWidgets?: Record<string, boolean>;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface ClientLocation {
  id: string;
  name: string; // e.g. "Headquarters", "East Coast Office"
  address: Address;
  contactPerson: string;
  email: string;
  phone: string;
  isPrimary: boolean;
}

export interface Client {
  id: string;
  name: string;
  type: string;
  projectHistory: string[];
  totalContribution: number;
  locations: ClientLocation[];
}

export interface Project {
  id: string;
  eventId: string;
  projectNumber: string;
  name: string;
  clientId: string;
  clientLocationId?: string;
  location: string;
  dates: {
    prepTravelIn?: Date;
    prepTravelOut?: Date;
    showTravelIn?: Date;
    showTravelOut?: Date;
    loadIn: { from: Date; to: Date };
    show: { from: Date; to: Date };
    loadOut: { from: Date; to: Date };
  };
  status: ProjectStatus;
  budget: number;
  spentBudget: number;
  progress: number;
  priority: Priority;
  assignedStaff: string[];
  // New fields
  probability: number;
  salesAgentId: string;
  warehouse: string;
  services: string[];
  description: string;
  finalBillingAmount?: number;
  finalMargin?: number;
}


const today = new Date();
const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const trainingSessions: TrainingSession[] = [
    {
        id: 'train-1',
        courseName: 'Advanced Lighting Techniques',
        description: 'A deep dive into advanced console programming and fixture management.',
        dates: { from: new Date('2024-08-12'), to: new Date('2024-08-14') },
        attendees: ['team-2'],
        status: 'Scheduled',
    },
    {
        id: 'train-2',
        courseName: 'Project Management for Events',
        description: 'Learn the fundamentals of agile project management in the event industry.',
        dates: { from: new Date('2024-09-05'), to: new Date('2024-09-06') },
        attendees: ['team-1'],
        status: 'Scheduled',
    },
];

export const ptoRequests: PtoRequest[] = [
    {
        id: 'pto-1',
        teamMemberId: 'team-3',
        type: 'Vacation',
        dates: { from: new Date('2024-08-19'), to: new Date('2024-08-23') },
        status: 'Approved',
    },
    {
        id: 'pto-2',
        teamMemberId: 'team-4',
        type: 'Personal Day',
        dates: { from: new Date('2024-07-26'), to: new Date('2024-07-26') },
        status: 'Approved',
    },
];

export const staff: Staff[] = [
  { id: 'staff-1', name: 'Alice Johnson', role: 'Project Manager', email: 'alice@eventflow.com', phone: '123-456-7890', availability: true, avatarUrl: 'https://placehold.co/32x32.png' },
  { id: 'staff-2', name: 'Bob Williams', role: 'AV Technician', email: 'bob@eventflow.com', phone: '123-456-7891', availability: true, avatarUrl: 'https://placehold.co/32x32.png' },
  { id: 'staff-3', name: 'Charlie Brown', role: 'Lighting Designer', email: 'charlie@eventflow.com', phone: '123-456-7892', availability: false, avatarUrl: 'https://placehold.co/32x32.png' },
  { id: 'staff-4', name: 'Diana Prince', role: 'Audio Engineer', email: 'diana@eventflow.com', phone: '123-456-7893', availability: true, avatarUrl: 'https://placehold.co/32x32.png' },
  { id: 'staff-5', name: 'Ethan Hunt', role: 'Project Manager', email: 'ethan@eventflow.com', phone: '123-456-7894', availability: true, avatarUrl: 'https://placehold.co/32x32.png' },
];

export const initialTeamMembers: Omit<TeamMember, 'id'>[] = [
    {
      name: 'Michael Scott',
      role: 'Lead Project Manager',
      department: 'Management',
      avatarUrl: 'https://placehold.co/64x64.png',
      email: 'm.scott@eventflow.com',
      phone: '+1 (555) 111-2222',
      status: 'Active',
    },
    {
      name: 'Pam Beesly',
      role: 'Lighting Designer',
      department: 'Lighting',
      avatarUrl: 'https://placehold.co/64x64.png',
      email: 'p.beesly@eventflow.com',
      phone: '+1 (555) 333-4444',
      status: 'Active',
    },
    {
        name: 'Jim Halpert',
        role: 'Lead AV Technician',
        department: 'Audio/Visual',
        avatarUrl: 'https://placehold.co/64x64.png',
        email: 'j.halpert@eventflow.com',
        phone: '+1 (555) 555-6666',
        status: 'Active',
    },
    {
        name: 'Dwight Schrute',
        role: 'Warehouse Manager',
        department: 'Operations',
        avatarUrl: 'https://placehold.co/64x64.png',
        email: 'd.schrute@eventflow.com',
        phone: '+1 (555) 777-8888',
        status: 'Active',
    }
  ];

export const initialClientTypes: string[] = ["Automotive", "Tech", "Corporate", "Entertainment", "Event Industry", "Sports Event"];

export const initialEvents: Event[] = [
  { 
    id: 'event-1', 
    name: 'LA Auto Show 2024', 
    acronym: 'LAAS 2024',
    showWebsite: 'https://laautoshow.com/',
    eventType: 'Public Trade Show',
    location: 'Los Angeles Convention Center', 
    dates: { from: new Date('2024-11-22'), to: new Date('2024-12-01') },
    enteredBy: 'Michael Scott',
  },
  { 
    id: 'event-2', 
    name: 'CES 2025', 
    acronym: 'CES 2025',
    showWebsite: 'https://www.ces.tech/',
    eventType: 'Industry Trade Show',
    location: 'Las Vegas Convention Center', 
    dates: { from: new Date('2025-01-07'), to: new Date('2025-01-10') },
    enteredBy: 'Pam Beesly',
  },
  { 
    id: 'event-3', 
    name: 'Cisco Live 2025', 
    acronym: 'CL-US 2025',
    showWebsite: 'https://www.ciscolive.com/global.html',
    eventType: 'Corporate Conference',
    location: 'San Diego Convention Center', 
    dates: { from: new Date('2025-06-02'), to: new Date('2025-06-06') },
    enteredBy: 'Jim Halpert',
  },
];

export const initialClients: Client[] = [
    {
        id: 'client-1',
        name: 'BMW North America',
        type: 'Automotive',
        projectHistory: ['proj-1', 'proj-3'],
        totalContribution: 450000,
        locations: [
            {
                id: 'loc-1a',
                name: 'Headquarters',
                address: { street: '123 Autobahn Ave', city: 'Woodcliff Lake', state: 'NJ', zip: '07677', country: 'USA' },
                contactPerson: 'Jan Levinson',
                email: 'jan@bmw-events.com',
                phone: '555-0101',
                isPrimary: true,
            },
            {
                id: 'loc-1b',
                name: 'West Coast Office',
                address: { street: '456 Entertainment Way', city: 'Los Angeles', state: 'CA', zip: '90028', country: 'USA' },
                contactPerson: 'Michael Scott',
                email: 'michael@bmw-events.com',
                phone: '555-0107',
                isPrimary: false,
            }
        ]
    },
    {
        id: 'client-2',
        name: 'Samsung Electronics',
        type: 'Tech',
        projectHistory: ['proj-2'],
        totalContribution: 250000,
        locations: [
             {
                id: 'loc-2a',
                name: 'Corporate Office',
                address: { street: '456 Tech Park', city: 'Las Vegas', state: 'NV', zip: '89109', country: 'USA' },
                contactPerson: 'David Wallace',
                email: 'david@samsung-expo.com',
                phone: '555-0102',
                isPrimary: true,
            }
        ]
    },
    {
        id: 'client-3',
        name: 'Cisco Systems',
        type: 'Tech',
        projectHistory: ['proj-4', 'proj-5'],
        totalContribution: 175000,
        locations: [
             {
                id: 'loc-3a',
                name: 'Main Campus',
                address: { street: '101 Networking Dr', city: 'San Jose', state: 'CA', zip: '95134', country: 'USA' },
                contactPerson: 'Robert California',
                email: 'rc@cisco.com',
                phone: '555-0103',
                isPrimary: true,
            },
            {
                id: 'loc-3b',
                name: 'RTP Office',
                address: { street: '202 Research Pkwy', city: 'Raleigh', state: 'NC', zip: '27709', country: 'USA' },
                contactPerson: 'Erin Hannon',
                email: 'erin@cisco.com',
                phone: '555-0108',
                isPrimary: false,
            }
        ]
    },
    {
        id: 'client-4',
        name: 'Ford Motor Company',
        type: 'Automotive',
        projectHistory: [],
        totalContribution: 300000,
        locations: [
             {
                id: 'loc-4a',
                name: 'Dearborn HQ',
                address: { street: '222 American Rd', city: 'Dearborn', state: 'MI', zip: '48126', country: 'USA' },
                contactPerson: 'Andy Bernard',
                email: 'andy@ford-events.com',
                phone: '555-0104',
                isPrimary: true,
            }
        ]
    },
    {
        id: 'client-5',
        name: 'Intel Corporation',
        type: 'Tech',
        projectHistory: [],
        totalContribution: 95000,
        locations: [
             {
                id: 'loc-5a',
                name: 'Santa Clara Campus',
                address: { street: '333 Chip St', city: 'Santa Clara', state: 'CA', zip: '95054', country: 'USA' },
                contactPerson: 'Holly Flax',
                email: 'holly@intel-events.com',
                phone: '555-0105',
                isPrimary: true,
            }
        ]
    },
    {
        id: 'client-6',
        name: 'Mercedes-Benz USA',
        type: 'Automotive',
        projectHistory: [],
        totalContribution: 120000,
        locations: [
             {
                id: 'loc-6a',
                name: 'Atlanta HQ',
                address: { street: '777 Silver Star Blvd', city: 'Atlanta', state: 'GA', zip: '30328', country: 'USA' },
                contactPerson: 'Gabe Lewis',
                email: 'gabe@mb-events.com',
                phone: '555-0109',
                isPrimary: true,
            }
        ]
    },
    {
        id: 'client-7',
        name: 'Vance Refrigeration',
        type: 'Corporate',
        projectHistory: [],
        totalContribution: 85000,
        locations: [
             {
                id: 'loc-7a',
                name: 'Scranton Business Park Office',
                address: { street: '1725 Slough Avenue', city: 'Scranton', state: 'PA', zip: '18505', country: 'USA' },
                contactPerson: 'Bob Vance',
                email: 'bob.vance@vancerefrigeration.com',
                phone: '555-0110',
                isPrimary: true,
            }
        ]
    },
    {
        id: 'client-8',
        name: 'The Good Place Architects',
        type: 'Entertainment',
        projectHistory: [],
        totalContribution: 215000,
        locations: []
    }
];

export const initialProjects: Project[] = [
  {
    id: 'proj-1',
    eventId: 'event-1',
    projectNumber: 'RW24001',
    name: 'BMW Booth Audio/Video',
    clientId: 'client-1',
    clientLocationId: 'loc-1a',
    location: 'LA Convention Center - West Hall',
    dates: {
      prepTravelIn: new Date('2024-11-18'),
      prepTravelOut: new Date('2024-11-19'),
      showTravelIn: new Date('2024-11-20'),
      showTravelOut: new Date('2024-12-02'),
      loadIn: { from: new Date('2024-11-20'), to: new Date('2024-11-21') },
      show: { from: new Date('2024-11-22'), to: new Date('2024-12-01') },
      loadOut: { from: new Date('2024-12-02'), to: new Date('2024-12-02') },
    },
    status: 'In Progress',
    budget: 350000,
    spentBudget: 295000,
    progress: 75,
    priority: 'Critical',
    assignedStaff: ['team-1', 'team-3'],
    probability: 100,
    salesAgentId: 'team-1',
    warehouse: 'Los Angeles',
    services: ['Audio', 'Video', 'Labor'],
    description: 'Full AV setup for the main BMW booth at the LA Auto Show, including main stage audio and multiple video walls.',
    finalBillingAmount: undefined,
    finalMargin: undefined,
  },
  {
    id: 'proj-2',
    eventId: 'event-2',
    projectNumber: 'RW24002',
    name: 'Samsung Display Wall',
    clientId: 'client-2',
    clientLocationId: 'loc-2a',
    location: 'LVCC - Central Hall',
    dates: {
      loadIn: { from: new Date('2025-01-04'), to: new Date('2025-01-06') },
      show: { from: new Date('2025-01-07'), to: new Date('2025-01-10') },
      loadOut: { from: new Date('2025-01-11'), to: new Date('2025-01-11') },
    },
    status: 'Planning',
    budget: 250000,
    spentBudget: 75000,
    progress: 25,
    priority: 'High',
    assignedStaff: ['team-1', 'team-2'],
    probability: 90,
    salesAgentId: 'team-2',
    warehouse: 'Las Vegas',
    services: ['Video', 'Staging', 'Lighting'],
    description: "Large-scale LED display wall for Samsung's keynote at CES. Includes custom staging and lighting package.",
    finalBillingAmount: undefined,
    finalMargin: undefined,
  },
    {
    id: 'proj-3',
    eventId: 'event-1',
    projectNumber: 'RW24003',
    name: 'Ford Lighting Experience',
    clientId: 'client-4',
    clientLocationId: 'loc-4a',
    location: 'LA Convention Center - South Hall',
    dates: {
      loadIn: { from: new Date('2024-11-20'), to: new Date('2024-11-21') },
      show: { from: new Date('2024-11-22'), to: new Date('2024-12-01') },
      loadOut: { from: new Date('2024-12-02'), to: new Date('2024-12-02') },
    },
    status: 'Completed',
    budget: 100000,
    spentBudget: 92000,
    progress: 100,
    priority: 'Medium',
    assignedStaff: ['team-1'],
    probability: 100,
    salesAgentId: 'team-1',
    warehouse: 'Los Angeles',
    services: ['Lighting'],
    description: 'Dynamic lighting experience for the Ford vehicle showcase area. Project was delivered on time and client was satisfied.',
    finalBillingAmount: 110000,
    finalMargin: 16.36,
  },
   {
    id: 'proj-4',
    eventId: 'event-3',
    projectNumber: 'RW24004',
    name: 'Cisco Keynote Staging',
    clientId: 'client-3',
    clientLocationId: 'loc-3a',
    location: 'SDCC - Hall H',
    dates: {
      loadIn: { from: new Date('2025-05-30'), to: new Date('2025-06-01') },
      show: { from: new Date('2025-06-02'), to: new Date('2025-06-02') },
      loadOut: { from: new Date('2025-06-03'), to: new Date('2025-06-03') },
    },
    status: 'Completed',
    budget: 80000,
    spentBudget: 78500,
    progress: 100,
    priority: 'Medium',
    assignedStaff: ['team-2'],
    probability: 100,
    salesAgentId: 'team-3',
    warehouse: 'Los Angeles',
    services: ['Staging', 'Audio', 'Lighting'],
    description: 'Complete stage setup and AV for the main keynote at Cisco Live. Project completed successfully and under budget.',
    finalBillingAmount: 95000,
    finalMargin: 17.37,
  },
  {
    id: 'proj-5',
    eventId: 'event-2',
    projectNumber: 'RW24005',
    name: 'Intel Partner Booth',
    clientId: 'client-5',
    clientLocationId: 'loc-5a',
    location: 'Venetian Expo',
    dates: {
      prepTravelIn: new Date('2025-01-04'),
      loadIn: { from: new Date('2025-01-05'), to: new Date('2025-01-06') },
      show: { from: new Date('2025-01-07'), to: new Date('2025-01-10') },
      loadOut: { from: new Date('2025-01-11'), to: new Date('2025-01-11') },
    },
    status: 'In Progress',
    budget: 120000,
    spentBudget: 95000,
    progress: 60,
    priority: 'High',
    assignedStaff: ['team-1', 'team-2', 'team-3'],
    probability: 100,
    salesAgentId: 'team-3',
    warehouse: 'Las Vegas',
    services: ['Labor', 'Video'],
    description: "AV support and labor for Intel's partner booth at the Venetian Expo, including multiple breakout rooms.",
    finalBillingAmount: undefined,
    finalMargin: undefined,
  },
  {
    id: 'proj-6',
    eventId: 'event-1',
    projectNumber: 'RW24006',
    name: 'Mercedes-Benz Activation',
    location: "LA Convention Center - Concourse",
    clientId: 'client-6',
    clientLocationId: 'loc-6a',
    dates: {
      loadIn: { from: new Date('2024-11-21'), to: new Date('2024-11-21') },
      show: { from: new Date('2024-11-22'), to: new Date('2024-12-01') },
      loadOut: { from: new Date('2024-12-02'), to: new Date('2024-12-02') },
    },
    status: 'On Hold',
    budget: 300000,
    spentBudget: 50000,
    progress: 10,
    priority: 'Low',
    assignedStaff: ['team-1', 'team-3'],
    probability: 25,
    salesAgentId: 'team-1',
    warehouse: 'Los Angeles',
    services: ['Staging', 'Lighting'],
    description: 'Interactive brand activation in the main concourse. Project currently on hold pending budget approval from client.',
    finalBillingAmount: undefined,
    finalMargin: undefined,
  }
];
