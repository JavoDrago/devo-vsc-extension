import Phaser from "phaser";
import { RoomScene } from "./scenes/RoomScene";
import { GameState, ExtensionMessage, BuyResultPayload, ItemPosition } from "../shared/types";
import { ALL_ITEMS } from "../data/items";

const vscode = acquireVsCodeApi();
let game: Phaser.Game | null = null;
let currentState: GameState | null = null;
let shopInventory: string[] = [];

const welcomeOverlay = document.getElementById("welcome-overlay")!;
const nameInput = document.getElementById("name-input") as HTMLInputElement;
const startBtn = document.getElementById("start-btn")!;
const gameContainer = document.getElementById("game-container")!;
const shopBtn = document.getElementById("shop-btn")!;
const shopOverlay = document.getElementById("shop-overlay")!;
const shopClose = document.getElementById("shop-close")!;
const shopItems = document.getElementById("shop-items")!;
const shopTabs = document.querySelectorAll(".shop-tab")!;
const shopError = document.getElementById("shop-error") as HTMLDivElement | null;
const itemsDropdown = document.getElementById("items-dropdown") as HTMLSelectElement;
const placeBtn = document.getElementById("place-item-btn")!;
const saveLayoutBtn = document.getElementById("save-layout-btn")!;
const resetLayoutBtn = document.getElementById("reset-layout-btn")!;
const placedItemsContainer = document.getElementById("placed-items")!;
const placedItemsHeader = document.getElementById("placed-items-header")!;
const placedItemsToggle = document.getElementById("placed-items-toggle")!;
const placedItemsCount = document.getElementById("placed-items-count")!;
const itemsToolbar = document.getElementById("items-toolbar")!;
const resetBtn = document.getElementById("reset-btn")!;

let currentCategory = "all";
let roomLayout: { [itemId: string]: ItemPosition } = {};
let isEditMode = true;

const SHOP_DATA = ALL_ITEMS.map(item => ({
  id: item.id,
  name: item.name,
  description: `A ${item.category} item for your office`,
  category: item.category,
  price: item.price,
  levelRequired: item.levelRequired,
  preview: item.spriteFile.replace('.png', ''),
}));

function initPhaser() {
  game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: "game-container",
    backgroundColor: "rgba(0,0,0,0)",
    scene: [RoomScene],
    pixelArt: true,
    transparent: true,
    scale: {
      mode: Phaser.Scale.RESIZE,
    },
    render: { antialias: false },
  });

  game.events.on("scene-ready", () => {
    if (currentState) {
      game!.events.emit("extension-message", { type: "init", payload: currentState });
      game!.events.emit("edit-mode-changed", isEditMode);
      game!.events.emit("xp-visibility", !isEditMode);
      if (!isEditMode) applyPlayModeLayout();
    }
  });

  game.events.on("item-dropped", (data: { itemId: string; x: number; y: number }) => {
    if (data.x === -1 && data.y === -1) {
      delete roomLayout[data.itemId];
    } else {
      roomLayout[data.itemId] = { x: data.x, y: data.y };
    }
    saveItemPositions();
    if (isEditMode) {
      renderPlacedItems();
      populateDropdown();
    }
  });
}

function showWelcome() {
  welcomeOverlay.classList.remove("hidden");
  gameContainer.classList.add("hidden");
  shopOverlay.classList.add("hidden");
  itemsToolbar.classList.add("hidden");
  resetBtn.classList.add("hidden");
  shopBtn.classList.add("hidden");
  nameInput.focus();
}

function showGame() {
  welcomeOverlay.classList.add("hidden");
  gameContainer.classList.remove("hidden");
  if (!game) initPhaser();
}

startBtn.addEventListener("click", onSubmit);
nameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") onSubmit();
});

function onSubmit() {
  const name = nameInput.value.trim();
  if (!name) return;
  (startBtn as HTMLButtonElement).disabled = true;
  startBtn.textContent = "creating...";
  vscode.postMessage({ type: "createCharacter", payload: name });
}

