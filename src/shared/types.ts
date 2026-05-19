export type ItemCategory = "furniture" | "decoration" | "special";

export interface ItemPosition {
  x: number;
  y: number;
}

export interface GameState {
  xp: number;
  level: number;
  characterName: string;
  furniture: string[];
  unlockedItems: string[];
  currentTitle: string | null;
  shopInventory: string[];
  roomLayout: { [itemId: string]: ItemPosition };
  gameMode: string;
}

export interface ExtensionMessage {
  type: "init" | "stateUpdate" | "xpUpdate" | "levelUp" | "buyResult" | "layoutUpdate";
  payload: GameState | XpUpdatePayload | LevelUpPayload | BuyResultPayload | LayoutUpdatePayload;
}

export interface XpUpdatePayload {
  amount: number;
  totalXp: number;
  level: number;
  xpForNext: number;
}

export interface LevelUpPayload {
  newLevel: number;
  rewards: { id: string; name: string; type: string }[];
}

export interface BuyResultPayload {
  success: boolean;
  itemId?: string;
  newXp?: number;
  error?: string;
}

export interface LayoutUpdatePayload {
  roomLayout: { [itemId: string]: ItemPosition };
}

export interface ShopItemData {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  levelRequired: number;
  preview: string;
}

export interface WebviewMessage {
  type: "ready" | "createCharacter" | "log" | "shopBuy" | "saveLayout" | "saveItemPositions" | "saveGameMode" | "placeItem" | "removeItem" | "resetGame";
  payload?: any;
}
