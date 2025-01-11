import { relations } from "drizzle-orm/relations";
import {
  etogetherActivityCheckRecordPgTable,
  etogetherActivityPgTable,
  etogetherActivityRegisterPgTable,
  etogetherActivitySubgroupPgTable,
  externalEtogetherActivityCheckRecordPgTable,
  externalEtogetherActivityRegisterPgTable,
} from "./etogether";
import { lineNotifyPgTable } from "./line";
import {
  accountPgTable,
  activityReviewerPgTable,
  sessionPgTable,
  userPgTable,
} from "./user";
import {
  casualCheckRecordPgTable,
  participatedVolunteerActivitesPgTable,
  volunteerActivityCheckRecordPgTable,
  volunteerActivityPgTable,
} from "./volunteer";
import {
  classActivityCheckRecordPgTable,
  classActivityLeaveRecordPgTable,
  classActivityPgTable,
  classMemberEnrollmentPgTable,
} from "./yideclass";
import {
  externalYideWorkActivityRegisterPgTable,
  yideWorkActivityPgTable,
  yideWorkActivityRegisterPgTable,
  yideWorkLocationPgTable,
  yideWorkPresetPgTable,
} from "./yidework";

export const classActivityRelations = relations(
  classActivityPgTable,
  ({ one, many }) => ({
    user: one(userPgTable, {
      fields: [classActivityPgTable.organiserId],
      references: [userPgTable.id],
    }),
    classActivityLeaveRecords: many(classActivityLeaveRecordPgTable),
    classActivityCheckRecords: many(classActivityCheckRecordPgTable),
  }),
);

export const userRelations = relations(userPgTable, ({ many }) => ({
  classActivities: many(classActivityPgTable),
  classActivityLeaveRecords: many(classActivityLeaveRecordPgTable),
  activityReviewers: many(activityReviewerPgTable),
  casualCheckRecords: many(casualCheckRecordPgTable),
  classMemberEnrollments: many(classMemberEnrollmentPgTable),
  etogetherActivityRegisters: many(etogetherActivityRegisterPgTable),
  etogetherActivities: many(etogetherActivityPgTable),
  accounts: many(accountPgTable),
  yideWorkActivities: many(yideWorkActivityPgTable),
  yideWorkActivityRegisters: many(yideWorkActivityRegisterPgTable),
  sessions: many(sessionPgTable),
  volunteerActivities: many(volunteerActivityPgTable),
  lineNotifies: many(lineNotifyPgTable),
  volunteerActivityCheckRecords: many(volunteerActivityCheckRecordPgTable),
  classActivityCheckRecords: many(classActivityCheckRecordPgTable),
  participatedVolunteerActivites: many(participatedVolunteerActivitesPgTable),
}));

export const classActivityLeaveRecordRelations = relations(
  classActivityLeaveRecordPgTable,
  ({ one }) => ({
    classActivity: one(classActivityPgTable, {
      fields: [classActivityLeaveRecordPgTable.activityId],
      references: [classActivityPgTable.id],
    }),
    user: one(userPgTable, {
      fields: [classActivityLeaveRecordPgTable.userId],
      references: [userPgTable.id],
    }),
  }),
);

export const activityReviewerRelations = relations(
  activityReviewerPgTable,
  ({ one }) => ({
    user: one(userPgTable, {
      fields: [activityReviewerPgTable.userId],
      references: [userPgTable.id],
    }),
  }),
);

export const casualCheckRecordRelations = relations(
  casualCheckRecordPgTable,
  ({ one }) => ({
    user: one(userPgTable, {
      fields: [casualCheckRecordPgTable.userId],
      references: [userPgTable.id],
    }),
  }),
);

export const classMemberEnrollmentRelations = relations(
  classMemberEnrollmentPgTable,
  ({ one }) => ({
    user: one(userPgTable, {
      fields: [classMemberEnrollmentPgTable.userId],
      references: [userPgTable.id],
    }),
  }),
);

