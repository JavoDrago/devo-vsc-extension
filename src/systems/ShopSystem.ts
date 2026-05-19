import * as vscode from "vscode";
import { ALL_ITEMS } from "../data/items";

export class ShopSystem {
  constructor(
    private _globalState: vscode.Memento
  ) {}

  private _getInventory(): string[] {
    return this._globalState.get<string[]>("shopInventory", []);
  }

  async buy(itemId: string, currentXp: number, _currentLevel: number): Promise<{ success: boolean; newXp?: number; error?: string }> {
    const item = ALL_ITEMS.find((i) => i.id === itemId);
    if (!item) return { success: false, error: "Item not found" };

    const inventory = this._getInventory();
    if (inventory.includes(itemId)) {
      return { success: false, error: "Already owned" };
    }

    if (currentXp < item.price) {
      return { success: false, error: "Not enough XP" };
    }

    const newXp = currentXp - item.price;
    inventory.push(itemId);

    await this._globalState.update("shopInventory", inventory);
    await this._globalState.update("xp", newXp);

    return { success: true, newXp };
  }
}
