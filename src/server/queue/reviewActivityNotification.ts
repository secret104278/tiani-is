import type { queueAsPromised } from "fastq";
import * as fastq from "fastq";
import { VolunteerActivityStatus } from "~/prisma-client";
import { getActivityDetailURL } from "~/utils/url";
import { db } from "../db";
import { bot } from "../line";
import { pushNotification } from "../linenotify";

type ReviewActivityNotificationEvent = {
  activityId: number;
};

export const reviewActivityNotificationEventQueue: queueAsPromised<ReviewActivityNotificationEvent> =
  fastq.promise(worker, 1);

async function worker(input: ReviewActivityNotificationEvent): Promise<void> {
  const activity = await db.volunteerActivity.findUniqueOrThrow({
    select: {
      id: true,
      version: true,
      title: true,
      status: true,
      organiser: true,
    },
    where: { id: input.activityId },
  });

  if (activity.status !== VolunteerActivityStatus.INREVIEW)
    throw new Error("Only in-review activity can send review notification");

  const reviewers = await db.activityReviewer.findMany({
    select: {
      user: {
        select: {
          accounts: {
            select: {
              providerAccountId: true,
            },
          },
        },
      },
    },
    where: {
      user: {
        accounts: {
          every: {
            provider: "line",
          },
        },
      },
    },
  });

  await Promise.all(
    reviewers
      .flatMap((reviewer) => reviewer.user.accounts)
      .map((account) =>
        bot.pushMessage({
          to: account.providerAccountId,
          messages: [
            {
              type: "text",
              text: `有新的志工工作申請 ${activity.title} 來自 ${
                activity.organiser.name
              } 需要審核囉！\n${getActivityDetailURL(activity)}`,
            },
          ],
        }),
      ),
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function linenotify_worker(
  input: ReviewActivityNotificationEvent,
): Promise<void> {
  const activity = await db.volunteerActivity.findUniqueOrThrow({
    select: {
      id: true,
      version: true,
      title: true,
      status: true,
      organiser: true,
    },
    where: { id: input.activityId },
  });

  if (activity.status !== VolunteerActivityStatus.INREVIEW)
    throw new Error("Only in-review activity can send review notification");

  const reviewers = await db.activityReviewer.findMany({
    select: {
      userId: true,
    },
  });

  await Promise.all(
    reviewers.map((reviewer) =>
      pushNotification(
        reviewer.userId,
        `有新的志工工作申請 ${activity.title} 來自 ${
          activity.organiser.name
        } 需要審核囉！\n${getActivityDetailURL(activity)}`,
      ),
    ),
  );
}