export const etogetherActivityRegisterRelations = relations(
  etogetherActivityRegisterPgTable,
  ({ one, many }) => ({
    etogetherActivity: one(etogetherActivityPgTable, {
      fields: [etogetherActivityRegisterPgTable.activityId],
      references: [etogetherActivityPgTable.id],
    }),
    etogetherActivitySubgroup: one(etogetherActivitySubgroupPgTable, {
      fields: [etogetherActivityRegisterPgTable.subgroupId],
      references: [etogetherActivitySubgroupPgTable.id],
    }),
    user: one(userPgTable, {
      fields: [etogetherActivityRegisterPgTable.userId],
      references: [userPgTable.id],
    }),
    etogetherActivityCheckRecords: many(etogetherActivityCheckRecordPgTable),
    externalEtogetherActivityRegisters: many(
      externalEtogetherActivityRegisterPgTable,
    ),
  }),
);

export const etogetherActivityRelations = relations(
  etogetherActivityPgTable,
  ({ one, many }) => ({
    etogetherActivityRegisters: many(etogetherActivityRegisterPgTable),
    etogetherActivitySubgroups: many(etogetherActivitySubgroupPgTable),
    user: one(userPgTable, {
      fields: [etogetherActivityPgTable.organiserId],
      references: [userPgTable.id],
    }),
    externalEtogetherActivityRegisters: many(
      externalEtogetherActivityRegisterPgTable,
    ),
  }),
);

export const etogetherActivitySubgroupRelations = relations(
  etogetherActivitySubgroupPgTable,
  ({ one, many }) => ({
    etogetherActivityRegisters: many(etogetherActivityRegisterPgTable),
    etogetherActivity: one(etogetherActivityPgTable, {
      fields: [etogetherActivitySubgroupPgTable.etogetherActivityId],
      references: [etogetherActivityPgTable.id],
    }),
    externalEtogetherActivityRegisters: many(
      externalEtogetherActivityRegisterPgTable,
    ),
  }),
);

export const etogetherActivityCheckRecordRelations = relations(
  etogetherActivityCheckRecordPgTable,
  ({ one }) => ({
    etogetherActivityRegister: one(etogetherActivityRegisterPgTable, {
      fields: [etogetherActivityCheckRecordPgTable.registerId],
      references: [etogetherActivityRegisterPgTable.id],
    }),
  }),
);

export const accountRelations = relations(accountPgTable, ({ one }) => ({
  user: one(userPgTable, {
    fields: [accountPgTable.userId],
    references: [userPgTable.id],
  }),
}));

export const yideWorkActivityRelations = relations(
  yideWorkActivityPgTable,
  ({ one, many }) => ({
    yideWorkLocation: one(yideWorkLocationPgTable, {
      fields: [yideWorkActivityPgTable.locationId],
      references: [yideWorkLocationPgTable.id],
    }),
    user: one(userPgTable, {
      fields: [yideWorkActivityPgTable.organiserId],
      references: [userPgTable.id],
    }),
    yideWorkPreset: one(yideWorkPresetPgTable, {
      fields: [yideWorkActivityPgTable.presetId],
      references: [yideWorkPresetPgTable.id],
    }),
    yideWorkActivityRegisters: many(yideWorkActivityRegisterPgTable),
    externalYideWorkActivityRegisters: many(
      externalYideWorkActivityRegisterPgTable,
    ),
  }),
);

export const yideWorkLocationRelations = relations(
  yideWorkLocationPgTable,
  ({ many }) => ({
    yideWorkActivities: many(yideWorkActivityPgTable),
  }),
);

export const yideWorkPresetRelations = relations(
  yideWorkPresetPgTable,
  ({ many }) => ({
    yideWorkActivities: many(yideWorkActivityPgTable),
  }),
);

export const yideWorkActivityRegisterRelations = relations(
  yideWorkActivityRegisterPgTable,
  ({ one, many }) => ({
    yideWorkActivity: one(yideWorkActivityPgTable, {
      fields: [yideWorkActivityRegisterPgTable.activityId],
      references: [yideWorkActivityPgTable.id],
    }),
    user: one(userPgTable, {
      fields: [yideWorkActivityRegisterPgTable.userId],
      references: [userPgTable.id],
    }),
    externalYideWorkActivityRegisters: many(
      externalYideWorkActivityRegisterPgTable,
    ),
  }),
);

