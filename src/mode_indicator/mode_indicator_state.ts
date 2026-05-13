import { exec } from "ags/process";
import Gio from "gi://Gio?version=2.0";
import { createRoot } from "gnim";

export type ModeIndicatorState = {
    isVFIO: boolean;
};

let modeIndicatorStateInstance: ModeIndicatorState | null = null;

function createModeIndicatorState() {
    modeIndicatorStateInstance = {
        isVFIO: Gio.File.new_for_path("/sys/module/vfio").query_exists(null)
    };

    return modeIndicatorStateInstance;
}

export function modeIndicatorState() {
    return modeIndicatorStateInstance ?? createRoot(createModeIndicatorState);
}

export const gpuModeActionGroup = new Gio.SimpleActionGroup();
gpuModeActionGroup.add_action_entries([
    { name: "switch", activate: () => exec("/usr/bin/toggle-gpu-mode") },
]);

export const gpuModeMenu = new Gio.Menu();
gpuModeMenu.append("Switch GPU Mode", "gpumode.switch");
