import { ComponentType, lazy } from "react";
import { withLandlordMobileProps } from "./LandlordScreenWrapper";

type ScreenComponent =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | ComponentType<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | React.LazyExoticComponent<React.ComponentType<any>>;

interface ScreenMap {
  [role: string]: {
    [screen: string]: ScreenComponent;
  };
}

export const screenMap: ScreenMap = {
  landlord: {
    dashboard: lazy(() =>
      import("@/components/LandlordLiveFeed").then((module) => ({
        default: withLandlordMobileProps(module.default),
      })),
    ),
    "landlord-dashboard": lazy(() =>
      import("@/components/LandlordLiveFeed").then((module) => ({
        default: withLandlordMobileProps(module.default),
      })),
    ),
    properties: lazy(() =>
      import("@/components/LandlordProperties").then((module) => ({
        default: withLandlordMobileProps(module.default),
      })),
    ),
    "property-detail": lazy(() =>
      import("@/components/LandlordPropertyDetail").then((module) => ({
        default: withLandlordMobileProps(module.default),
      })),
    ),
    "add-property": lazy(() =>
      import("@/components/LandlordAddPropertyPage").then((module) => ({
        default: withLandlordMobileProps(module.default),
      })),
    ),
    "edit-property": lazy(() =>
      import("@/components/LandlordEditProperty").then((module) => ({
        default: withLandlordMobileProps(module.LandlordEditProperty),
      })),
    ),
    tenants: lazy(() =>
      import("@/components/LandlordTenants").then((module) => ({
        default: withLandlordMobileProps(module.default),
      })),
    ),
    "add-tenant": lazy(() =>
      import("@/components/LandlordAddTenantPage").then((module) => ({
        default: withLandlordMobileProps(module.default),
      })),
    ),
    calendar: lazy(() =>
      import("@/components/LandlordCalendar").then((module) => ({
        default: withLandlordMobileProps(module.default),
      })),
    ),
    "rent-collection": lazy(() =>
      import("@/components/LandlordRentCollection").then((module) => ({
        default: withLandlordMobileProps(module.default),
      })),
    ),
    "rent-detail": lazy(() =>
      import("@/components/LandlordRentDetail").then((module) => ({
        default: withLandlordMobileProps(module.default),
      })),
    ),
    "rent-payments": lazy(() =>
      import("@/components/LandlordRentPayments").then((module) => ({
        default: withLandlordMobileProps(module.default),
      })),
    ),

    maintenance: lazy(() =>
      import("@/components/LandlordMaintenance").then((module) => ({
        default: withLandlordMobileProps(module.default),
      })),
    ),
    service: lazy(() =>
      import("@/components/LandlordServiceRequests").then((module) => ({
        default: withLandlordMobileProps(module.default),
      })),
    ),
    team: lazy(() =>
      import("@/components/LandlordFacilityManagers").then((module) => ({
        default: withLandlordMobileProps(module.default),
      })),
    ),
    "add-facility-manager": lazy(() =>
      import("@/components/LandlordAddFacilityManagerPage").then((module) => ({
        default: withLandlordMobileProps(module.default),
      })),
    ),
    "service-approval": lazy(() =>
      import("@/components/LandlordServiceRequests").then((module) => ({
        default: withLandlordMobileProps(module.default),
      })),
    ),
    "service-requests": lazy(() =>
      import("@/components/LandlordServiceRequests").then((module) => ({
        default: withLandlordMobileProps(module.default),
      })),
    ),
    "package-selector": lazy(() =>
      import("@/components/LandlordPackageSelector").then((module) => ({
        default: withLandlordMobileProps(module.default),
      })),
    ),
    kyc: lazy(() =>
      import("@/components/LandlordKYCList").then((module) => ({
        default: withLandlordMobileProps(module.default),
      })),
    ),
    "kyc-applicants": lazy(() =>
      import("@/components/LandlordKYCApplicants").then((module) => ({
        default: withLandlordMobileProps(module.default),
      })),
    ),
    "facility-managers": lazy(() =>
      import("@/components/LandlordFacilityManagers").then((module) => ({
        default: withLandlordMobileProps(module.default),
      })),
    ),
    "facility-manager-detail": lazy(() =>
      import("@/components/LandlordFacilityManagerDetail").then((module) => ({
        default: withLandlordMobileProps(module.default),
      })),
    ),
    facility: lazy(() =>
      import("@/components/LandlordFacility").then((module) => ({
        default: withLandlordMobileProps(module.default),
      })),
    ),
    "common-area-detail": lazy(() =>
      import("@/components/LandlordCommonAreaDetail").then((module) => ({
        default: withLandlordMobileProps(module.default),
      })),
    ),
    "payment-plans": lazy(() =>
      import("@/components/PaymentPlansPage").then((module) => ({
        default: withLandlordMobileProps(module.default),
      })),
    ),
    "invoices": lazy(() =>
      import("@/components/InvoicesPage").then((module) => ({
        default: withLandlordMobileProps(module.default),
      })),
    ),
    settings: lazy(() =>
      import("@/components/AdminSettings").then((module) => ({
        default: withLandlordMobileProps(module.default),
      })),
    ),
  },
};
