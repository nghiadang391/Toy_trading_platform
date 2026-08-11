import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding sample toys...");

  // 1. Create a dummy seller
  const seller = await prisma.user.upsert({
    where: { joyIdAddress: "ckt1qzda0crj2v64chvj3g0cj2v64chvj3g0cj2v64chvj3g0cj2v64chvj3g0" },
    update: {},
    create: {
      id: "cmslwc9bl0000oerq542iln7o",
      joyIdAddress: "ckt1qzda0crj2v64chvj3g0cj2v64chvj3g0cj2v64chvj3g0cj2v64chvj3g0",
      displayName: "Lego Collector UK",
      region: "UK",
    },
  });

  // 2. Create another dummy user to act as current logged-in buyer
  const buyer = await prisma.user.upsert({
    where: { joyIdAddress: "ckt1qzda0crj2v64chvj3g0cj2v64chvj3g0cj2v64chvj3g0cj2v64chvj3g1" },
    update: {},
    create: {
      id: "cmslwc9bl0000oerq542iln7p",
      joyIdAddress: "ckt1qzda0crj2v64chvj3g0cj2v64chvj3g0cj2v64chvj3g0cj2v64chvj3g1",
      displayName: "Active Parent Trader",
      region: "UK",
    },
  });

  // 3. Create Sample Listings
  const listing1 = await prisma.listing.create({
    data: {
      title: "LEGO Star Wars Millennium Falcon #75192",
      description: "Ultimate Collector Series Millennium Falcon. Complete set with original box and instructions. Never played with.",
      condition: "LIKE_NEW",
      category: "BUILDING_SETS",
      priceFiat: 150.00,
      currency: "GBP",
      referencePriceFiat: 145.00,
      imageUrls: ["/toy_lego_millennium_falcon_1786285814116.png"],
      tradeMethod: "MEETUP",
      location: "Hammersmith, London",
      sellerId: seller.id,
    },
  });

  const listing2 = await prisma.listing.create({
    data: {
      title: "GAN 11 M Pro Rubik's Speed Cube",
      description: "Premium magnetic speed cube. Turns super smooth. Includes extra tensioning magnets and core tools.",
      condition: "GOOD",
      category: "PUZZLES",
      priceFiat: 25.00,
      currency: "GBP",
      referencePriceFiat: 24.50,
      imageUrls: ["/toy_rubiks_speed_cube_1786286057979.png"],
      tradeMethod: "BOTH",
      location: "Richmond, London",
      sellerId: seller.id,
    },
  });

  const listing3 = await prisma.listing.create({
    data: {
      title: "Wooden Train Set 80-Piece",
      description: "Solid birch track layout with engine, magnetic passenger carriages, suspension bridge, and level crossing.",
      condition: "GOOD",
      category: "VEHICLES",
      priceFiat: 35.00,
      currency: "GBP",
      referencePriceFiat: 38.00,
      imageUrls: ["/toy_wooden_train_set_1786286043449.png"],
      tradeMethod: "MEETUP",
      location: "Kensington, London",
      sellerId: seller.id,
    },
  });

  console.log("Seeding complete! Added 3 sample toys.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
