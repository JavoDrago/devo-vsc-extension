export type RewardType = "title" | "furniture" | "decoration";

export interface LevelReward {
  level: number;
  type: RewardType;
  id: string;
  name: string;
}

const TITLES: string[] = [
  "Junior Coder",
  "Script Runner",
  "Bug Hunter",
  "Code Monkey",
  "Stack Overflow",
  "Byte Wrangler",
  "Logic Walker",
  "Syntax Seeker",
  "Loop Master",
  "Kernel Whisperer",
  "Variable Wizard",
  "Debug Sage",
  "API Caller",
  "Memory Pilot",
  "Daemon Spawner",
  "Thread Weaver",
  "Pixel Knight",
  "Cache Raider",
  "Lambda Seer",
  "Recursion King",
  "Neon Hacker",
  "Data Drifter",
  "Cyber Monk",
  "Glitch Walker",
  "Nano Smith",
  "Binary Bard",
  "Signal Rider",
  "Void Walker",
  "Core Runner",
  "Code Shinobi",
  "Pixel Alchemist",
  "Logic Phantom",
  "Syntax Mage",
  "Bug Exorcist",
  "Stack Titan",
  "Loop Prophet",
  "Dev Ops",
  "Root Access",
  "Mainframe Hero",
  "Zero Day",
  "Node Ruler",
  "Array Emperor",
  "Cloud Breaker",
  "Firewall Walker",
  "Kernel God",
  "Sudo Lord",
  "ASCII Warrior",
  "Daemon King",
  "Cyber Saint",
  "Phantom Coder",
];

const FURNITURE_ITEMS: { type: RewardType; id: string; name: string }[] = [
  { type: "furniture", id: "basic_chair", name: "Basic Chair" },
  { type: "furniture", id: "desk", name: "Desk" },
  { type: "furniture", id: "monitor", name: "Extra Monitor" },
  { type: "decoration", id: "potted_plant", name: "Potted Plant" },
  { type: "furniture", id: "bookshelf", name: "Bookshelf" },
  { type: "furniture", id: "mechanical_keyboard", name: "Mechanical Keyboard" },
  { type: "decoration", id: "neonsign", name: "Neon Sign" },
  { type: "furniture", id: "lamp", name: "Cyber Lamp" },
  { type: "decoration", id: "poster", name: "Code Poster" },
  { type: "furniture", id: "server_rack", name: "Server Rack" },
  { type: "decoration", id: "hologram", name: "Hologram" },
  { type: "furniture", id: "beanbag", name: "Beanbag" },
  { type: "furniture", id: "drawing_tablet", name: "Drawing Tablet" },
  { type: "decoration", id: "rgb_strip", name: "RGB Strip" },
  { type: "furniture", id: "second_monitor", name: "Second Monitor" },
  { type: "decoration", id: "action_figure", name: "Action Figure" },
  { type: "furniture", id: "mini_fridge", name: "Mini Fridge" },
  { type: "furniture", id: "coffee_machine", name: "Coffee Machine" },
  { type: "decoration", id: "neon_plant", name: "Neon Plant" },
  { type: "furniture", id: "hammock", name: "Hammock" },
  { type: "furniture", id: "whiteboard", name: "Whiteboard" },
  { type: "decoration", id: "led_grid", name: "LED Grid" },
  { type: "furniture", id: "arcade_machine", name: "Arcade Machine" },
  { type: "decoration", id: "cyber_art", name: "Cyber Art" },
  { type: "furniture", id: "standing_desk", name: "Standing Desk" },
  { type: "decoration", id: "lava_lamp", name: "Lava Lamp" },
  { type: "furniture", id: "projector", name: "Holographic Projector" },
  { type: "furniture", id: "sound_system", name: "Sound System" },
  { type: "decoration", id: "trophy", name: "Gold Trophy" },
  { type: "furniture", id: "throne_chair", name: "Throne Chair" },
];

export function generateRewards(): LevelReward[] {
  const rewards: LevelReward[] = [];

  let titleIndex = 0;
  let furnitureIndex = 0;

  for (let level = 1; level <= 100; level++) {
    if (level % 2 === 0 && titleIndex < TITLES.length) {
      rewards.push({
        level,
        type: "title",
        id: `title_${level}`,
        name: TITLES[titleIndex++],
      });
    } else if (furnitureIndex < FURNITURE_ITEMS.length) {
      const item = FURNITURE_ITEMS[furnitureIndex++];
      rewards.push({ level, ...item });
    } else if (titleIndex < TITLES.length) {
      rewards.push({
        level,
        type: "title",
        id: `title_${level}`,
        name: TITLES[titleIndex++],
      });
    } else {
      rewards.push({
        level,
        type: "title",
        id: `title_${level}`,
        name: `Level ${level} Veteran`,
      });
    }
  }

  return rewards;
}

export const ALL_REWARDS = generateRewards();

export function getRewardsForLevel(level: number): LevelReward[] {
  return ALL_REWARDS.filter((r) => r.level === level);
}
