import { execAsync } from "ags/process";
import Gtk from "gi://Gtk?version=4.0";
import config from "../config";
import { getAccentGradient } from "../utils/cairo";
import { CURSOR_POINTER } from "../utils/gtk";
import { Squircle } from "../misc/Squircle";

export function SearchDockItem() {
    return (
        <button
            cssClasses={["dock-item", "search-icon"]}
            widthRequest={config.dock.itemSize}
            heightRequest={config.dock.itemSize}
            valign={Gtk.Align.CENTER}
            cursor={CURSOR_POINTER}
            onClicked={() => execAsync(config.dock.launcherCommand)}
        >
            <Squircle
                setCairoSource={(cr, width, height) => {
                    const gradient = getAccentGradient({ width, height });
                    cr.setSource(gradient);
                }}
            >
                <image pixelSize={config.dock.searchIconSize} iconName={"search-symbolic"} />
            </Squircle>
        </button>
    );
}
