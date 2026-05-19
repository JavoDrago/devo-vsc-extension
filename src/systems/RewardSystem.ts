import * as vscode from "vscode";
import { ALL_REWARDS, LevelReward } from "../data/rewards";

export class RewardSystem {
  private _onRewardUnlocked: (reward: LevelReward) => void;

  constructor(
    private _globalState: vscode.Memento,
    onRewardUnlocked: (reward: LevelReward) => void
  ) {
    this._onRewardUnlocked = onRewardUnlocked;
  }

  private _getUnlockedIds(): string[] {
    return this._globalState.get<string[]>("unlockedItems", []);
  }

  private async _saveUnlocked(ids: string[]) {
    await this._globalState.update("unlockedItems", ids);
  }

  checkForNewRewards(oldLevel: number, newLevel: number) {
    const unlocked = new Set(this._getUnlockedIds());

    for (let lvl = oldLevel + 1; lvl <= newLevel; lvl++) {
      const rewards = ALL_REWARDS.filter((r) => r.level === lvl);
      for (const reward of rewards) {
        if (!unlocked.has(reward.id)) {
          unlocked.add(reward.id);
          this._onRewardUnlocked(reward);
        }
      }
    }

    this._saveUnlocked([...unlocked]);
  }

  getUnlockedRewards(): LevelReward[] {
    const unlocked = new Set(this._getUnlockedIds());
    return ALL_REWARDS.filter((r) => unlocked.has(r.id));
  }

  getUnlockedFurniture(): LevelReward[] {
    return this.getUnlockedRewards().filter(
      (r) => r.type === "furniture" || r.type === "decoration"
    );
  }

  getCurrentTitle(level: number): string | null {
    const unlockedIds = new Set(this._getUnlockedIds());
    const titles = ALL_REWARDS.filter(
      (r) => r.type === "title" && unlockedIds.has(r.id) && r.level <= level
    );
    if (titles.length === 0) return null;
    return titles[titles.length - 1].name;
  }
}
