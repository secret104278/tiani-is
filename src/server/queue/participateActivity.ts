import type { queueAsPromised } from "fastq";
import * as fastq from "fastq";
import { getActivityDetailURL } from "~/utils/url";
import { db } from "../db";
import { pushNotification } from "../linenotify";

type ParticipateActivityEvent = {
  activityId: number;
  userId: string;
};

export const participateActivityEventQueue: queueAsPromised<ParticipateActivityEvent> =
  fastq.promise(worker, 1);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function dummy(input: ParticipateActivityEvent): Promise<void> {
  return Promise.resolve();
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function worker(input: ParticipateActivityEvent): Promise<void> {
  const [activity, user] = await Promise.all([
    db.volunteerActivity.findUniqueOrThrow({
      select: {
        organiserId: true,
        organiser: { select: { name: true } },
        title: true,
        id: true,
        version: true,
      },
      where: { id: input.activityId },
    }),
    db.user.findUniqueOrThrow({
      select: { name: true },
      where: { id: input.userId },
    }),
  ]);

  await Promise.all([
    pushNotification(
      input.userId,
      `你完成報名了 ${activity.organiser.name} 主辦的志工工作 ${
        activity.title
      }！\n${getActivityDetailURL(activity)}`,
    ),
    pushNotification(
      activity.organiserId,
      `${user.name} 報名了你主辦的志工工作 ${
        activity.title
      }！\n${getActivityDetailURL(activity)}`,
    ),
  ]);
}
