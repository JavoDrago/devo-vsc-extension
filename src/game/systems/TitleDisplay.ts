import Phaser from "phaser";

export class TitleDisplay {
  private text: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, avatarContainer: Phaser.GameObjects.Container) {
    this.text = scene.add.text(0, -28, "", {
      fontSize: "7px",
      color: "#00ff88",
      fontFamily: "monospace",
      align: "center",
    });
    this.text.setOrigin(0.5, 1);
    this.text.setDepth(26);
  }

  update(title: string | null) {
    if (title) {
      this.text.setText(`[${title}]`);
      this.text.setVisible(true);
    } else {
      this.text.setVisible(false);
    }
  }

  setPosition(x: number, y: number) {
    this.text.setPosition(x, y - 28);
  }

  destroy() {
    this.text.destroy();
  }
}
