import { WORK_ASSIGNMENT_ROLES } from "~/utils/ui";
import type { WorkAssignments } from "~/utils/types";

const SEPARATOR = "，";

/**
 * Add a user to assignment roles
 */
export function addUserToAssignments(
  assignments: Partial<WorkAssignments>,
  userName: string,
  roles: Array<{ roleKey: string; position?: "upper" | "lower" }>,
): Partial<WorkAssignments> {
  const result = { ...assignments };

  for (const roleInput of roles) {
    const { roleKey, position } = roleInput;

    const roleDefinition = WORK_ASSIGNMENT_ROLES.find(
      (role) => role.key === roleKey,
    );
    if (!roleDefinition) {
      continue;
    }

    if (roleDefinition.type === "single") {
      const existing = (result as Record<string, string>)[roleKey] || "";
      const names = existing ? existing.split(SEPARATOR).map((n) => n.trim()) : [];
      if (!names.includes(userName)) {
        names.push(userName);
      }
      (result as Record<string, string>)[roleKey] = names.join(SEPARATOR);
    } else if (roleDefinition.type === "dual") {
      if (!result[roleKey as keyof WorkAssignments]) {
        (result as Record<string, object>)[roleKey] = {};
      }
      if (!position) {
        continue;
      }
      const dualValue = result[roleKey as keyof WorkAssignments];
      if (typeof dualValue === "object" && dualValue !== null) {
        const existing = (dualValue as Record<string, string>)[position] || "";
        const names = existing ? existing.split(SEPARATOR).map((n) => n.trim()) : [];
        if (!names.includes(userName)) {
          names.push(userName);
        }
        (dualValue as Record<string, string>)[position] = names.join(SEPARATOR);
      }
    } else if (roleDefinition.type === "multiple") {
      const existing = (result as Record<string, string>)[roleKey] || "";
      const names = existing ? existing.split(SEPARATOR).map((n) => n.trim()) : [];
      if (!names.includes(userName)) {
        names.push(userName);
      }
      (result as Record<string, string>)[roleKey] = names.join(SEPARATOR);
    }
  }

  return result;
}

/**
 * Remove a user from all assignment roles
 */
export function removeUserFromAssignments(
  assignments: Partial<WorkAssignments>,
  userName: string,
): Partial<WorkAssignments> {
  const result = { ...assignments };

  for (const key in result) {
    const value = (result as Record<string, unknown>)[key];

    if (typeof value === "string") {
      const names = value
        .split(SEPARATOR)
        .map((n) => n.trim())
        .filter((n) => n !== userName);
      (result as Record<string, string>)[key] = names.join(SEPARATOR);
    } else if (typeof value === "object" && value !== null) {
      const dualValue = value as Record<string, string | undefined>;
      for (const position in dualValue) {
        const posValue = dualValue[position];
        if (!posValue) continue;
        const names = posValue
          .split(SEPARATOR)
          .map((n) => n.trim())
          .filter((n) => n !== userName);
        dualValue[position] = names.join(SEPARATOR);
      }
    }
  }

  return result;
}
