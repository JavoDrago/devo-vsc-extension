export type ItemCategory = "furniture" | "decoration" | "special";

export interface ItemDef {
  id: string;
  name: string;
  category: ItemCategory;
  price: number;
  levelRequired: number;
  spriteFile: string;
  defaultX: number;
  defaultY: number;
}

export const ALL_ITEMS: ItemDef[] = [
  { id: "item_boss", name: "Boss Figurine", category: "decoration", price: 60, levelRequired: 3, spriteFile: "boss.png", defaultX: 240, defaultY: 170 },
  { id: "item_cabinet", name: "Office Cabinet", category: "furniture", price: 80, levelRequired: 3, spriteFile: "cabinet.png", defaultX: 260, defaultY: 200 },
  { id: "item_chair", name: "Chair", category: "furniture", price: 30, levelRequired: 1, spriteFile: "Chair.png", defaultX: 130, defaultY: 200 },
  { id: "item_coffee_maker", name: "Coffee Maker", category: "decoration", price: 40, levelRequired: 2, spriteFile: "coffee-maker.png", defaultX: 200, defaultY: 180 },
  { id: "item_desk", name: "Desk", category: "furniture", price: 50, levelRequired: 1, spriteFile: "desk.png", defaultX: 160, defaultY: 185 },
  { id: "item_desk_pc", name: "Desk with PC", category: "furniture", price: 100, levelRequired: 4, spriteFile: "desk-with-pc.png", defaultX: 160, defaultY: 185 },
  { id: "item_partitions_1", name: "Office Partitions 1", category: "furniture", price: 70, levelRequired: 3, spriteFile: "office-partitions-1.png", defaultX: 160, defaultY: 170 },
  { id: "item_partitions_2", name: "Office Partitions 2", category: "furniture", price: 70, levelRequired: 3, spriteFile: "office-partitions-2.png", defaultX: 160, defaultY: 170 },
  { id: "item_partitions_3", name: "Office Partitions 3", category: "furniture", price: 70, levelRequired: 3, spriteFile: "op1-2.png", defaultX: 160, defaultY: 170 },
  { id: "item_partitions_4", name: "Office Partitions 4", category: "furniture", price: 70, levelRequired: 3, spriteFile: "op1-3.png", defaultX: 160, defaultY: 170 },
  { id: "item_partitions_5", name: "Office Partitions 5", category: "furniture", price: 70, levelRequired: 3, spriteFile: "op1-4.png", defaultX: 160, defaultY: 170 },
  { id: "item_partitions_6", name: "Office Partitions 6", category: "furniture", price: 70, levelRequired: 3, spriteFile: "op1-5.png", defaultX: 160, defaultY: 170 },
  { id: "item_partitions_7", name: "Office Partitions 7", category: "furniture", price: 70, levelRequired: 3, spriteFile: "op1-6.png", defaultX: 160, defaultY: 170 },
  { id: "item_pc1", name: "PC Setup 1", category: "furniture", price: 80, levelRequired: 2, spriteFile: "PC1.png", defaultX: 170, defaultY: 180 },
  { id: "item_pc2", name: "PC Setup 2", category: "furniture", price: 90, levelRequired: 3, spriteFile: "PC2.png", defaultX: 170, defaultY: 180 },
  { id: "item_plant", name: "Plant", category: "decoration", price: 25, levelRequired: 1, spriteFile: "plant.png", defaultX: 120, defaultY: 185 },
  { id: "item_printer", name: "Printer", category: "furniture", price: 60, levelRequired: 2, spriteFile: "printer.png", defaultX: 220, defaultY: 200 },
  { id: "item_sink", name: "Sink", category: "decoration", price: 45, levelRequired: 2, spriteFile: "sink.png", defaultX: 100, defaultY: 195 },
  { id: "item_stamping_table", name: "Stamping Table", category: "furniture", price: 55, levelRequired: 2, spriteFile: "stamping-table.png", defaultX: 200, defaultY: 190 },
  { id: "item_trash", name: "Trash Can", category: "decoration", price: 15, levelRequired: 1, spriteFile: "Trash.png", defaultX: 230, defaultY: 210 },
  { id: "item_water_cooler", name: "Water Cooler", category: "decoration", price: 50, levelRequired: 2, spriteFile: "water-cooler.png", defaultX: 90, defaultY: 190 },
  { id: "item_worker1", name: "Worker 1", category: "special", price: 120, levelRequired: 5, spriteFile: "worker1.png", defaultX: 140, defaultY: 195 },
  { id: "item_worker2", name: "Worker 2", category: "special", price: 120, levelRequired: 5, spriteFile: "worker2.png", defaultX: 180, defaultY: 195 },
  { id: "item_worker4", name: "Worker 3", category: "special", price: 120, levelRequired: 5, spriteFile: "worker4.png", defaultX: 160, defaultY: 195 },
  { id: "item_writing_table", name: "Writing Table", category: "furniture", price: 45, levelRequired: 1, spriteFile: "writing-table.png", defaultX: 140, defaultY: 190 },
];

export function getItemById(id: string): ItemDef | undefined {
  return ALL_ITEMS.find(i => i.id === id);
}
