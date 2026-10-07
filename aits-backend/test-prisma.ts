import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
  const records = await prisma.labResult.findMany({
    include: {
      animal: {
        select: {
          id: true,
        }
      }
    }
  });
  console.log(records[0].animal);
}
test();
