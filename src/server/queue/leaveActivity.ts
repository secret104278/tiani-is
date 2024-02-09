import type { queueAsPromised } from "fastq";
import * as fastq from "fastq";
import type { Session } from "next-auth";
import { getActivityDetailURL } from "~/utils/url";
import { db } from "../db";
import { bot } from "../line";

type LeaveActivityEvent = {
  activityId: number;
  user: Session["user"];
};

export const leaveActivityEventQueue: queueAsPromised<LeaveActivityEvent> =
  fastq.promise(dummy, 1);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function dummy(input: LeaveActivityEvent): Promise<void> {
  return Promise.resolve();
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function worker(input: LeaveActivityEvent): Promise<void> {
  const activity = await db.volunteerActivity.findFirstOrThrow({
    select: { organiserId: true, title: true, id: true, version: true },
    where: { id: input.activityId },
  });

  const organizer = await db.user.findFirstOrThrow({
    select: {
      name: true,
      accounts: { select: { providerAccountId: true } },
    },
    where: {
      id: activity.organiserId,
      accounts: { every: { provider: "line" } },
    },
  });

  const userLineAccount = await db.account.findFirst({
    select: { providerAccountId: true },
    where: {
      userId: input.user.id,
      provider: "line",
    },
  });

  if (userLineAccount)
    await bot.pushMessage({
      to: userLineAccount.providerAccountId,
      messages: [
        {
          type: "text",
          text: `你取消報名了 ${organizer.name} 主辦的志工工作 ${
            activity.title
          }！\n${getActivityDetailURL(activity)}`,
        },
      ],
    });

  if (organizer.accounts[0])
    await bot.pushMessage({
      to: organizer.accounts[0].providerAccountId,
      messages: [
        {
          type: "text",
          text: `${input.user.name} 取消報名了你主辦的志工工作 ${
            activity.title
          }！\n${getActivityDetailURL(activity)}`,
        },
      ],
    });
}
