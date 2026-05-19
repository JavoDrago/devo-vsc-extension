import Phaser from "phaser";
import { ItemPosition } from "../../shared/types";

export const FURNITURE_LAYER_DEPTH = 3;

const ITEM_SCALE: Record<string, number> = {
  item_boss: 1.0,
  item_cabinet: 1.0,
  item_chair: 1.0,
  item_coffee_maker: 1.0,
  item_desk: 1.0,
  item_desk_pc: 1.0,
  item_partitions_1: 1.0,
  item_partitions_2: 1.0,
  item_partitions_3: 1.0,
  item_partitions_4: 1.0,
  item_partitions_5: 1.0,
  item_partitions_6: 1.0,
  item_partitions_7: 1.0,
  item_pc1: 1.0,
  item_pc2: 1.0,
  item_plant: 1.0,
  item_printer: 1.0,
  item_sink: 1.0,
  item_stamping_table: 1.0,
  item_trash: 1.0,
  item_water_cooler: 1.0,
  item_worker1: 1.0,
  item_worker2: 1.0,
  item_worker4: 1.0,
  item_writing_table: 1.0,
};

export class FurnitureRenderer {
  private scene: Phaser.Scene;
  private layer: Phaser.GameObjects.Layer;
  private items: Map<string, Phaser.GameObjects.Image> = new Map();
  private onDrop?: (itemId: string, x: number, y: number) => void;
  private maxItemHeight = 40;
  private editable = true;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.layer = scene.add.layer();
    this.layer.setDepth(FURNITURE_LAYER_DEPTH);
  }

  setOnDrop(callback: (itemId: string, x: number, y: number) => void) {
    this.onDrop = callback;
  }

  update(layout: { [itemId: string]: ItemPosition }) {
    const currentIds = new Set(Object.keys(layout));

    for (const [id, img] of this.items) {
      if (!currentIds.has(id)) {
        this.layer.remove(img);
        img.destroy();
        this.items.delete(id);
      }
    }

    for (const [itemId, pos] of Object.entries(layout)) {
      let img = this.items.get(itemId);
      if (!img) {
        img = this.scene.add.image(pos.x, pos.y, itemId);
        img.setOrigin(0.5, 1);
        this.layer.add(img);
        this.items.set(itemId, img);
        if (this.editable) {
          img.setInteractive({ draggable: true, useHandCursor: true });
          this.scene.input.setDraggable(img);
          this.setupDrag(itemId, img);
        }
      }
      img.setPosition(pos.x, pos.y);
      img.setDepth(FURNITURE_LAYER_DEPTH + (pos.y / 1000));
      const scale = ITEM_SCALE[itemId] ?? 1;
      img.setScale(scale);
      this.sortDepth();
    }
  }

  private setupDrag(itemId: string, img: Phaser.GameObjects.Image) {
    img.on("drag", (_pointer: Phaser.Input.Pointer, dragX: number, dragY: number) => {
      img.setPosition(dragX, dragY);
      img.setDepth(FURNITURE_LAYER_DEPTH + (dragY / 1000));
    });

    img.on("dragend", () => {
      if (this.onDrop) {
        this.onDrop(itemId, img.x, img.y);
      }
    });
  }

  private sortDepth() {
    const images = this.layer.getChildren() as Phaser.GameObjects.Image[];
    images.sort((a, b) => (a.y - b.y));
    images.forEach((img, i) => {
      img.setDepth(FURNITURE_LAYER_DEPTH + (i / 1000));
    });
  }

  setEditable(editable: boolean) {
    this.editable = editable;
    for (const img of this.items.values()) {
      if (editable) {
        img.setInteractive({ draggable: true, useHandCursor: true });
        this.scene.input.setDraggable(img);
      } else {
        img.disableInteractive();
      }
    }
  }

  getCurrentPositions(): { [itemId: string]: ItemPosition } {
    const result: { [itemId: string]: ItemPosition } = {};
    for (const [id, img] of this.items) {
      result[id] = { x: Math.round(img.x), y: Math.round(img.y) };
    }
    return result;
  }

  destroy() {
    this.layer.destroy(true);
    this.items.clear();
  }
}
