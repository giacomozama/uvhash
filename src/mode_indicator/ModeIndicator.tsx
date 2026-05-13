import { CURSOR_POINTER } from "../utils/gtk";
import { gpuModeActionGroup, gpuModeMenu, modeIndicatorState } from "./mode_indicator_state";

export default function ModeIndicator() {
    return (
        <box class={"bar-button"}>
            <menubutton
                tooltipText={modeIndicatorState().isVFIO ? "VFIO Mode" : "NVIDIA Mode"}
                cursor={CURSOR_POINTER}
                iconName={modeIndicatorState().isVFIO ? "video-display-symbolic" : "nvidia-card-symbolic"}
            >
                <contrapshellpopovermenu
                    $={(self) => {
                        self.set_menu_model(gpuModeMenu);
                        self.insert_action_group("gpumode", gpuModeActionGroup);
                    }}
                />
            </menubutton>
        </box>
    );
}
