export type ShopCategory = "furniture" | "decoration" | "special";

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  category: ShopCategory;
  price: number;
  levelRequired: number;
  preview: string;
}

export const SHOP_ITEMS: ShopItem[] = [
  // Furniture (5)
  {
    id: "shop_desk_black",
    name: "Dark Desk",
    description: "A sleek black desk for late night coding",
    category: "furniture",
    price: 30,
    levelRequired: 1,
    preview: "desk",
  },
  {
    id: "shop_chair_red",
    name: "Red Gaming Chair",
    description: "Ergonomic gaming chair in cyber red",
    category: "furniture",
    price: 50,
    levelRequired: 2,
    preview: "basic_chair",
  },
  {
    id: "shop_monitor_wide",
    name: "Wide Monitor",
    description: "Ultrawide display for maximum code",
    category: "furniture",
    price: 100,
    levelRequired: 3,
    preview: "monitor",
  },
  {
    id: "shop_shelf_grid",
    name: "Grid Shelf",
    description: "Wall shelf for your collectibles",
    category: "furniture",
    price: 70,
    levelRequired: 4,
    preview: "bookshelf",
  },
  {
    id: "shop_cable_box",
    name: "Cable Management Box",
    description: "Hide those messy cables",
    category: "furniture",
    price: 40,
    levelRequired: 2,
    preview: "basic_chair",
  },

  // Decorations (5)
  {
    id: "shop_poster_cyber",
    name: "Cyberpunk Poster",
    description: "A glowing neon cityscape poster",
    category: "decoration",
    price: 25,
    levelRequired: 1,
    preview: "neonsign",
  },
  {
    id: "shop_plant_glow",
    name: "Glow Plant",
    description: "A bioluminescent succulent",
    category: "decoration",
    price: 45,
    levelRequired: 2,
    preview: "potted_plant",
  },
  {
    id: "shop_led_strip",
    name: "LED Strip",
    description: "RGB lighting for your room",
    category: "decoration",
    price: 60,
    levelRequired: 3,
    preview: "neonsign",
  },
  {
    id: "shop_mug_code",
    name: "Code Mug",
    description: "Coffee mug with syntax errors",
    category: "decoration",
    price: 15,
    levelRequired: 1,
    preview: "potted_plant",
  },
  {
    id: "shop_fan_mini",
    name: "Mini USB Fan",
    description: "Keep cool while compiling",
    category: "decoration",
    price: 35,
    levelRequired: 2,
    preview: "lamp",
  },

  // Special (2)
  {
    id: "shop_hologram_display",
    name: "Hologram Display",
    description: "Floating 3D holographic display",
    category: "special",
    price: 200,
    levelRequired: 5,
    preview: "neonsign",
  },
  {
    id: "shop_neon_avatar",
    name: "Neon Avatar Frame",
    description: "A glowing aura around your avatar",
    category: "special",
    price: 300,
    levelRequired: 8,
    preview: "lamp",
  },
];
