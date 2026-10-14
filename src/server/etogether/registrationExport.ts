import * as jose from "jose";
import { isNil } from "lodash";
import { env } from "~/env.mjs";
import { db } from "~/server/db";
import { toCsv } from "~/utils/csv";

const EXPORT_TOKEN_TTL = "10m";
const EXPORT_TOKEN_PURPOSE = "etogether-registration-export";

function getSecret() {
  return new TextEncoder().encode(
    env.NEXTAUTH_SECRET ?? "dev-registration-export-secret",
  );
}

// The download is opened in the external browser (LINE's in-app browser cannot
// save files), which has no session cookie, so authorize it with a short-lived
// signed token instead.
export async function signRegistrationExportToken(activityId: number) {
  return new jose.SignJWT({ activityId, purpose: EXPORT_TOKEN_PURPOSE })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(EXPORT_TOKEN_TTL)
    .sign(getSecret());
}

export async function verifyRegistrationExportToken(token: string) {
  const { payload } = await jose.jwtVerify(token, getSecret());
  if (
    payload.purpose !== EXPORT_TOKEN_PURPOSE ||
    typeof payload.activityId !== "number"
  )
    throw new Error("invalid token");
  return payload.activityId;
}

export async function buildRegistrationExport(activityId: number) {
  const activity = await db.etogetherActivity.findUniqueOrThrow({
    where: { id: activityId },
    include: {
      subgroups: true,
      registers: {
        include: {
          user: { select: { name: true } },
          checkRecord: true,
          externalRegisters: { include: { checkRecord: true } },
        },
      },
    },
  });

  const rowsBySubgroup: Record<number, string[][]> = {};
  const push = (subgroupId: number, row: string[]) => {
    rowsBySubgroup[subgroupId] ??= [];
    rowsBySubgroup[subgroupId].push(row);
  };

  for (const register of activity.registers) {
    const registrant = register.user.name ?? "";
    if (!isNil(register.user.name))
      push(register.subgroupId, [
        register.user.name,
        "本人",
        registrant,
        isNil(register.checkRecord) ? "" : "已簽到",
      ]);
  }
  for (const register of activity.registers) {
    const registrant = register.user.name ?? "";
    for (const external of register.externalRegisters) {
      push(external.subgroupId, [
        external.username,
        "代報名",
        registrant,
        isNil(external.checkRecord) ? "" : "已簽到",
      ]);
    }
  }

  const rows: string[][] = [["分組", "姓名", "報名方式", "報名人", "簽到"]];
  for (const subgroup of activity.subgroups) {
    for (const row of rowsBySubgroup[subgroup.id] ?? []) {
      rows.push([subgroup.title, ...row]);
    }
  }

  return {
    filename: `${activity.title}_報名名單.csv`,
    // BOM so Excel opens UTF-8 (Chinese) content correctly
    content: `﻿${toCsv(rows)}`,
  };
}
