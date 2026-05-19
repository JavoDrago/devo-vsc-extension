import Phaser from "phaser";
import { ExtensionMessage, XpUpdatePayload, LevelUpPayload, LayoutUpdatePayload, ItemPosition } from "../../shared/types";
import { Avatar } from "../entities/Avatar";
import { IsometricRenderer } from "../systems/IsometricRenderer";
import { XpDisplay } from "../systems/XpDisplay";
import { FurnitureRenderer } from "../systems/FurnitureRenderer";
import { TitleDisplay } from "../systems/TitleDisplay";
import { ALL_ITEMS } from "../../data/items";
import { ITEM_IMAGE_URLS } from "../systems/ItemAssets";
import avatarUrl from "../../webview/assets/Avatar.png";
import messagesData from "../../webview/assets/messages.json";

const BASE_W = 320;
const BASE_H = 240;
const ROOM_ROWS = 5;
const ROOM_COLS = 5;
const TILE_W = 32;
const TILE_H = 16;
const WALKABLE_PADDING = 6;
const WALKABLE_POINT_STEP = 6;
const BASE_FLOOR_POLY = [
  { x: 0, y: 0 },
  { x: BASE_W, y: 0 },
  { x: BASE_W, y: BASE_H },
  { x: 0, y: BASE_H },
];

