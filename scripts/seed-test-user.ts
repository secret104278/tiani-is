import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedTestUser() {
  const testUserEmail = "e2e-test-user@example.com";
  const testUserId = "e2e-test-user-id";
  const sessionToken = "e2e-test-session-token";

  console.log("Seeding test user...");

  // Upsert User
  const user = await prisma.user.upsert({
    where: { email: testUserEmail },
    update: {
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
      name: "E2E Test User",
      roles: [
        Role.TIANI_ADMIN,
        Role.VOLUNTEER_ADMIN,
        Role.YIDECLASS_ADMIN,
        Role.ETOGETHER_ADMIN,
        Role.YIDEWORK_ADMIN,
      ],
    },
  });

  console.log(`User ${user.email} upserted.`);

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
  // Also clean up registrations/enrollments if needed?
  // Maybe better to keep them if we want to test "already registered" scenarios, but for "create and register" flows, clean is better.
  // For now, check-ins are the main state that affects button text ("簽到" vs "簽退").

  // Upsert Session
  const expires = new Date();
  expires.setDate(expires.getDate() + 1); // Expires in 1 day

  await prisma.session.upsert({
    where: { sessionToken: sessionToken },
    update: {
      expires,
      userId: user.id,
    },
    create: {
      sessionToken,
      userId: user.id,
      expires,
    },
  });

  console.log(`Session for ${user.email} created/updated.`);
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
