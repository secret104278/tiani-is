import type { queueAsPromised } from "fastq";
import * as fastq from "fastq";
import type { Session } from "next-auth";
import { getActivityDetailURL } from "~/utils/url";
import { db } from "../db";
import { bot } from "../line";

type ParticipateActivityEvent = {
  activityId: number;
  user: Session["user"];
};

export const participateActivityEventQueue: queueAsPromised<ParticipateActivityEvent> =
  fastq.promise(worker, 1);

async function worker(input: ParticipateActivityEvent): Promise<void> {
  const activity = await db.volunteerActivity.findFirstOrThrow({
    select: { organiserId: true, title: true },
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
          text: `你完成報名了 ${organizer.name} 主辦的志工工作 ${
            activity.title
          }！\n${getActivityDetailURL(input.activityId)}`,
        },
      ],
    });

  if (organizer.accounts[0])
    await bot.pushMessage({
      to: organizer.accounts[0].providerAccountId,
      messages: [
        {
          type: "text",
          text: `${input.user.name} 報名了你主辦的志工工作 ${
            activity.title
          }！\n${getActivityDetailURL(input.activityId)}`,
        },
      ],
    });
}
