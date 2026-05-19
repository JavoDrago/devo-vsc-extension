import * as vscode from "vscode";
import * as fs from "fs";
import {
  GameState,
  ExtensionMessage,
  WebviewMessage,
  XpUpdatePayload,
  LevelUpPayload,
  BuyResultPayload,
  ItemPosition,
} from "../shared/types";
import { LevelReward } from "../data/rewards";
import { ShopSystem } from "../systems/ShopSystem";

export class RoomViewProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;
  private _getTitle: (level: number) => string | null = () => null;
  private _onReset: (() => void) | null = null;
  private _onXpChanged: (() => void) | null = null;
  private _shopSystem: ShopSystem;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _globalState: vscode.Memento
  ) {
    this._shopSystem = new ShopSystem(_globalState);
  }

  setTitleResolver(fn: (level: number) => string | null) {
    this._getTitle = fn;
  }

  setOnReset(fn: () => void) {
    this._onReset = fn;
  }

  setOnXpChanged(fn: () => void) {
    this._onXpChanged = fn;
  }

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this._extensionUri, "out", "webview"),
      ],
    };

    webviewView.webview.html = this._getHtml(webviewView.webview);

    webviewView.webview.onDidReceiveMessage((message: WebviewMessage) => {
      switch (message.type) {
        case "ready":
          this._sendState();
          break;
        case "createCharacter":
          this._handleCreateCharacter(message.payload || "");
          break;
        case "shopBuy":
          this._handleBuy(message.payload);
          break;
        case "saveLayout":
        case "saveItemPositions":
          this._handleSaveLayout(message.payload);
          break;
        case "saveGameMode":
          this._handleSaveGameMode(message.payload);
          break;
        case "resetGame":
          this._handleReset();
          break;
        case "log":
          console.log("[Devo Webview]", message.payload);
          break;
      }
    });
  }

  sendLevelUp(newLevel: number, rewards: LevelReward[]) {
    if (!this._view) return;
    const payload: LevelUpPayload = {
      newLevel,
      rewards: rewards.map((r) => ({ id: r.id, name: r.name, type: r.type })),
    };
    const msg: ExtensionMessage = { type: "levelUp", payload };
    this._view.webview.postMessage(msg);
  }

  sendXpUpdate(amount: number, totalXp: number, level: number) {
    if (!this._view) return;
    const xpForNext = this._xpRequired(level);
    const payload: XpUpdatePayload = { amount, totalXp, level, xpForNext };
    const msg: ExtensionMessage = { type: "xpUpdate", payload };
    this._view.webview.postMessage(msg);
  }

  private async _handleBuy(payload: { itemId: string }) {
    if (!this._view) return;
    const currentXp = this._globalState.get<number>("xp", 0);
    const currentLevel = this._globalState.get<number>("level", 1);
    const result = await this._shopSystem.buy(payload.itemId, currentXp, currentLevel);

    const msg: ExtensionMessage = {
      type: "buyResult",
      payload: { ...result, itemId: payload.itemId },
    };
    this._view.webview.postMessage(msg);

    if (result.success) {
      this._onXpChanged?.();
      // Sync XP after deduction via xpUpdate instead of full init
      const xpForNext = this._xpRequired(currentLevel);
      const xpMsg: ExtensionMessage = {
        type: "xpUpdate",
        payload: { amount: 0, totalXp: result.newXp!, level: currentLevel, xpForNext },
      };
      this._view.webview.postMessage(xpMsg);
    }
  }

  private async _handleSaveGameMode(mode: string) {
    await this._globalState.update("gameMode", mode);
  }

  private async _handleReset() {
    const keys = ["xp", "level", "furniture", "unlockedItems", "shopInventory", "roomLayout", "gameMode"];
    for (const key of keys) {
      await this._globalState.update(key, undefined);
    }
    this._onReset?.();
    this._sendState();
  }

  private async _handleSaveLayout(payload: { roomLayout: { [itemId: string]: ItemPosition } }) {
    await this._globalState.update("roomLayout", payload.roomLayout);
  }

  private _xpRequired(level: number): number {
    return Math.floor(50 + 15 * Math.pow(level, 1.5));
  }

  private async _handleCreateCharacter(name: string) {
    await this._globalState.update("characterName", name);
    this._sendState();
  }

  private _sendState() {
    if (!this._view) return;
    const state = this._loadState();
    const msg: ExtensionMessage = { type: "init", payload: state };
    this._view.webview.postMessage(msg);
  }

  private _loadState(): GameState {
    const level = this._globalState.get<number>("level", 1);
    return {
      xp: this._globalState.get<number>("xp", 0),
      level,
      characterName: this._globalState.get<string>("characterName", ""),
      furniture: this._globalState.get<string[]>("furniture", []),
      unlockedItems: this._globalState.get<string[]>("unlockedItems", []),
      currentTitle: this._getTitle(level),
      shopInventory: this._globalState.get<string[]>("shopInventory", []),
      roomLayout: this._globalState.get<{ [itemId: string]: ItemPosition }>("roomLayout", {}),
      gameMode: this._globalState.get<string>("gameMode", "placement"),
    };
  }

  async reset() {
    if (!this._view) return;
    const keys = ["xp", "level", "characterName", "furniture", "unlockedItems", "shopInventory", "roomLayout", "gameMode"];
    for (const key of keys) {
      await this._globalState.update(key, undefined);
    }
    this._sendState();
  }

  private _getHtml(webview: vscode.Webview): string {
    const indexPath = vscode.Uri.joinPath(
      this._extensionUri,
      "out",
      "webview",
      "index.html"
    );

    let html = fs.readFileSync(indexPath.fsPath, "utf8");

    html = html.replace(
      /(src|href)="\.\/(assets\/[^"]+)"/g,
      (_match, attr, assetPath: string) => {
        const uri = vscode.Uri.joinPath(
          this._extensionUri,
          "out",
          "webview",
          assetPath
        );
        return `${attr}="${webview.asWebviewUri(uri)}"`;
      }
    );

    const csp = [
      `default-src 'none'`,
      `script-src 'unsafe-eval' ${webview.cspSource}`,
      `style-src ${webview.cspSource} 'unsafe-inline'`,
      `img-src ${webview.cspSource} data: blob:`,
      `connect-src ${webview.cspSource}`,
    ].join("; ");

    html = html.replace(
      "<head>",
      `<head>\n  <meta http-equiv="Content-Security-Policy" content="${csp}">`
    );

    return html;
  }
}
