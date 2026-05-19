import Phaser from "phaser";

export class XpDisplay {
  private scene: Phaser.Scene;
  private barBg: Phaser.GameObjects.Graphics;
  private barFill: Phaser.GameObjects.Graphics;
  private label: Phaser.GameObjects.Text;
  private spendLabel: Phaser.GameObjects.Text;
  private popups: Phaser.GameObjects.Text[] = [];
  private barW = 300;
  private barH = 10;
  private barPad = 10;
  private spendPadX = 10;
  private spendPadY = 12;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const x = this.barPad;
    const y = this.barPad;

    this.barBg = scene.add.graphics();
    this.barBg.setDepth(20);
    this.barBg.fillStyle(0x1a1a2e, 0.8);
    this.barBg.fillRect(x, y, this.barW, this.barH);
    this.barBg.lineStyle(1, 0x00ff88, 0.3);
    this.barBg.strokeRect(x, y, this.barW, this.barH);

    this.barFill = scene.add.graphics();
    this.barFill.setDepth(21);

    this.label = scene.add.text(x + this.barW / 2, y + this.barH / 2, "", {
      fontSize: "8px",
      color: "#00ff88",
      fontFamily: "monospace",
    });
    this.label.setOrigin(0.5);
    this.label.setDepth(22);

    this.spendLabel = scene.add.text(x, 0, "", {
      fontSize: "9px",
      color: "#00ff88",
      fontFamily: "monospace",
    });
    this.spendLabel.setOrigin(0, 1);
    this.spendLabel.setDepth(22);

    this._applyScrollFactor();
  }

  private _applyScrollFactor() {
    this.barBg.setScrollFactor(0);
    this.barFill.setScrollFactor(0);
    this.label.setScrollFactor(0);
    this.spendLabel.setScrollFactor(0);
  }

  reposition(zoom: number, canvasH: number) {
    const topY = this.barPad / zoom;
    const x = this.barPad / zoom;
    const bottomY = (canvasH - this.spendPadY) / zoom;

    this.barBg.clear();
    this.barBg.fillStyle(0x1a1a2e, 0.8);
    this.barBg.fillRect(x, topY, this.barW / zoom, this.barH / zoom);
    this.barBg.lineStyle(1 / zoom, 0x00ff88, 0.3);
    this.barBg.strokeRect(x, topY, this.barW / zoom, this.barH / zoom);

    this.label.setPosition(x + this.barW / (2 * zoom), topY + this.barH / (2 * zoom));
    this.spendLabel.setPosition(x, bottomY);
    this._updateBar();
  }

  private _updateBar() {
    if (!this.scene) return;
    const cam = this.scene.cameras.main;
    const zoom = cam.zoom;
    const x = this.barPad / zoom;
    const y = this.barPad / zoom;
    const w = this.barW / zoom;
    const h = this.barH / zoom;
    const pct = this._lastPct;

    this.barFill.clear();
    if (pct > 0) {
      this.barFill.fillStyle(0x005f33, 0.9);
      this.barFill.fillRect(x + 1 / zoom, y + 1 / zoom, (w - 2 / zoom) * pct, h - 2 / zoom);
    }
  }

  private _lastPct = 0;

  update(xp: number, xpForNext: number, level: number) {
    this._lastPct = Math.min(xp / xpForNext, 1);
    this._updateBar();
    this.label.setText(`Lv.${level}  ${xp} / ${xpForNext} XP`);
    this.spendLabel.setText(`XP: ${xp}`);
  }

  setVisible(visible: boolean) {
    this.barBg.setVisible(visible);
    this.barFill.setVisible(visible);
    this.label.setVisible(visible);
    this.spendLabel.setVisible(visible);
  }

  showFloatingXp(scene: Phaser.Scene, amount: number) {
    amount = Math.round(amount);
    const txt = scene.add.text(
      Phaser.Math.Between(60, 260),
      200,
      `+${amount} XP`,
      {
        fontSize: "10px",
        color: "#00ff88",
        fontFamily: "monospace",
      }
    );
    txt.setOrigin(0.5);
    txt.setDepth(25);
    this.popups.push(txt);

    scene.tweens.add({
      targets: txt,
      y: txt.y - 30,
      alpha: 0,
      duration: 1200,
      ease: "Cubic.easeOut",
      onComplete: () => {
        txt.destroy();
        this.popups = this.popups.filter((p) => p !== txt);
      },
    });
  }

  destroy() {
    this.barBg.destroy();
    this.barFill.destroy();
    this.label.destroy();
    this.spendLabel.destroy();
    for (const p of this.popups) p.destroy();
  }
}
