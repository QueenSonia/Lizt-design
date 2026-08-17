export interface PropertyManagerOnboardingSubmission {
  id: string;
  propertyManagerName: string;
  propertyManagerPhone: string;
  numberOfProperties: number;
  submittedAt: string;
}

export const MOCK_PROPERTY_MANAGER_ONBOARDING_SUBMISSIONS: PropertyManagerOnboardingSubmission[] = [
  {
    id: "pm-ob-001",
    propertyManagerName: "Tunde Oginni",
    propertyManagerPhone: "+234 803 222 1144",
    numberOfProperties: 4,
    submittedAt: "2026-07-18T10:30:00.000Z",
  },
  {
    id: "pm-ob-002",
    propertyManagerName: "Amaka Properties",
    propertyManagerPhone: "+234 806 441 2288",
    numberOfProperties: 7,
    submittedAt: "2026-07-19T15:05:00.000Z",
  },
  {
    id: "pm-ob-003",
    propertyManagerName: "David Okoro",
    propertyManagerPhone: "+234 812 775 3301",
    numberOfProperties: 2,
    submittedAt: "2026-07-20T09:15:00.000Z",
  },
];
