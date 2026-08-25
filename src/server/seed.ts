/**
 * Seeds MongoDB Atlas with the starter catalogue and the admin account.
 *
 *   npm run seed
 *
 * Safe to re-run: every write is an idempotent upsert, so existing orders,
 * complaints and contact messages are never touched.
 */
import { config } from "dotenv";
import path from "node:path";

// Load .env.local first (Next's own precedence), then .env as a fallback.
config({ path: path.resolve(process.cwd(), ".env.local") });
config({ path: path.resolve(process.cwd(), ".env") });

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

import { connectToDatabase } from "@/lib/mongodb";
import { Product } from "@/models/Product";
import { Category } from "@/models/Category";
import { Customer } from "@/models/Customer";
import { AdminUser } from "@/models/AdminUser";
import { categorySeed, customerSeed, productSeed } from "@/server/seed-data";

async function seed() {
  console.log("→ Connecting to MongoDB Atlas…");
  await connectToDatabase();
  console.log("✓ Connected");

  const productResult = await Product.bulkWrite(
    productSeed.map((p) => ({
      updateOne: { filter: { slug: p.slug }, update: { $set: p }, upsert: true },
    })),
  );
  console.log(
    `✓ Products  — ${productResult.upsertedCount} inserted, ${productResult.modifiedCount} updated`,
  );

  const categoryResult = await Category.bulkWrite(
    categorySeed.map((c) => ({
      updateOne: { filter: { slug: c.slug }, update: { $set: c }, upsert: true },
    })),
  );
  console.log(
    `✓ Categories — ${categoryResult.upsertedCount} inserted, ${categoryResult.modifiedCount} updated`,
  );

  const customerResult = await Customer.bulkWrite(
    customerSeed.map((c) => ({
      updateOne: {
        filter: { email: c.email.toLowerCase() },
        // $setOnInsert only: never overwrite live spend/order totals on re-seed.
        update: { $setOnInsert: { ...c, email: c.email.toLowerCase() } },
        upsert: true,
      },
    })),
  );
  console.log(`✓ Customers — ${customerResult.upsertedCount} inserted`);

  const email = (process.env.ADMIN_EMAIL ?? "admin@oneupgaming.studio").toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!password || password.length < 8) {
    throw new Error("ADMIN_PASSWORD must be set in .env.local and be at least 8 characters.");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await AdminUser.updateOne(
    { email },
    { $set: { passwordHash, name: "Administrator", role: "admin" } },
    { upsert: true },
  );
  console.log(`✓ Admin     — ${email} (password taken from ADMIN_PASSWORD)`);

  await mongoose.disconnect();
  console.log("\nDone. Start the app with `npm run dev` and sign in at /admin/login");
}

seed().catch(async (error) => {
  console.error("\n✗ Seed failed:\n", error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
