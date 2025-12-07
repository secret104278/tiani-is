import { Role } from "~/prisma-client";
import { db } from "~/server/db";

export async function seedTestUser() {
  const sessionToken = "e2e-test-session-token";

  console.log("Seeding test users for all workers...");

  // Create test users for workers 0-9 to support parallel test execution
  const maxWorkers = 10;
  const users = [];

  for (let workerIndex = 0; workerIndex < maxWorkers; workerIndex++) {
    const testUserId = `e2e-test-user-id-w${workerIndex}`;
    const testUserEmail = `e2e-test-user-w${workerIndex}@example.com`;

    // Delete any user with the target email if it has a different ID
    const existingUserByEmail = await db.user.findUnique({
      where: { email: testUserEmail },
    });
    if (existingUserByEmail && existingUserByEmail.id !== testUserId) {
      await db.user.delete({ where: { email: testUserEmail } });
    }

    // Upsert User by ID
    const user = await db.user.upsert({
      where: { id: testUserId },
      update: {
        email: testUserEmail,
        name: `E2E Test User W${workerIndex}`,
        roles: [
          Role.TIANI_ADMIN,
          Role.VOLUNTEER_ADMIN,
          Role.YIDECLASS_ADMIN,
          Role.ETOGETHER_ADMIN,
          Role.YIDEWORK_ADMIN,
        ],
      },
      create: {
        id: testUserId,
        email: testUserEmail,
        name: `E2E Test User W${workerIndex}`,
        roles: [
          Role.TIANI_ADMIN,
          Role.VOLUNTEER_ADMIN,
          Role.YIDECLASS_ADMIN,
          Role.ETOGETHER_ADMIN,
          Role.YIDEWORK_ADMIN,
        ],
      },
    });

    // Clean up check-ins for clean state
    await db.casualCheckRecord.deleteMany({ where: { userId: user.id } });
    await db.volunteerActivityCheckRecord.deleteMany({
      where: { userId: user.id },
    });
    await db.classActivityCheckRecord.deleteMany({
      where: { userId: user.id },
    });
    await db.etogetherActivityCheckRecord.deleteMany({
      where: { register: { userId: user.id } },
    });

    users.push(user);
  }

  console.log(`Seeded ${users.length} test users.`);

  // Use worker 0's user for the main session token (for backward compatibility)
  const mainUser = users[0]!;

  // Upsert Session
  const expires = new Date();
  expires.setDate(expires.getDate() + 1); // Expires in 1 day

  await db.session.upsert({
    where: { sessionToken: sessionToken },
    update: {
      expires,
      userId: mainUser.id,
    },
    create: {
      sessionToken,
      userId: mainUser.id,
      expires,
    },
  });

  console.log(`Session for ${mainUser.email} created/updated.`);
}

if (require.main === module) {
  seedTestUser()
    .then(async () => {
      await db.$disconnect();
    })
    .catch(async (e) => {
      console.error(e);
      await db.$disconnect();
      process.exit(1);
    });
}
