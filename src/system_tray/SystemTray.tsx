import { Gtk } from "ags/gtk4";
import AstalTray from "gi://AstalTray?version=0.1";
import { createBinding, createRoot, For } from "gnim";
import { CURSOR_POINTER } from "../utils/gtk";
import { trayItems } from "../system_tray/system_tray_state";
import { BarDivider } from "../bar/BarDivider";

export function MenuTrayItem({ item }: { item: AstalTray.TrayItem }) {
    return (
        <menubutton cursor={CURSOR_POINTER} tooltipText={createBinding(item, "tooltipText")}>
            <image pixelSize={16} valign={Gtk.Align.CENTER} gicon={createBinding(item, "gicon")} />
            <glassymenu
                menuModel={createBinding(item, "menu_model")}
                $={(self) => {
                    self.insert_action_group("dbusmenu", item.actionGroup);
                }}
            />
        </menubutton>
    );
}

function ButtonTrayItem({ item }: { item: AstalTray.TrayItem }) {
    return createRoot((dispose) => (
        <button
            cursor={CURSOR_POINTER}
            tooltipText={createBinding(item, "tooltipText")}
            onUnmap={dispose}
            onClicked={() => {}}
        >
            <image pixelSize={16} valign={Gtk.Align.CENTER} gicon={createBinding(item, "gicon")} />
        </button>
    ));
}

export default function SystemTray() {
    return (
        <box class="bar-group" overflow={Gtk.Overflow.HIDDEN}>
            <box
                orientation={Gtk.Orientation.HORIZONTAL}
                cssClasses={["bar-chip", "system-tray"]}
                vexpand={true}
                visible={trayItems.as((ti) => !!ti.length)}
                overflow={Gtk.Overflow.HIDDEN}
            >
                <box visible={trayItems.as((ti) => !!ti.length)}>
                    <BarDivider />
                </box>
                <For each={trayItems}>
                    {(trayItem) => (
                        <box cssClasses={["tray-icon"]}>
                            {trayItem.menuModel ? <MenuTrayItem item={trayItem} /> : <ButtonTrayItem item={trayItem} />}
                        </box>
                    )}
                </For>
            </box>
        </box>
    );
}
