import Gio from "gi://Gio?version=2.0";
import config from "../config";
import { createPoll } from "ags/time";
import { execAsync } from "ags/process";

export const isTrashFull = createPoll(
    false,
    config.dock.trash.checkIsFullInterval,
    config.dock.trash.checkIsFullCommand,
    (o) => o === "1"
);

export const trashActionGroup = new Gio.SimpleActionGroup();
trashActionGroup.add_action_entries([
    { name: "open", activate: () => execAsync(config.dock.trash.openCommand) },
    { name: "clear", activate: () => execAsync(config.dock.trash.emptyCommand) },
]);

export const trashMenu = new Gio.Menu();
trashMenu.append("Open", "trash.open");
trashMenu.append("Empty", "trash.clear");
