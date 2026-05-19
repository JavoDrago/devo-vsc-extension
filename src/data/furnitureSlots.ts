export interface RoomSlot {
  index: number;
  gridX: number;
  gridY: number;
  label: string;
}

export const ROOM_SLOTS: RoomSlot[] = [
  { index: 0, gridX: 0, gridY: 2, label: "Left chair" },
  { index: 1, gridX: 3, gridY: 2, label: "Desk area" },
  { index: 2, gridX: 1, gridY: 1, label: "Monitor spot" },
  { index: 3, gridX: 0, gridY: 0, label: "Back-left corner" },
  { index: 4, gridX: 4, gridY: 0, label: "Back-right corner" },
  { index: 5, gridX: 2, gridY: 1, label: "Desk accessory" },
  { index: 6, gridX: 2, gridY: 0, label: "Wall center" },
  { index: 7, gridX: 4, gridY: 4, label: "Right corner" },
  { index: 8, gridX: 4, gridY: 2, label: "Side cabinet" },
];

export interface SavedLayout {
  [slotIndex: number]: string;
}
