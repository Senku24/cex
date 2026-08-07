import { prisma } from "../src/prisma.ts"

async function main() {
  await prisma.stock.createMany({
    data: [
      {
        name: "AXIS BANK",
        symbol: "AXIS",
      },
      {
        name: "HDFC BANK",
        symbol: "HDFC",
      },
      {
        name: "TATA STEEL",
        symbol: "TATA",
      },
    ],
    skipDuplicates: true,
  });

  console.log("Stocks seeded.");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });