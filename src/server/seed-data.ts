/**
 * Source catalogue used by `npm run seed` and POST /api/seed.
 * Once seeded, MongoDB Atlas is the single source of truth — this file is only
 * a bootstrap fixture, nothing in the running app reads from it.
 */

import type { CategoryName } from "@/lib/types";

type ProductSeed = {
  slug: string;
  name: string;
  category: CategoryName;
  price: number;
  rating: number;
  sales: number;
  isNewRelease: boolean;
  image: string;
  gallery: string[];
  short: string;
  description: string;
  formats: string[];
  polygons: string;
  textures: string;
  fileSize: string;
  software: string[];
  features: string[];
};

type CategorySeed = { name: CategoryName; slug: string; count: number; image: string; order: number };

type CustomerSeed = {
  name: string;
  email: string;
  orders: number;
  spend: number;
  plan: "Indie" | "Pro" | "Studio";
};

const character = "/assets/hero-3d.jpg";
const weapon = "/assets/hero-3d.jpg";
const vehicle = "/assets/hero-3d.jpg";
const environment = "/assets/hero-3d.jpg";
const props = "/assets/hero-3d.jpg";
const creature = "/assets/hero-3d.jpg";

const base = {
  polygons: "42,500 tris",
  textures: "4096 x 4096 PBR",
  fileSize: "184 MB",
  software: ["Blender", "Unity", "Unreal Engine", "Maya"],
};

export const productSeed: ProductSeed[] = [
  {
    slug: "cyber-soldier",
    name: "CYBER SOLDIER",
    category: "Characters",
    price: 29,
    rating: 4.9,
    sales: 412,
    isNewRelease: true,
    image: character,
    gallery: [character, weapon, creature],
    short: "Rigged sci-fi infantry character with modular armour parts.",
    description:
      "A production-ready sci-fi soldier built for third-person and FPS projects. Clean quad topology, game-optimised silhouette and a fully rigged skeleton compatible with humanoid animation retargeting.",
    formats: ["FBX", "BLEND", "OBJ"],
    ...base,
    features: ["Rigged", "Game ready", "4K PBR textures", "LODs included"],
  },
  {
    slug: "plasma-carbine",
    name: "PLASMA CARBINE",
    category: "Weapons",
    price: 19,
    rating: 4.8,
    sales: 288,
    isNewRelease: true,
    image: weapon,
    gallery: [weapon, character, props],
    short: "Hard-surface energy rifle with animated emissive parts.",
    description:
      "Hard-surface weapon asset with separated moving parts for reload animation, baked normals and a clean UV layout for engine-ready import.",
    formats: ["FBX", "BLEND"],
    ...base,
    polygons: "18,200 tris",
    fileSize: "96 MB",
    features: ["Separated parts", "Emissive maps", "Game ready", "PBR materials"],
  },
  {
    slug: "outrider-4x4",
    name: "OUTRIDER 4X4",
    category: "Vehicles",
    price: 34,
    rating: 4.9,
    sales: 197,
    isNewRelease: false,
    image: vehicle,
    gallery: [vehicle, environment, props],
    short: "Stylized offroad truck with detachable wheels and interior.",
    description:
      "Drivable stylized 4x4 with separated wheels, steering pivot and a modelled interior. Ideal for arcade racers and open-world prototypes.",
    formats: ["FBX", "BLEND", "GLTF"],
    ...base,
    polygons: "56,900 tris",
    features: ["Separated wheels", "Interior modelled", "Game ready", "Clean topology"],
  },
  {
    slug: "skyward-village",
    name: "SKYWARD VILLAGE",
    category: "Environments",
    price: 59,
    rating: 5,
    sales: 143,
    isNewRelease: false,
    image: environment,
    gallery: [environment, props, vehicle],
    short: "Modular fantasy village kit with 40+ placeable pieces.",
    description:
      "A complete modular environment kit: houses, roofs, fences, paths and set dressing. Snap-friendly pivots let you assemble entire levels in minutes.",
    formats: ["FBX", "BLEND", "OBJ", "GLTF"],
    ...base,
    polygons: "310,000 tris",
    fileSize: "742 MB",
    features: ["Modular kit", "40+ meshes", "Trim-sheet textures", "Optimised"],
  },
  {
    slug: "survival-props-pack",
    name: "SURVIVAL PROPS PACK",
    category: "Props",
    price: 24,
    rating: 4.7,
    sales: 356,
    isNewRelease: false,
    image: props,
    gallery: [props, environment, weapon],
    short: "Crates, barrels and lanterns for dungeon and loot scenes.",
    description:
      "Twenty-four hand-crafted props sharing a single atlas texture, keeping draw calls low while filling out any scene with believable detail.",
    formats: ["FBX", "BLEND", "OBJ"],
    ...base,
    polygons: "24,300 tris",
    fileSize: "128 MB",
    features: ["Shared atlas", "24 meshes", "Game ready", "Low draw calls"],
  },
  {
    slug: "abyss-wyrmling",
    name: "ABYSS WYRMLING",
    category: "Creatures",
    price: 39,
    rating: 4.9,
    sales: 221,
    isNewRelease: true,
    image: creature,
    gallery: [creature, character, environment],
    short: "Rigged flying creature with 6 baked animation clips.",
    description:
      "A stylized winged creature with a game-ready rig and six baked clips: idle, fly, attack, hit, death and roar. Blend shapes included for facial expression.",
    formats: ["FBX", "BLEND"],
    ...base,
    features: ["Rigged + animated", "6 clips", "Blend shapes", "4K PBR textures"],
  },
  {
    slug: "vanguard-mech",
    name: "VANGUARD MECH",
    category: "Characters",
    price: 49,
    rating: 4.8,
    sales: 164,
    isNewRelease: false,
    image: character,
    gallery: [character, weapon, vehicle],
    short: "Heavy assault mech with modular loadout attachments.",
    description:
      "Modular mech chassis with swappable arm loadouts, clean panel-line normals and engine-ready material setup.",
    formats: ["FBX", "BLEND", "OBJ"],
    ...base,
    polygons: "88,400 tris",
    features: ["Modular loadout", "Rigged", "Game ready", "4K PBR textures"],
  },
  {
    slug: "ruin-gate-kit",
    name: "RUIN GATE KIT",
    category: "Environments",
    price: 44,
    rating: 4.7,
    sales: 132,
    isNewRelease: false,
    image: environment,
    gallery: [environment, props, creature],
    short: "Ancient stone gate and rubble set for dark fantasy levels.",
    description:
      "Weathered stone architecture with vertex-blend friendly materials, ready to drop into dark fantasy and souls-like environments.",
    formats: ["FBX", "BLEND", "GLTF"],
    ...base,
    polygons: "140,000 tris",
    features: ["Modular", "Vertex blend ready", "Optimised", "PBR materials"],
  },
];

export const categorySeed: CategorySeed[] = [
  { name: "Characters", slug: "characters", count: 128, image: character, order: 1 },
  { name: "Weapons", slug: "weapons", count: 96, image: weapon, order: 2 },
  { name: "Vehicles", slug: "vehicles", count: 74, image: vehicle, order: 3 },
  { name: "Environments", slug: "environments", count: 112, image: environment, order: 4 },
  { name: "Props", slug: "props", count: 210, image: props, order: 5 },
  { name: "Creatures", slug: "creatures", count: 68, image: creature, order: 6 },
];

export const customerSeed: CustomerSeed[] = [
  { name: "Alex Mercer", email: "alex@studio.com", orders: 12, spend: 384, plan: "Studio" },
  { name: "Sara Khan", email: "sara@pixelforge.io", orders: 8, spend: 246, plan: "Indie" },
  { name: "Kenji Ito", email: "kenji@nightowl.jp", orders: 21, spend: 902, plan: "Studio" },
  { name: "Mila Novak", email: "mila@voxelworks.eu", orders: 4, spend: 118, plan: "Indie" },
  { name: "Tom Reed", email: "tom@reedgames.co", orders: 15, spend: 571, plan: "Pro" },
];
