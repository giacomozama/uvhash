import Gio from "gi://Gio?version=2.0";
import { CURSOR_POINTER } from "../utils/gtk";
import { Gtk } from "ags/gtk4";
import { walkChildren } from "../utils/gtk";
import { createRoot } from "gnim";
import { getDBusActionGroup, getDBusMenu, gsConnectDevices } from "./gsconnect_state";

export default function GSConnectIndicator() {
    return createRoot((dispose) => (
        <menubutton
            class={"bar-button"}
            tooltipText={"GSConnect"}
            sensitive={gsConnectDevices.length > 0}
            cursor={CURSOR_POINTER}
            onUnmap={() => dispose()}
            iconName={"phone-symbolic"}
        >
            <glassymenu
                $={(self) => {
                    self.set_menu_model(getDBusMenu());

                    const activateActionGroup = Gio.DBusActionGroup.get(
                        Gio.DBus.session,
                        "org.gnome.Shell.Extensions.GSConnect",
                        "/org/gnome/Shell/Extensions/GSConnect"
                    );

                    self.insert_action_group("activate", activateActionGroup);

                    let i = 0;
                    walkChildren(self, (child) => {
                        if (child instanceof Gtk.PopoverMenu) {
                            self.insert_action_group("device", getDBusActionGroup(gsConnectDevices[i++]));
                        }
                    });
                }}
            />
        </menubutton>
    ));
}