// ---- Shop ----
shopBtn.addEventListener("click", openShop);
shopClose.addEventListener("click", closeShop);
shopTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    shopTabs.forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    currentCategory = (tab as HTMLElement).dataset.cat || "all";
    renderShop();
  });
});

function openShop() {
  shopOverlay.classList.remove("hidden");
  renderShop();
}

function closeShop() {
  shopOverlay.classList.add("hidden");
}

function renderShop() {
  clearShopError();
  const owned = new Set(shopInventory);
  const layoutItemIds = new Set(Object.keys(roomLayout));
  shopItems.innerHTML = "";

  let filtered = currentCategory === "all"
    ? SHOP_DATA
    : SHOP_DATA.filter((i) => i.category === currentCategory);
  filtered = filtered.filter((i) => layoutItemIds.has(i.id));

  for (const item of filtered) {
    const el = document.createElement("div");
    const isOwned = owned.has(item.id);

    el.className = `shop-item${isOwned ? " owned" : ""}`;
    el.innerHTML = `
      <div class="shop-item-info">
        <div class="shop-item-name">${item.name}</div>
        <div class="shop-item-desc">${item.description}</div>
      </div>
      <div class="shop-item-price">${item.price} XP</div>
    `;

    if (isOwned) {
      const badge = document.createElement("span");
      badge.style.color = "#00ff88";
      badge.style.fontSize = "9px";
      badge.textContent = "OWNED";
      el.appendChild(badge);
    } else {
      const btn = document.createElement("button");
      btn.className = "shop-item-btn";
      btn.textContent = "buy";
      btn.addEventListener("click", () => {
        vscode.postMessage({ type: "shopBuy", payload: { itemId: item.id } });
        btn.disabled = true;
        btn.textContent = "...";
      });
      el.appendChild(btn);
    }
    shopItems.appendChild(el);
  }
}

function setShopError(message: string) {
  if (!shopError) return;
  shopError.textContent = message;
  shopError.classList.remove("hidden");
}

function clearShopError() {
  if (!shopError) return;
  shopError.textContent = "";
  shopError.classList.add("hidden");
}

function getOwnedItems(): string[] {
  const items = new Set<string>();
  for (const id of (currentState?.unlockedItems || [])) items.add(id);
  for (const id of shopInventory) items.add(id);
  return [...items];
}

// ---- Items toolbar ----
function populateDropdown() {
  itemsDropdown.innerHTML = '<option value="">-- Select item --</option>';
  for (const item of ALL_ITEMS) {
    if (roomLayout[item.id]) continue;
    const opt = document.createElement("option");
    opt.value = item.id;
    opt.textContent = `${item.name} (${item.price} XP)`;
    itemsDropdown.appendChild(opt);
  }
}

placeBtn.addEventListener("click", () => {
  const itemId = itemsDropdown.value;
  if (!itemId) return;
  if (!game) return;
  game.events.emit("place-item", itemId);
  itemsDropdown.value = "";
});

placedItemsHeader.addEventListener("click", () => {
  placedItemsContainer.classList.toggle("collapsed");
  placedItemsToggle.classList.toggle("collapsed");
});

// ---- Save: transition from placement to play mode ----
saveLayoutBtn.addEventListener("click", () => {
  vscode.postMessage({ type: "saveGameMode", payload: "play" });
  isEditMode = false;
  itemsToolbar.classList.add("hidden");
  shopBtn.classList.remove("hidden");
  resetBtn.classList.remove("hidden");
  if (game) {
    game.events.emit("edit-mode-changed", false);
    game.events.emit("xp-visibility", true);
    clearRoom();
  }
});

// ---- Reset (in toolbar) ----
resetLayoutBtn.addEventListener("click", () => {
  roomLayout = {};
  saveItemPositions();
  if (game) {
    game.events.emit("edit-mode-changed", true);
    game.events.emit("extension-message", { type: "layoutUpdate", payload: { roomLayout: {} } });
  }
  renderPlacedItems();
});