export const sessionRelations = relations(sessionPgTable, ({ one }) => ({
  user: one(userPgTable, {
    fields: [sessionPgTable.userId],
    references: [userPgTable.id],
  }),
}));

export const volunteerActivityRelations = relations(
  volunteerActivityPgTable,
  ({ one, many }) => ({
    user: one(userPgTable, {
      fields: [volunteerActivityPgTable.organiserId],
      references: [userPgTable.id],
    }),
    volunteerActivityCheckRecords: many(volunteerActivityCheckRecordPgTable),
    participatedVolunteerActivites: many(participatedVolunteerActivitesPgTable),
  }),
);

export const externalEtogetherActivityRegisterRelations = relations(
  externalEtogetherActivityRegisterPgTable,
  ({ one, many }) => ({
    etogetherActivity: one(etogetherActivityPgTable, {
      fields: [externalEtogetherActivityRegisterPgTable.activityId],
      references: [etogetherActivityPgTable.id],
    }),
    etogetherActivityRegister: one(etogetherActivityRegisterPgTable, {
      fields: [externalEtogetherActivityRegisterPgTable.mainRegisterId],
      references: [etogetherActivityRegisterPgTable.id],
    }),
    etogetherActivitySubgroup: one(etogetherActivitySubgroupPgTable, {
      fields: [externalEtogetherActivityRegisterPgTable.subgroupId],
      references: [etogetherActivitySubgroupPgTable.id],
    }),
    externalEtogetherActivityCheckRecords: many(
      externalEtogetherActivityCheckRecordPgTable,
    ),
  }),
);

export const lineNotifyRelations = relations(lineNotifyPgTable, ({ one }) => ({
  user: one(userPgTable, {
    fields: [lineNotifyPgTable.userId],
    references: [userPgTable.id],
  }),
}));

export const volunteerActivityCheckRecordRelations = relations(
  volunteerActivityCheckRecordPgTable,
  ({ one }) => ({
    volunteerActivity: one(volunteerActivityPgTable, {
      fields: [volunteerActivityCheckRecordPgTable.activityId],
      references: [volunteerActivityPgTable.id],
    }),
    user: one(userPgTable, {
      fields: [volunteerActivityCheckRecordPgTable.userId],
      references: [userPgTable.id],
    }),
  }),
);

export const externalYideWorkActivityRegisterRelations = relations(
  externalYideWorkActivityRegisterPgTable,
  ({ one }) => ({
    yideWorkActivity: one(yideWorkActivityPgTable, {
      fields: [externalYideWorkActivityRegisterPgTable.activityId],
      references: [yideWorkActivityPgTable.id],
    }),
    yideWorkActivityRegister: one(yideWorkActivityRegisterPgTable, {
      fields: [externalYideWorkActivityRegisterPgTable.mainRegisterId],
      references: [yideWorkActivityRegisterPgTable.id],
    }),
  }),
);

export const classActivityCheckRecordRelations = relations(
  classActivityCheckRecordPgTable,
  ({ one }) => ({
    classActivity: one(classActivityPgTable, {
      fields: [classActivityCheckRecordPgTable.activityId],
      references: [classActivityPgTable.id],
    }),
    user: one(userPgTable, {
      fields: [classActivityCheckRecordPgTable.userId],
      references: [userPgTable.id],
    }),
  }),
);

export const externalEtogetherActivityCheckRecordRelations = relations(
  externalEtogetherActivityCheckRecordPgTable,
  ({ one }) => ({
    externalEtogetherActivityRegister: one(
      externalEtogetherActivityRegisterPgTable,
      {
        fields: [externalEtogetherActivityCheckRecordPgTable.registerId],
        references: [externalEtogetherActivityRegisterPgTable.id],
      },
    ),
  }),
);

export const participatedVolunteerActivitesRelations = relations(
  participatedVolunteerActivitesPgTable,
  ({ one }) => ({
    user: one(userPgTable, {
      fields: [participatedVolunteerActivitesPgTable.a],
      references: [userPgTable.id],
    }),
    volunteerActivity: one(volunteerActivityPgTable, {
      fields: [participatedVolunteerActivitesPgTable.b],
      references: [volunteerActivityPgTable.id],
    }),
  }),
);
