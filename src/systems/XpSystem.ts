import * as vscode from "vscode";
import { RewardSystem } from "./RewardSystem";
import { LevelReward } from "../data/rewards";

const WORD_TIMEOUT_MS = 3000;
const MAX_WORDS_PER_MINUTE = 60;

export class XpSystem {
  private _xp: number;
  private _level: number;
  private _rewardSystem: RewardSystem;
  private _onXpGained: (amount: number, totalXp: number, level: number) => void;
  private _onLevelUp?: (newLevel: number, rewards: LevelReward[]) => void;
  private _wordTimestamps: Map<string, number> = new Map();
  private _recentWordCount: number = 0;
  private _wordCountStart: number = Date.now();
  private _activeTimeSeconds: number = 0;
  private _activityTimers: vscode.Disposable[] = [];

  constructor(
    private _globalState: vscode.Memento,
    onXpGained: (amount: number, totalXp: number, level: number) => void,
    onLevelUp?: (newLevel: number, rewards: LevelReward[]) => void
  ) {
    this._xp = _globalState.get<number>("xp", 0);
    this._level = _globalState.get<number>("level", 1);
    this._onXpGained = onXpGained;
    this._onLevelUp = onLevelUp;
    this._rewardSystem = new RewardSystem(_globalState, (_reward) => {});
    this._rewardSystem.checkForNewRewards(0, this._level);
  }

  get xp() { return this._xp; }
  get level() { return this._level; }
  get xpForNextLevel(): number { return this.xpRequiredForLevel(this._level); }
  get rewardSystem() { return this._rewardSystem; }

  xpRequiredForLevel(level: number): number {
    return Math.floor(50 + 15 * Math.pow(level, 1.5));
  }

  startListening() {
    this._activityTimers.push(
      vscode.workspace.onDidChangeTextDocument((e) => {
        if (e.document.uri.scheme !== "file") return;
        this._processTextChange(e);
      })
    );

    this._activityTimers.push(
      vscode.workspace.onDidSaveTextDocument((doc) => {
        if (doc.uri.scheme !== "file") return;
        this._addXp(5, "save");
      })
    );

    this._activityTimers.push(
      vscode.workspace.onDidCreateFiles(() => {
        this._addXp(10, "create");
      })
    );

    const activeTimer = setInterval(() => {
      this._activeTimeSeconds++;
      if (this._activeTimeSeconds >= 60) {
        this._activeTimeSeconds = 0;
        this._addXp(1, "time");
      }
    }, 1000);

    this._activityTimers.push(
      { dispose: () => clearInterval(activeTimer) }
    );
  }

  private _processTextChange(e: vscode.TextDocumentChangeEvent) {
    for (const change of e.contentChanges) {
      const text = change.text;
      if (!text || text.length === 0) continue;

      const words = text.split(/[\s\n\r]+/).filter((w) =>
        this._isValidWord(w)
      );

      for (const word of words) {
        if (this._isSpam(word)) continue;
        this._addXp(1, "word");
      }
    }
  }

  private _isValidWord(word: string): boolean {
    if (word.length === 0) return false;
    if (/^[^a-zA-Z0-9_]+$/.test(word)) return false;
    if (/^(.)\1{2,}$/.test(word)) return false;
    return true;
  }

  private _isSpam(word: string): boolean {
    const now = Date.now();
    const lastSeen = this._wordTimestamps.get(word);

    if (lastSeen && now - lastSeen < WORD_TIMEOUT_MS) {
      return true;
    }

    this._wordTimestamps.set(word, now);
    if (this._wordTimestamps.size > 200) {
      const oldest = Date.now() - 10000;
      for (const [key, ts] of this._wordTimestamps) {
        if (ts < oldest) this._wordTimestamps.delete(key);
      }
    }

    if (now - this._wordCountStart > 60000) {
      this._wordCountStart = now;
      this._recentWordCount = 0;
    }
    this._recentWordCount++;
    if (this._recentWordCount > MAX_WORDS_PER_MINUTE) {
      return true;
    }

    return false;
  }

  private _addXp(amount: number, _source: string) {
    const oldLevel = this._level;
    this._xp += amount;
    this._checkLevelUp();

    if (this._level > oldLevel) {
      this._rewardSystem.checkForNewRewards(oldLevel, this._level);
      if (this._onLevelUp) {
        const newRewards = this._rewardSystem.getUnlockedRewards().filter(
          (r) => r.level > oldLevel && r.level <= this._level
        );
        this._onLevelUp(this._level, newRewards);
      }
    }

    this._save();
    this._onXpGained(amount, this._xp, this._level);
  }

  private _checkLevelUp() {
    const required = this.xpRequiredForLevel(this._level);
    if (this._xp >= required && this._level < 100) {
      this._level++;
      this._checkLevelUp();
    }
  }

  reset() {
    this._xp = 0;
    this._level = 1;
    this._recentWordCount = 0;
    this._activeTimeSeconds = 0;
    this._wordTimestamps.clear();
  }

  sync() {
    this._xp = this._globalState.get<number>("xp", 0);
    this._level = this._globalState.get<number>("level", 1);
  }

  private _save() {
    this._globalState.update("xp", this._xp);
    this._globalState.update("level", this._level);
  }

  dispose() {
    for (const d of this._activityTimers) d.dispose();
  }
}