// ---- Reset (in play mode) ----
resetBtn.addEventListener("click", () => {
  vscode.postMessage({ type: "resetGame" });
});

function clearRoom() {
  if (!game) return;
  game.events.emit("extension-message", { type: "layoutUpdate", payload: { roomLayout: {} } });
}

function applyPlayModeLayout() {
  if (!game) return;
  const owned = new Set(shopInventory);
  const filtered: { [itemId: string]: ItemPosition } = {};
  for (const [id, pos] of Object.entries(roomLayout)) {
    if (owned.has(id)) filtered[id] = pos;
  }
  game.events.emit("extension-message", { type: "layoutUpdate", payload: { roomLayout: filtered } });
}

function renderPlacedItems() {
  const count = Object.keys(roomLayout).length;
  placedItemsCount.textContent = `(${count})`;
  placedItemsContainer.innerHTML = "";
  for (const [itemId, pos] of Object.entries(roomLayout)) {
    const item = ALL_ITEMS.find(i => i.id === itemId);
    if (!item) continue;
    const el = document.createElement("div");
    el.className = "placed-item";
    el.innerHTML = `
      <span class="placed-item-name">${item.name}</span>
      <span class="placed-item-pos">(${pos.x}, ${pos.y})</span>
    `;
    const removeBtn = document.createElement("button");
    removeBtn.className = "placed-item-remove";
    removeBtn.textContent = "x";
    removeBtn.addEventListener("click", () => {
      if (game) {
        game.events.emit("remove-item", itemId);
      }
    });
    el.appendChild(removeBtn);
    placedItemsContainer.appendChild(el);
  }
}

function saveItemPositions() {
  vscode.postMessage({
    type: "saveItemPositions",
    payload: { roomLayout },
  });
}

function applyAutoLayout(itemIds: string[]) {
  let changed = false;
  for (const itemId of itemIds) {
    if (roomLayout[itemId]) continue;
    const item = ALL_ITEMS.find(i => i.id === itemId);
    if (!item) continue;
    roomLayout[itemId] = { x: item.defaultX, y: item.defaultY };
    changed = true;
  }
  if (changed) saveItemPositions();
}

// ---- Message handling ----
window.addEventListener("message", (event: MessageEvent<ExtensionMessage>) => {
  const msg = event.data;

  if (msg.type === "init") {
    currentState = msg.payload as GameState;
    shopInventory = currentState.shopInventory || [];
    roomLayout = currentState.roomLayout || {};
    populateDropdown();

    if (!currentState.characterName) {
      showWelcome();
      return;
    }

    showGame();

    const gameMode = currentState.gameMode || "placement";
    if (gameMode === "play") {
      isEditMode = false;
      itemsToolbar.classList.add("hidden");
      shopBtn.classList.remove("hidden");
      resetBtn.classList.remove("hidden");
    } else {
      isEditMode = true;
      itemsToolbar.classList.remove("hidden");
      shopBtn.classList.add("hidden");
      resetBtn.classList.add("hidden");
    }
    if (game) {
      game.events.emit("edit-mode-changed", isEditMode);
      game.events.emit("xp-visibility", !isEditMode);
    }
  }

  if (msg.type === "buyResult") {
    const result = msg.payload as BuyResultPayload;
    if (result.success) {
      shopInventory.push(result.itemId!);
      const item = ALL_ITEMS.find(i => i.id === result.itemId);
      if (item) {
        if (!roomLayout[result.itemId!]) {
          roomLayout[result.itemId!] = { x: item.defaultX, y: item.defaultY };
        }
        saveItemPositions();
      }
      if (game) applyPlayModeLayout();
      closeShop();
    } else if (result.error) {
      setShopError(result.error);
    }
  }

  if (game) {
    game.events.emit("extension-message", msg);
  }
});

vscode.postMessage({ type: "ready" });
