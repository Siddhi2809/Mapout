const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

async function checkMaxCode() {
  const res = await p.customer.findMany({ select: { customerCode: true } });
  const nums = res.map(r => {
    const m = r.customerCode.match(/\d+/);
    return m ? parseInt(m[0], 10) : 0;
  });
  const max = Math.max(...nums);
  console.log("Max customer code num:", max, "Total customers:", res.length);
  await p.$disconnect();
}

checkMaxCode().catch(console.error);
