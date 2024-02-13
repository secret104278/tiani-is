import type { queueAsPromised } from "fastq";
import * as fastq from "fastq";
import { getActivityDetailURL } from "~/utils/url";
import { db } from "../db";
import { bot } from "../line";

type LeaveActivityEvent = {
  activityId: number;
  userId: string;
};

export const leaveActivityEventQueue: queueAsPromised<LeaveActivityEvent> =
  fastq.promise(dummy, 1);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function dummy(input: LeaveActivityEvent): Promise<void> {
  return Promise.resolve();
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function worker(input: LeaveActivityEvent): Promise<void> {
  const activity = await db.volunteerActivity.findUniqueOrThrow({
    select: { organiserId: true, title: true, id: true, version: true },
    where: { id: input.activityId },
  });

  const organizer = await db.user.findUniqueOrThrow({
    select: {
      name: true,
      accounts: {
        select: { providerAccountId: true },
        where: { provider: "line" },
      },
    },
    where: {
      id: activity.organiserId,
    },
  });

  const user = await db.user.findUniqueOrThrow({
    select: {
      name: true,
      accounts: {
        select: { providerAccountId: true },
        where: { provider: "line" },
      },
    },
    where: { id: input.userId },
  });

  await Promise.all([
    ...user.accounts.map((account) =>
      bot.pushMessage({
        to: account.providerAccountId,
        messages: [
          {
            type: "text",
            text: `你取消報名了 ${organizer.name} 主辦的志工工作 ${
              activity.title
            }！\n${getActivityDetailURL(activity)}`,
          },
        ],
      }),
    ),

    ...organizer.accounts.map((account) =>
      bot.pushMessage({
        to: account.providerAccountId,
        messages: [
          {
            type: "text",
            text: `${user.name} 取消報名了你主辦的志工工作 ${
              activity.title
            }！\n${getActivityDetailURL(activity)}`,
          },
        ],
      }),
    ),
  ]);
}
