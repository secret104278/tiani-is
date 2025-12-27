import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding dev users...");

  const users = [
    {
      id: "dev-admin",
      name: "天一聖道院管理員",
      roles: [Role.TIANI_ADMIN],
    },
    {
      id: "dev-volunteer",
      name: "天一志工隊管理員",
      roles: [Role.VOLUNTEER_ADMIN],
    },
    {
      id: "dev-yideclass",
      name: "義德班務網管理員",
      roles: [Role.YIDECLASS_ADMIN],
    },
    {
      id: "dev-yidework",
      name: "義德道務網管理員",
      roles: [Role.YIDEWORK_ADMIN],
    },
    {
      id: "dev-etogether",
      name: "活動e起來管理員",
      roles: [Role.ETOGETHER_ADMIN],
    },
    {
      id: "dev-user",
      name: "測試使用者",
      roles: [],
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {
        name: user.name,
        roles: user.roles,
      },
      create: {
        id: user.id,
        name: user.name,
        roles: user.roles,
      },
    });
    console.log(`- Upserted user: ${user.name} (${user.id})`);
  }

  await prisma.yideWorkLocation.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, name: "天一聖道院" },
  });

  console.log("Seed finished successfully.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
