import Phaser from "phaser";

const AVATAR_FRAME = {
  x: 93,
  y: 324,
  w: 219,
  h: 572,
};
const TARGET_HEIGHT = 56;

type AvatarState = "idle" | "walk" | "sit";

export class Avatar {
  public container: Phaser.GameObjects.Container;
  private sprite: Phaser.GameObjects.Image;
  private state: AvatarState = "idle";
  private bobTween: Phaser.Tweens.Tween | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.sprite = scene.add.image(0, 0, "avatar");
    this.sprite.setOrigin(0.5, 1);
    this.sprite.setCrop(AVATAR_FRAME.x, AVATAR_FRAME.y, AVATAR_FRAME.w, AVATAR_FRAME.h);
    this.sprite.setScale(TARGET_HEIGHT / AVATAR_FRAME.h);
    this.container = scene.add.container(x, y, [this.sprite]);
    this.setState("idle", scene);
  }

  setDepth(depth: number) {
    this.container.setDepth(depth);
  }

  setState(state: AvatarState, scene?: Phaser.Scene, onComplete?: () => void) {
    this.state = state;
    if (state === "idle") {
      this.startBob(scene);
    } else {
      this.stopBob();
    }

    if (onComplete) onComplete();
  }

  moveTo(
    scene: Phaser.Scene,
    x: number,
    y: number,
    duration: number = 600
  ): Promise<void> {
    return new Promise((resolve) => {
      this.setState("walk", scene);
      scene.tweens.add({
        targets: this.container,
        x,
        y,
        duration,
        ease: "Sine.easeInOut",
        onComplete: () => {
          this.setState("idle", scene);
          resolve();
        },
      });
    });
  }

  getPosition(): { x: number; y: number } {
    return { x: this.container.x, y: this.container.y };
  }

  getFootprintRadius(): number {
    return Math.round(this.sprite.displayWidth * 0.45);
  }

  private startBob(scene?: Phaser.Scene) {
    if (this.bobTween) {
      this.bobTween.stop();
      this.bobTween = null;
    }
    if (!scene) return;
    this.bobTween = scene.tweens.add({
      targets: this.container,
      y: this.container.y - 1,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  stopBob() {
    if (this.bobTween) {
      this.bobTween.stop();
      this.bobTween = null;
    }
  }

  // --- draw states ---

  destroy() {
    this.stopBob();
    this.sprite.destroy();
    this.container.destroy();
  }
}
