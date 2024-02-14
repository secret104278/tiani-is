import type { queueAsPromised } from "fastq";
import * as fastq from "fastq";
import { getActivityDetailURL } from "~/utils/url";
import { db } from "../db";
import { pushNotification } from "../linenotify";

type LeaveActivityEvent = {
  activityId: number;
  userId: string;
};

export const leaveActivityEventQueue: queueAsPromised<LeaveActivityEvent> =
  fastq.promise(worker, 1);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function dummy(input: LeaveActivityEvent): Promise<void> {
  return Promise.resolve();
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function worker(input: LeaveActivityEvent): Promise<void> {
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
      `你取消報名了 ${activity.organiser.name} 主辦的志工工作 ${
        activity.title
      }！\n${getActivityDetailURL(activity)}`,
    ),
    pushNotification(
      activity.organiserId,
      `${user.name} 取消報名了你主辦的志工工作 ${
        activity.title
      }！\n${getActivityDetailURL(activity)}`,
    ),
  ]);
}
