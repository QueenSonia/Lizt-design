import { PropertyDetailWithHistory } from "@/types/property";

/**
 * Available actions for a property based on its current state and history
 */
export interface PropertyActions {
  canEdit: boolean;
  canDelete: boolean;
  canDeactivate: boolean;
  canReactivate: boolean;
  canEndTenancy: boolean;
  canAssignTenant: boolean;
}

/**
 * Determines available actions based on property state and history
 *
 * Action Visibility Matrix:
 * | Property State       | Edit | Delete | Deactivate | Reactivate | End Tenancy | Assign Tenant |
 * |---------------------|------|--------|------------|------------|-------------|---------------|
 * | OCCUPIED            | ✓    | ✗      | ✗          | ✗          | ✓           | ✗             |
 * | VACANT (no history) | ✓    | ✓      | ✓          | ✗          | ✗           | ✓             |
 * | VACANT (has history)| ✓    | ✗      | ✓          | ✗          | ✗           | ✓             |
 * | INACTIVE            | ✓    | ✗      | ✗          | ✓          | ✗           | ✗             |
 *
 * Requirements covered: 2.1, 2.2, 2.3, 2.4, 2.5
 */
export const getAvailableActions = (
  property: PropertyDetailWithHistory
): PropertyActions => {
  if (!property) {
    return {
      canEdit: false,
      canDelete: false,
      canDeactivate: false,
      canReactivate: false,
      canEndTenancy: false,
      canAssignTenant: false,
    };
  }

  const hasHistory = property.history && property.history.length > 0;
  const status = property.status?.toUpperCase();

  // Requirement 2.1: WHILE a property is in occupied state, THE Landlord System SHALL display "Edit Property" and "End Tenancy" actions
  if (status === "OCCUPIED") {
    return {
      canEdit: true,
      canDelete: false,
      canDeactivate: false,
      canReactivate: false,
      canEndTenancy: true,
      canAssignTenant: false, // Cannot assign tenant to occupied property
    };
  }

  // Requirement 2.2: WHILE a property is in vacant state with no tenancy history, THE Landlord System SHALL display "Edit Property", "Delete Property", and "Deactivate Property" actions
  if (status === "VACANT" && !hasHistory) {
    return {
      canEdit: true,
      canDelete: true,
      canDeactivate: true,
      canReactivate: false,
      canEndTenancy: false,
      canAssignTenant: true, // Can assign tenant to vacant property
    };
  }

  // Requirement 2.3: WHILE a property is in vacant state with existing tenancy history, THE Landlord System SHALL display "Edit Property" and "Deactivate Property" actions
  if (status === "VACANT" && hasHistory) {
    return {
      canEdit: true,
      canDelete: false,
      canDeactivate: true,
      canReactivate: false,
      canEndTenancy: false,
      canAssignTenant: true, // Can assign tenant to vacant property
    };
  }

  // Requirement 2.4: WHILE a property is in deactivated state, THE Landlord System SHALL display only "Reactivate Property" action
  if (status === "INACTIVE") {
    return {
      canEdit: true, // Edit is always available according to requirement 4.2
      canDelete: false,
      canDeactivate: false,
      canReactivate: true,
      canEndTenancy: false,
      canAssignTenant: false, // Cannot assign tenant to inactive property
    };
  }

  // Default case - no actions available for unknown states
  return {
    canEdit: true,
    canDelete: false,
    canDeactivate: false,
    canReactivate: false,
    canEndTenancy: false,
    canAssignTenant: false,
  };
};

/**
 * Checks if a property has tenancy history
 * Used for delete validation (Requirement 2.5)
 */
export const hasPropertyHistory = (
  property: PropertyDetailWithHistory
): boolean => {
  return property?.history && property.history.length > 0;
};

/**
 * Determines if a property is in a specific state
 */
export const isPropertyInState = (
  property: PropertyDetailWithHistory,
  state: "OCCUPIED" | "VACANT" | "INACTIVE"
): boolean => {
  return property?.status?.toUpperCase() === state;
};

/**
 * Gets a human-readable description of why certain actions are not available
 */
export const getActionRestrictionReason = (
  property: PropertyDetailWithHistory,
  action: keyof PropertyActions
): string | null => {
  const actions = getAvailableActions(property);

  if (actions[action]) {
    return null; // Action is available
  }

  const status = property?.status?.toUpperCase();
  const hasHistory = hasPropertyHistory(property);

  switch (action) {
    case "canDelete":
      if (status === "OCCUPIED") {
        return "Cannot delete occupied properties";
      }
      if (status === "INACTIVE") {
        return "Cannot delete inactive properties";
      }
      if (hasHistory) {
        return "Cannot delete properties with tenancy history";
      }
      break;

    case "canDeactivate":
      if (status === "OCCUPIED") {
        return "Cannot deactivate occupied properties";
      }
      if (status === "INACTIVE") {
        return "Property is already inactive";
      }
      break;

    case "canReactivate":
      if (status !== "INACTIVE") {
        return "Only inactive properties can be reactivated";
      }
      break;

    case "canEndTenancy":
      if (status !== "OCCUPIED") {
        return "Only occupied properties have tenancies to end";
      }
      break;

    case "canAssignTenant":
      if (status === "OCCUPIED") {
        return "Cannot assign tenant to occupied property";
      }
      if (status === "INACTIVE") {
        return "Cannot assign tenant to inactive property. Please reactivate the property first.";
      }
      break;

    default:
      return "Action not available for current property state";
  }

  return "Action not available for current property state";
};
