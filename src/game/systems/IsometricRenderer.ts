export interface TileCoord {
  x: number;
  y: number;
}

export class IsometricRenderer {
  readonly tileWidth: number;
  readonly tileHeight: number;
  originX: number;
  originY: number;

  constructor(
    tileWidth: number,
    tileHeight: number,
    originX: number,
    originY: number
  ) {
    this.tileWidth = tileWidth;
    this.tileHeight = tileHeight;
    this.originX = originX;
    this.originY = originY;
  }

  setCenter(x: number, y: number) {
    this.originX = x;
    this.originY = y;
  }

  gridToScreen(tx: number, ty: number): { x: number; y: number } {
    return {
      x: this.originX + (tx - ty) * (this.tileWidth / 2),
      y: this.originY + (tx + ty) * (this.tileHeight / 2),
    };
  }

  getFloorCorners(rows: number, cols: number): { x: number; y: number }[] {
    return [
      this.gridToScreen(0, 0),
      this.gridToScreen(cols, 0),
      this.gridToScreen(cols, rows),
      this.gridToScreen(0, rows),
    ];
  }

  drawFloor(
    g: Phaser.GameObjects.Graphics,
    rows: number,
    cols: number,
    tileColor: number,
    altColor: number,
    wallHeight: number
  ) {
    for (let ty = 0; ty < rows; ty++) {
      for (let tx = 0; tx < cols; tx++) {
        const p = this.gridToScreen(tx, ty);
        const c = (tx + ty) % 2 === 0 ? tileColor : altColor;
        this.drawTile(g, p.x, p.y, c, wallHeight);
      }
    }
  }

  private drawTile(
    g: Phaser.GameObjects.Graphics,
    cx: number,
    cy: number,
    color: number,
    wallHeight: number
  ) {
    const hw = this.tileWidth / 2;
    const hh = this.tileHeight / 2;

    // top face
    g.fillStyle(color, 1);
    g.beginPath();
    g.moveTo(cx, cy);
    g.lineTo(cx + hw, cy + hh);
    g.lineTo(cx, cy + hh * 2);
    g.lineTo(cx - hw, cy + hh);
    g.closePath();
    g.fill();

    // left face (wall extension)
    if (wallHeight > 0) {
      const darker = this.darken(color, 0.6);
      g.fillStyle(darker, 1);
      g.beginPath();
      g.moveTo(cx - hw, cy + hh);
      g.lineTo(cx, cy + hh * 2);
      g.lineTo(cx, cy + hh * 2 + wallHeight);
      g.lineTo(cx - hw, cy + hh + wallHeight);
      g.closePath();
      g.fill();

      // right face
      const darker2 = this.darken(color, 0.75);
      g.fillStyle(darker2, 1);
      g.beginPath();
      g.moveTo(cx, cy + hh * 2);
      g.lineTo(cx + hw, cy + hh);
      g.lineTo(cx + hw, cy + hh + wallHeight);
      g.lineTo(cx, cy + hh * 2 + wallHeight);
      g.closePath();
      g.fill();
    }
  }

  private darken(color: number, factor: number): number {
    const r = Math.floor(((color >> 16) & 0xff) * factor);
    const g = Math.floor(((color >> 8) & 0xff) * factor);
    const b = Math.floor((color & 0xff) * factor);
    return (r << 16) | (g << 8) | b;
  }
}
