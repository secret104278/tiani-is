import { differenceInHoursNoRound } from "./ui";

export function calculateWorkingHours(
  checkInAt: Date,
  checkOutAt: Date | null,
) {
  if (!checkOutAt) return 0;
  return differenceInHoursNoRound(checkOutAt, checkInAt);
}

export function calculateTotalWorkingHours({
  casualCheckRecords,
  volunteerActivityCheckRecords,
}: {
  casualCheckRecords: { checkInAt: Date; checkOutAt: Date | null }[];
  volunteerActivityCheckRecords: { checkInAt: Date; checkOutAt: Date | null }[];
}) {
  const casualWorkingHours = casualCheckRecords.reduce(
    (acc, record) =>
      acc + calculateWorkingHours(record.checkInAt, record.checkOutAt),
    0,
  );

  const activityWorkingHours = volunteerActivityCheckRecords.reduce(
    (acc, record) =>
      acc + calculateWorkingHours(record.checkInAt, record.checkOutAt),
    0,
  );

  return casualWorkingHours + activityWorkingHours;
}
