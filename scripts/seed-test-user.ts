import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

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
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email: testUserEmail },
    });
    if (existingUserByEmail && existingUserByEmail.id !== testUserId) {
      await prisma.user.delete({ where: { email: testUserEmail } });
    }

    // Upsert User by ID
    const user = await prisma.user.upsert({
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
    await prisma.casualCheckRecord.deleteMany({ where: { userId: user.id } });
    await prisma.volunteerActivityCheckRecord.deleteMany({
      where: { userId: user.id },
    });
    await prisma.classActivityCheckRecord.deleteMany({
      where: { userId: user.id },
    });
    await prisma.etogetherActivityCheckRecord.deleteMany({
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

  await prisma.session.upsert({
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
      await prisma.$disconnect();
    })
    .catch(async (e) => {
      console.error(e);
      await prisma.$disconnect();
      process.exit(1);
    });
}
