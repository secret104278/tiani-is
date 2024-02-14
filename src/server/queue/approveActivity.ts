import type { queueAsPromised } from "fastq";
import * as fastq from "fastq";
import { getActivityDetailURL } from "~/utils/url";
import { db } from "../db";
import { pushNotification } from "../linenotify";

type ApproveActivityEvent = {
  activityId: number;
};

export const approveActivityEventQueue: queueAsPromised<ApproveActivityEvent> =
  fastq.promise(worker, 1);

async function worker(input: ApproveActivityEvent): Promise<void> {
  const activity = await db.volunteerActivity.findFirstOrThrow({
    select: { organiserId: true, title: true, version: true, id: true },
    where: { id: input.activityId },
  });

  await pushNotification(
    activity.organiserId,
    `你的志工工作申請 ${
      activity.title
    } 已經通過審核囉！\n${getActivityDetailURL(activity)}`,
  );
}
