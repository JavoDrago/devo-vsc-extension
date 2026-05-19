export class WallRenderer {
  static drawBackWall(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    width: number,
    height: number,
    color: number
  ) {
    g.fillStyle(color, 1);
    g.fillRect(x, y, width, height);

    // cyberpunk line details
    g.lineStyle(1, 0x00ff88, 0.15);
    g.strokeRect(x + 4, y + 4, width - 8, height - 8);
  }

  static drawSideWall(
    g: Phaser.GameObjects.Graphics,
    cx: number,
    cy: number,
    hw: number,
    hh: number,
    wallHeight: number,
    color: number
  ) {
    const darker = this.darken(color, 0.7);
    g.fillStyle(darker, 1);

    // left side wall extending up from floor edge
    g.beginPath();
    g.moveTo(cx - hw, cy + hh);
    g.lineTo(cx, cy + hh * 2);
    g.lineTo(cx, cy + hh * 2 - wallHeight);
    g.lineTo(cx - hw, cy + hh - wallHeight);
    g.closePath();
    g.fill();

    g.lineStyle(1, 0x00ff88, 0.1);
    g.strokePath();
  }

  static drawGridLines(
    g: Phaser.GameObjects.Graphics,
    rows: number,
    cols: number,
    iso: { gridToScreen(tx: number, ty: number): { x: number; y: number } }
  ) {
    g.lineStyle(1, 0x00ff88, 0.08);

    for (let i = 0; i <= rows; i++) {
      const a = iso.gridToScreen(0, i);
      const b = iso.gridToScreen(cols, i);
      g.beginPath();
      g.moveTo(a.x, a.y);
      g.lineTo(b.x, b.y);
      g.strokePath();
    }

    for (let i = 0; i <= cols; i++) {
      const a = iso.gridToScreen(i, 0);
      const b = iso.gridToScreen(i, rows);
      g.beginPath();
      g.moveTo(a.x, a.y);
      g.lineTo(b.x, b.y);
      g.strokePath();
    }
  }

  private static darken(color: number, factor: number): number {
    const r = Math.floor(((color >> 16) & 0xff) * factor);
    const g2 = Math.floor(((color >> 8) & 0xff) * factor);
    const b = Math.floor((color & 0xff) * factor);
    return (r << 16) | (g2 << 8) | b;
  }
}
