# Devo — Your Coding Companion

A Habbo-inspired cyberpunk incremental game inside VS Code.  
Devo lives in your editor panel, grows as you code, and turns your workspace into a pixel-art room to customize.

![Devo screenshot](https://raw.githubusercontent.com/JavoDrago/devo-vsc-extension/image.png)

## Features

### 🧑‍💻 Companion Avatar
- A pixel-art avatar that roams around your room
- Idle animations (bobbing, walking, sitting at desk)
- Random speech bubbles with messages about your coding session
- Auto-moves to random walkable points

### ⚡ XP & Leveling
- **1 XP** per word typed
- **5 XP** per file save
- **10 XP** per file created
- **1 XP** per minute of active editing
- Level up unlocks new titles and shop items
- XP is your currency — spend it in the shop

### 🛒 Shop
- Browse furniture and decorations placed in your layout
- Buy items with XP (no level restrictions)
- Purchased items appear in your room instantly

### 🖌️ Room Editor
- Drag & drop 25+ furniture sprites anywhere in the room
- Full-screen placement mode — items snap to pixel positions
- Collapsible placed-items list with remove buttons
- Save your layout and switch to Play Mode

### 🎮 Play Mode
- Watch your avatar roam the room you designed
- XP bar and spendable XP counter always visible
- SHOP button to buy layout items
- Paint grid — every 60s after typing, the avatar paints a random 32×32 cell
- Track painted cells / total time; click counter to reset
- RESET button to wipe progress (keeps your character name)

### 💬 Dynamic Messages
- Random speech bubbles above the avatar (every 30–180s, 50% chance)
- Messages react to: typing, idle, errors, level-ups, shopping, mood, tips, rare events
- Fully customizable via `messages.json`

### 🖼️ 25+ Sprites
- Desks, chairs, PCs, plants, partitions, decorations, and more
- All original pixel-art sprites

## Requirements

- VS Code **1.90.0** or higher

## Extension Settings

This extension contributes the following commands:

* `Devo: Reset Game Data` — Resets XP, level, shop inventory, and room layout (character name is preserved)

## How to Use

1. Open the **EXPLORER** panel in VS Code
2. Find the **Devo** view at the bottom of the explorer
3. Enter your companion's name and click **START**
4. Start coding to earn XP
5. Use the toolbar to place furniture in your room
6. Click **SAVE** to lock your layout and enter Play Mode
7. Open the **SHOP** to buy items with XP
8. Watch your avatar paint the grid as you code

## Data Storage

All game data is stored in VS Code's `globalState`:
- XP, level, character name
- Shop inventory and unlocked items
- Room layout (item positions)
- Game mode (placement / play)

**Reset:** Use `Devo: Reset Game Data` from the command palette, or the RESET button in Play Mode.

## Building from Source

```bash
git clone https://github.com/YOUR_USERNAME/devo.git
cd devo
npm install
npm run build
```

## Package for Marketplace

```bash
npm run package
```

This generates a `.vsix` file ready for publishing.

## Known Issues

- The Phaser game canvas uses a fixed base resolution of 320×240 (scales to fit)
- Grid painting cells are limited to the base 10×7 grid (32px cells)
- Speech bubbles may clip at small panel sizes

## Release Notes

### 0.1.0
- Initial release
- Core XP system, avatar, room editor, shop, messages, grid painting

---

**Made with ❤️ for developers who love pixel art and gamified productivity.**
