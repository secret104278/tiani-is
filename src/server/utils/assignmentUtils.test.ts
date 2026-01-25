import { describe, expect, it } from "vitest";
import type { WorkAssignments } from "~/utils/types";
import {
  addUserToAssignments,
  removeUserFromAssignments,
} from "./assignmentUtils";

describe("assignmentUtils", () => {
  describe("addUserToAssignments", () => {
    it("should add a user to a single-type role", () => {
      const assignments: Partial<WorkAssignments> = {};
      const result = addUserToAssignments(assignments, "張三", [
        { roleKey: "conductor" },
      ]);
      expect(result.conductor).toBe("張三");
    });

    it("should append a user to a single-type role with existing users", () => {
      const assignments: Partial<WorkAssignments> = { conductor: "李四" };
      const result = addUserToAssignments(assignments, "張三", [
        { roleKey: "conductor" },
      ]);
      expect(result.conductor).toBe("李四，張三");
    });

    it("should not add duplicate user to single-type role", () => {
      const assignments: Partial<WorkAssignments> = { conductor: "張三" };
      const result = addUserToAssignments(assignments, "張三", [
        { roleKey: "conductor" },
      ]);
      expect(result.conductor).toBe("張三");
    });

    it("should add a user to a dual-type role (upper)", () => {
      const assignments: Partial<WorkAssignments> = {};
      const result = addUserToAssignments(assignments, "張三", [
        { roleKey: "offering", position: "upper" },
      ]);
      expect(result.offering?.upper).toBe("張三");
      expect(result.offering?.lower).toBeUndefined();
    });

    it("should add a user to a dual-type role (lower)", () => {
      const assignments: Partial<WorkAssignments> = {};
      const result = addUserToAssignments(assignments, "李四", [
        { roleKey: "offering", position: "lower" },
      ]);
      expect(result.offering?.lower).toBe("李四");
      expect(result.offering?.upper).toBeUndefined();
    });

    it("should append a user to a dual-type role with existing users", () => {
      const assignments: Partial<WorkAssignments> = {
        offering: { upper: "張三" },
      };
      const result = addUserToAssignments(assignments, "李四", [
        { roleKey: "offering", position: "upper" },
      ]);
      expect(result.offering?.upper).toBe("張三，李四");
    });

    it("should add a user to multiple roles at once", () => {
      const assignments: Partial<WorkAssignments> = {};
      const result = addUserToAssignments(assignments, "張三", [
        { roleKey: "conductor" },
        { roleKey: "offering", position: "upper" },
      ]);
      expect(result.conductor).toBe("張三");
      expect(result.offering?.upper).toBe("張三");
    });

    it("should ignore invalid role keys", () => {
      const assignments: Partial<WorkAssignments> = {};
      const result = addUserToAssignments(assignments, "張三", [
        // biome-ignore lint/suspicious/noExplicitAny: testing invalid input
        { roleKey: "invalidRole" as any },
      ]);
      expect(result).toEqual({});
    });

    it("should ignore dual-type role without position", () => {
      const assignments: Partial<WorkAssignments> = {};
      const result = addUserToAssignments(assignments, "張三", [
        { roleKey: "offering" },
      ]);
      expect(result.offering).toEqual({});
    });
  });

  describe("removeUserFromAssignments", () => {
    it("should remove a user from single-type roles", () => {
      const assignments: Partial<WorkAssignments> = {
        conductor: "張三",
        expoundingTao: "李四，張三",
      };
      const result = removeUserFromAssignments(assignments, "張三");
      expect(result.conductor).toBe("");
      expect(result.expoundingTao).toBe("李四");
    });

    it("should remove a user from dual-type roles", () => {
      const assignments: Partial<WorkAssignments> = {
        offering: {
          upper: "張三，李四",
          lower: "張三",
        },
      };
      const result = removeUserFromAssignments(assignments, "張三");
      expect(result.offering?.upper).toBe("李四");
      expect(result.offering?.lower).toBe("");
    });

    it("should handle mixed types and multiple removals", () => {
      const assignments: Partial<WorkAssignments> = {
        conductor: "張三",
        offering: {
          upper: "張三，李四",
        },
        arrangingFruit: "王五，張三",
      };
      const result = removeUserFromAssignments(assignments, "張三");
      expect(result.conductor).toBe("");
      expect(result.offering?.upper).toBe("李四");
      expect(result.arrangingFruit).toBe("王五");
    });

    it("should do nothing if user is not present", () => {
      const assignments: Partial<WorkAssignments> = {
        conductor: "李四",
        offering: {
          upper: "王五",
        },
      };
      const result = removeUserFromAssignments(assignments, "張三");
      expect(result).toEqual(assignments);
    });

    it("should handle empty strings and whitespace", () => {
      const assignments: Partial<WorkAssignments> = {
        conductor: "張三 ， 李四",
      };
      const result = removeUserFromAssignments(assignments, "張三");
      expect(result.conductor).toBe("李四");
    });
  });
});