export class RoomScene extends Phaser.Scene {
  private avatar!: Avatar;
  private iso!: IsometricRenderer;
  private xpDisplay!: XpDisplay;
  private furnitureRenderer!: FurnitureRenderer;
  private titleDisplay!: TitleDisplay;
  private walkableTiles: { x: number; y: number }[] = [];
  private avatarFootRadius = 8;
  private avatarTileX = 2;
  private avatarTileY = 2;
  private moveTimer!: Phaser.Time.TimerEvent;
  private currentXp = 0;
  private currentLevel = 1;
  private xpForNext = 65;
  private roomLayout: { [itemId: string]: ItemPosition } = {};
  private currentTitle: string | null = null;
  private floorPoly: { x: number; y: number }[] = [];
  private baseFloorPoly: { x: number; y: number }[] = BASE_FLOOR_POLY;
  private bubbleBg: Phaser.GameObjects.Graphics;
  private bubbleText: Phaser.GameObjects.Text;
  private bubbleTimer: Phaser.Time.TimerEvent | null = null;
  private messageList: { type: string; text: string }[] = [];
  private gridCells: { x: number; y: number }[] = [];
  private paintedCells: boolean[] = [];
  private paintTimer: Phaser.Time.TimerEvent | null = null;
  private paintingInProgress = false;
  private paintStartTime = 0;
  private gridCounter: Phaser.GameObjects.Text;
  private gridCompleteText: Phaser.GameObjects.Text;
  private gridGraphics: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: "RoomScene" });
  }

  preload() {
    this.load.image("avatar", avatarUrl);

    for (const item of ALL_ITEMS) {
      const url = ITEM_IMAGE_URLS[item.id];
      if (url) {
        this.load.image(item.id, url);
      }
    }
  }

  create(data?: object) {
    this._updateLayout();
    this.scale.on("resize", this._onResize, this);
    this._applyScale();
    this.iso = new IsometricRenderer(TILE_W, TILE_H, this.scale.width / 2, this.scale.height / 2);
    this.createAvatar();
    this.avatarFootRadius = this.avatar.getFootprintRadius();
    this.recomputeWalkableTiles();
    this.ensureAvatarTile();
    this.snapAvatarToTile();

    this.furnitureRenderer = new FurnitureRenderer(this);
    this.furnitureRenderer.setOnDrop((itemId: string, x: number, y: number) => {
      this.roomLayout[itemId] = { x, y };
      this.game.events.emit("item-dropped", { itemId, x, y });
    });

    this.xpDisplay = new XpDisplay(this);
    this.xpDisplay.reposition(this.cameras.main.zoom, this.scale.height);
    this.xpDisplay.update(this.currentXp, this.xpForNext, this.currentLevel);
    this.xpDisplay.setVisible(false);

    this.titleDisplay = new TitleDisplay(this, this.avatar.container);

    this.startAutoMovement();

    this.messageList = (messagesData as any).messages || [];
    this.bubbleBg = this.add.graphics();
    this.bubbleBg.setDepth(25);
    this.bubbleBg.setVisible(false);
    this.bubbleText = this.add.text(0, 0, "", {
      fontSize: "9px",
      color: "#ffffff",
      fontFamily: "monospace",
      wordWrap: { width: 140 },
      align: "center",
    });
    this.bubbleText.setOrigin(0.5, 1);
    this.bubbleText.setDepth(26);
    this.bubbleText.setVisible(false);
    this._initGrid();
    this._scheduleNextMessage();

    this.game.events.on("extension-message", (message: ExtensionMessage) => {
      switch (message.type) {
        case "init":
        case "stateUpdate":
          this.currentXp = (message.payload as any).xp ?? 0;
          this.currentLevel = (message.payload as any).level ?? 1;
          this.xpForNext = 50 + 15 * Math.pow(this.currentLevel, 1.5);
          this.xpDisplay.update(this.currentXp, this.xpForNext, this.currentLevel);

          if ((message.payload as any).roomLayout) {
            this.roomLayout = { ...(message.payload as any).roomLayout };
          }
          this.refreshFurniture();
          if ((message.payload as any).currentTitle !== undefined) {
            this.currentTitle = (message.payload as any).currentTitle;
            this.refreshTitle();
          }
          break;

        case "layoutUpdate":
          const layout = message.payload as LayoutUpdatePayload;
          this.roomLayout = { ...layout.roomLayout };
          this.refreshFurniture();
          break;

        case "xpUpdate":
          const xp = message.payload as XpUpdatePayload;
          this.currentXp = xp.totalXp;
          this.currentLevel = xp.level;
          this.xpForNext = xp.xpForNext;
          this.xpDisplay.update(xp.totalXp, xp.xpForNext, xp.level);
          this.xpDisplay.showFloatingXp(this, xp.amount);
          this.avatarReaction();
          if (xp.amount > 0) this._onCodingActivity();
          break;

        case "levelUp":
          const lvl = message.payload as LevelUpPayload;
          this.currentLevel = lvl.newLevel;
          this.showLevelUpEffect(lvl);
          break;
      }
    });

    this.game.events.on("place-item", (itemId: string) => {
      if (this.roomLayout[itemId]) return;
      const item = ALL_ITEMS.find(i => i.id === itemId);
      if (!item) return;
      this.roomLayout[itemId] = { x: item.defaultX, y: item.defaultY };
      this.refreshFurniture();
      this.game.events.emit("item-dropped", { itemId, x: item.defaultX, y: item.defaultY });
    });

    this.game.events.on("remove-item", (itemId: string) => {
      delete this.roomLayout[itemId];
      this.refreshFurniture();
      this.game.events.emit("item-dropped", { itemId, x: -1, y: -1 });
    });

    this.game.events.on("edit-mode-changed", (editable: boolean) => {
      this.furnitureRenderer.setEditable(editable);
    });

    this.game.events.on("xp-visibility", (visible: boolean) => {
      this.xpDisplay.setVisible(visible);
    });

    this.game.events.emit("scene-ready");
  }

  private refreshFurniture() {
    this.furnitureRenderer.update(this.roomLayout);
  }

  private refreshTitle() {
    if (this.currentTitle) {
      this.titleDisplay.update(this.currentTitle);
      this.titleDisplay.setPosition(this.avatar.container.x, this.avatar.container.y);
    }
  }

  private showLevelUpEffect(lvl: LevelUpPayload) {
    const txt = this.add.text(160, 80, `LEVEL ${lvl.newLevel}!`, {
      fontSize: "16px",
      color: "#00ff88",
      fontFamily: "monospace",
      fontStyle: "bold",
    });
    txt.setOrigin(0.5);
    txt.setDepth(30);

    this.tweens.add({
      targets: txt,
      y: 60,
      alpha: 0,
      scale: 1.5,
      duration: 2000,
      ease: "Cubic.easeOut",
      onComplete: () => txt.destroy(),
    });

    lvl.rewards.forEach((reward, i) => {
      const rt = this.add.text(160, 110 + i * 14, `+ ${reward.name}`, {
        fontSize: "10px",
        color: "#ffcc00",
        fontFamily: "monospace",
      });
      rt.setOrigin(0.5);
      rt.setDepth(30);

      this.tweens.add({
        targets: rt,
        y: rt.y - 10,
        alpha: 0,
        delay: i * 300,
        duration: 1500,
        onComplete: () => rt.destroy(),
      });
    });

    this.refreshFurniture();
    this.refreshTitle();
  }

  private avatarReaction() {
    this.tweens.add({
      targets: this.avatar.container,
      scaleX: 1.15,
      scaleY: 1.15,
      duration: 100,
      yoyo: true,
      ease: "Back.easeOut",
    });
  }

  private createAvatar() {
    const pos = this.iso.gridToScreen(this.avatarTileX, this.avatarTileY);
    this.avatar = new Avatar(this, pos.x, pos.y - 8);
    this.avatar.setDepth(4);
  }

  private snapAvatarToTile() {
    const pos = this.iso.gridToScreen(this.avatarTileX, this.avatarTileY);
    this.avatar.container.setPosition(pos.x, pos.y - 8);
  }

  private startAutoMovement() {
    this.moveTimer = this.time.addEvent({
      delay: 3000,
      loop: true,
      callback: () => this.doAutoMove(),
    });
  }

  private async doAutoMove() {
    const actions: (() => Promise<void>)[] = [
      () => this.moveToRandomPoint(),
      () => this.moveToRandomPoint(),
      () => this.moveToDesk(),
    ];
    const action = Phaser.Math.RND.pick(actions);
    await action();
  }

  private async moveToRandomPoint() {
    if (!this.walkableTiles.length) return;

    const current = this.avatar.getPosition();
    const options = this.walkableTiles.filter((p) => {
      const dx = p.x - current.x;
      const dy = p.y - current.y;
      return dx * dx + dy * dy > 64;
    });
    if (!options.length) return;

    const pick = Phaser.Math.RND.pick(options);
    await this.avatar.moveTo(this, pick.x, pick.y);
    this.updateTitlePosition();
  }

  private async moveToDesk() {
    const deskX = 3;
    const deskY = 1;
    const targetPos = this.iso.gridToScreen(deskX, deskY);
    const footX = targetPos.x;
    const footY = targetPos.y - 8;
    const snap = this.getNearestWalkablePoint(footX, footY);
    if (!snap) return;
    await this.avatar.moveTo(this, snap.x, snap.y);
    this.updateTitlePosition();

    this.avatar.setState("sit", this);
    await this.delay(2500);
    this.avatar.setState("idle", this);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => this.time.delayedCall(ms, resolve));
  }

  private recomputeWalkableTiles() {
    this.walkableTiles = this.computeWalkablePoints(
      this.avatarFootRadius + WALKABLE_PADDING,
      WALKABLE_POINT_STEP
    );
    if (!this.walkableTiles.length) {
      this.walkableTiles = this.computeWalkablePoints(0, WALKABLE_POINT_STEP);
    }
  }

  private computeWalkablePoints(radius: number, step: number): { x: number; y: number }[] {
    const points: { x: number; y: number }[] = [];
    const bounds = this.getFloorBounds();
    for (let y = bounds.minY; y <= bounds.maxY; y += step) {
      for (let x = bounds.minX; x <= bounds.maxX; x += step) {
        if (this.isFootprintInside(x, y, radius)) {
          points.push({ x, y });
        }
      }
    }
    return points;
  }

  private ensureAvatarTile() {
    const pos = this.avatar.getPosition();
    if (this.isFootprintInside(pos.x, pos.y, this.avatarFootRadius + WALKABLE_PADDING)) {
      return;
    }
    const fallback = this.getNearestWalkablePoint(pos.x, pos.y);
    if (!fallback) return;
    this.avatar.container.setPosition(fallback.x, fallback.y);
  }

  private getNearestWalkablePoint(x: number, y: number) {
    if (!this.walkableTiles.length) return null;
    let best = this.walkableTiles[0];
    let bestScore = Number.POSITIVE_INFINITY;
    for (const p of this.walkableTiles) {
      const dx = p.x - x;
      const dy = p.y - y;
      const score = dx * dx + dy * dy;
      if (score < bestScore) {
        best = p;
        bestScore = score;
      }
    }
    return best;
  }

  private updateTitlePosition() {
    if (!this.currentTitle) return;
    this.titleDisplay.setPosition(this.avatar.container.x, this.avatar.container.y);
  }

  private _applyScale() {
    const sx = this.scale.width / BASE_W;
    const sy = this.scale.height / BASE_H;
    const s = Math.min(sx, sy);
    this.cameras.main.setZoom(s);
    const ox = (this.scale.width - BASE_W * s) / (2 * s);
    const oy = (this.scale.height - BASE_H * s) / (2 * s);
    this.cameras.main.setScroll(-ox, -oy);
  }

  private _onResize(gameSize: Phaser.Structs.Size) {
    this._applyScale();
    this._updateLayout();
    this.iso.setCenter(gameSize.width / 2, gameSize.height / 2);
    this.xpDisplay.reposition(this.cameras.main.zoom, gameSize.height);
    this._repositionGridUI();
    this.recomputeWalkableTiles();
    this.ensureAvatarTile();
    this.snapAvatarToTile();
  }

  private _repositionGridUI() {
    const zoom = this.cameras.main.zoom;
    const y = (28) / zoom;
    this.gridCounter.setPosition(10 / zoom, y);
    this.gridCompleteText.setPosition(10 / zoom, y + 10 / zoom);
  }

  private _updateLayout() {
    const sx = this.scale.width / BASE_W;
    const sy = this.scale.height / BASE_H;
    this.floorPoly = this.baseFloorPoly.map(p => ({
      x: Math.round(p.x * sx),
      y: Math.round(p.y * sy),
    }));
  }

  private _scheduleNextMessage() {
    const delay = Phaser.Math.Between(30, 180) * 1000;
    this.bubbleTimer = this.time.delayedCall(delay, () => {
      if (Phaser.Math.Between(1, 100) <= 50) {
        this._showRandomMessage();
      } else {
        this._scheduleNextMessage();
      }
    });
  }

  private _showRandomMessage() {
    if (!this.messageList.length) return;
    const msg = Phaser.Math.RND.pick(this.messageList);
    const ax = this.avatar.container.x;
    const ay = this.avatar.container.y;
    const bubbleX = ax;
    const bubbleY = ay - 60;

    this.bubbleBg.clear();
    const padX = 8;
    const padY = 4;
    this.bubbleText.setText(msg.text);
    this.bubbleText.setPosition(bubbleX, bubbleY - padY);
    const tw = this.bubbleText.width + padX * 2;
    const th = this.bubbleText.height + padY * 2;
    const bx = bubbleX - tw / 2;
    const by = bubbleY - th;

    this.bubbleBg.fillStyle(0x000000, 0.8);
    this.bubbleBg.fillRoundedRect(bx, by, tw, th, 4);
    this.bubbleBg.lineStyle(1, 0x00ff88, 0.6);
    this.bubbleBg.strokeRoundedRect(bx, by, tw, th, 4);
    // tail
    this.bubbleBg.fillTriangle(
      bubbleX - 4, by + th,
      bubbleX + 4, by + th,
      bubbleX, by + th + 6,
    );

    this.bubbleBg.setVisible(true);
    this.bubbleText.setVisible(true);

    const visibleDuration = Phaser.Math.Between(5, 10) * 1000;
    this.time.delayedCall(visibleDuration, () => {
      this.bubbleBg.setVisible(false);
      this.bubbleText.setVisible(false);
      this._scheduleNextMessage();
    });
  }

  private _initGrid() {
    const cellSize = 32;
    const cols = Math.floor(BASE_W / cellSize);
    const rows = Math.floor(BASE_H / cellSize);
    this.gridCells = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cx = c * cellSize + cellSize / 2;
        const cy = r * cellSize + cellSize / 2;
        if (this.isPointInPoly(cx, cy, this.floorPoly)) {
          this.gridCells.push({ x: cx, y: cy });
        }
      }
    }
    this.paintedCells = new Array(this.gridCells.length).fill(false);

    this.gridGraphics = this.add.graphics();
    this.gridGraphics.setDepth(2);

    const counterY = 28;
    this.gridCounter = this.add.text(10, counterY, "", {
      fontSize: "8px", color: "#888888", fontFamily: "monospace",
    });
    this.gridCounter.setDepth(27);
    this.gridCounter.setScrollFactor(0);
    this.gridCounter.setInteractive({ useHandCursor: true });
    this.gridCounter.on("pointerdown", () => this._resetGrid());
    this.gridCounter.setVisible(false);

    this.gridCompleteText = this.add.text(10, counterY + 10, "", {
      fontSize: "8px", color: "#ffcc00", fontFamily: "monospace",
    });
    this.gridCompleteText.setDepth(27);
    this.gridCompleteText.setScrollFactor(0);
    this.gridCompleteText.setVisible(false);
  }

  private _onCodingActivity() {
    if (this.gridCells.length === 0) return;
    if (this.paintingInProgress) return;
    if (this.paintedCells.every(v => v)) return;
    if (this.paintTimer) this.paintTimer.remove();
    this.paintTimer = this.time.delayedCall(10000, () => this._paintNextCell());
  }

  private _paintNextCell() {
    if (this.paintingInProgress) return;
    const unpainted: number[] = [];
    for (let i = 0; i < this.paintedCells.length; i++) {
      if (!this.paintedCells[i]) unpainted.push(i);
    }
    if (unpainted.length === 0) return;
    const idx = Phaser.Math.RND.pick(unpainted);
    const target = this.gridCells[idx];
    const avatarPos = this.avatar.getPosition();
    const duration = Math.max(300, Phaser.Math.Distance.Between(avatarPos.x, avatarPos.y, target.x, target.y) * 2);

    if (this.paintStartTime === 0) this.paintStartTime = Date.now();
    this.paintingInProgress = true;
    this.avatar.moveTo(this, target.x, target.y, duration).then(() => {
      this.paintedCells[idx] = true;
      this._drawPaintedCell(target.x, target.y);
      this._updateGridUI();
      this.paintingInProgress = false;

      if (this.paintedCells.every(v => v)) {
        this._showGridComplete();
      }
    });
  }

  private _drawPaintedCell(x: number, y: number) {
    const colors = [0x00ff88, 0x00aaff, 0xff5577, 0xffcc00, 0xaa66ff, 0xff8844, 0x44ffaa];
    const color = Phaser.Math.RND.pick(colors);
    const s = 32;
    this.gridGraphics.fillStyle(color, 0.35);
    this.gridGraphics.fillRect(x - s / 2, y - s / 2, s, s);
  }

  private _updateGridUI() {
    const painted = this.paintedCells.filter(v => v).length;
    const total = this.gridCells.length;
    this.gridCounter.setText(`Painted: ${painted}/${total}`);
    this.gridCounter.setVisible(true);
  }

  private _showGridComplete() {
    const elapsed = Math.floor((Date.now() - this.paintStartTime) / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    this.gridCompleteText.setText(`Complete! Time: ${mins}m ${secs}s`);
    this.gridCompleteText.setVisible(true);
  }

  private _resetGrid() {
    this.paintedCells = new Array(this.gridCells.length).fill(false);
    this.paintStartTime = 0;
    this.paintingInProgress = false;
    this.gridGraphics.clear();
    this.gridCounter.setVisible(false);
    this.gridCompleteText.setVisible(false);
    if (this.paintTimer) this.paintTimer.remove();
  }

  private getFloorBounds() {
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    for (const p of this.floorPoly) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
    return {
      minX: Math.floor(minX),
      minY: Math.floor(minY),
      maxX: Math.ceil(maxX),
      maxY: Math.ceil(maxY),
    };
  }

  private isPointInPoly(x: number, y: number, poly: { x: number; y: number }[]) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i].x;
      const yi = poly[i].y;
      const xj = poly[j].x;
      const yj = poly[j].y;
      const intersect = (yi > y) !== (yj > y)
        && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }

  private isFootprintInside(x: number, y: number, radius: number) {
    if (radius <= 0) {
      return this.isPointInPoly(x, y, this.floorPoly);
    }
    const diag = radius * 0.7071;
    const points = [
      { x: x - radius, y },
      { x: x + radius, y },
      { x, y: y - radius },
      { x, y: y + radius },
      { x: x - diag, y: y - diag },
      { x: x + diag, y: y - diag },
      { x: x - diag, y: y + diag },
      { x: x + diag, y: y + diag },
    ];
    for (const p of points) {
      if (!this.isPointInPoly(p.x, p.y, this.floorPoly)) return false;
    }
    return true;
  }
}
