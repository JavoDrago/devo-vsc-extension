import * as vscode from "vscode";
import { RoomViewProvider } from "./providers/RoomViewProvider";
import { XpSystem } from "./systems/XpSystem";
import { LevelReward } from "./data/rewards";

export function activate(context: vscode.ExtensionContext) {
  const provider = new RoomViewProvider(context.extensionUri, context.globalState);

  const xpSystem = new XpSystem(
    context.globalState,
    (amount, totalXp, level) => {
      provider.sendXpUpdate(amount, totalXp, level);
    },
    (newLevel, rewards) => {
      provider.sendLevelUp(newLevel, rewards);
    }
  );

  provider.setTitleResolver((level) =>
    xpSystem.rewardSystem.getCurrentTitle(level)
  );

  provider.setOnReset(() => {
    xpSystem.reset();
  });

  provider.setOnXpChanged(() => {
    xpSystem.sync();
  });

  xpSystem.startListening();

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider("devo.roomView", provider)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("devo.reset", async () => {
      const confirm = await vscode.window.showWarningMessage(
        "Reset all Devo game data? This cannot be undone.",
        { modal: true },
        "Reset"
      );
      if (confirm === "Reset") {
        await provider.reset();
        xpSystem.dispose();
      }
    })
  );

  context.subscriptions.push(xpSystem);
}

export function deactivate() {}
