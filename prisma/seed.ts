import "dotenv/config";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const DB_PATH = `file:${path.resolve("prisma/dev.db")}`;

async function main() {
  const adapter = new PrismaLibSql({ url: DB_PATH });
  const prisma = new PrismaClient({ adapter });

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
  await prisma.user.upsert({
    where: { joyIdAddress: "ckt1qzda0crj2v64chvj3g0cj2v64chvj3g0cj2v64chvj3g0cj2v64chvj3g1" },
    update: {},
    create: {
      id: "cmslwc9bl0001oerq542iln7o",
      joyIdAddress: "ckt1qzda0crj2v64chvj3g0cj2v64chvj3g0cj2v64chvj3g0cj2v64chvj3g1",
      displayName: "Active Parent Trader",
      region: "UK",
    },
  });

  console.log(`Created seller: ${seller.displayName}`);

  // Wipe existing listings before re-seeding to avoid duplicates
  await prisma.listing.deleteMany({});

  // 3. Create Sample Listings with correct image paths
  await prisma.listing.create({
    data: {
      title: "LEGO Star Wars Millennium Falcon #75192",
      description: "Ultimate Collector Series Millennium Falcon. Complete set with original box and instructions. Never played with.",
      condition: "LIKE_NEW",
      category: "BUILDING_SETS",
      priceFiat: 150.00,
      currency: "GBP",
      referencePriceFiat: 145.00,
      imageUrls: JSON.stringify(["/assets/lego_falcon.png"]),
      tradeMethod: "MEETUP",
      location: "Hammersmith, London",
      shippingRegion: "UK",
      sellerId: seller.id,
    },
  });

  await prisma.listing.create({
    data: {
      title: "GAN 11 M Pro Rubik's Speed Cube",
      description: "Premium magnetic speed cube. Turns super smooth. Includes extra tensioning magnets and core tools.",
      condition: "GOOD",
      category: "PUZZLES",
      priceFiat: 25.00,
      currency: "GBP",
      referencePriceFiat: 24.50,
      imageUrls: JSON.stringify(["/assets/rubiks_cube.png"]),
      tradeMethod: "BOTH",
      location: "Richmond, London",
      shippingRegion: "UK",
      sellerId: seller.id,
    },
  });

  await prisma.listing.create({
    data: {
      title: "Wooden Train Set 80-Piece",
      description: "Solid birch track layout with engine, magnetic passenger carriages, suspension bridge, and level crossing.",
      condition: "GOOD",
      category: "VEHICLES",
      priceFiat: 35.00,
      currency: "GBP",
      referencePriceFiat: 38.00,
      imageUrls: JSON.stringify(["/assets/wooden_train.png"]),
      tradeMethod: "MEETUP",
      location: "Kensington, London",
      shippingRegion: "UK",
      sellerId: seller.id,
    },
  });

  console.log("Seeding complete! Added 3 sample toy listings with correct image paths.");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
