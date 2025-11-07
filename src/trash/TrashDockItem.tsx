import { CURSOR_POINTER, popupParentMenuButton } from "../utils/gtk";
import { Gtk } from "ags/gtk4";
import AstalHyprland from "gi://AstalHyprland?version=0.1";
import { Squircle } from "../misc/Squircle";
import { GlassyMenu } from "../misc/GlassyPopover";
import { isTrashFull, trashActionGroup, trashMenu } from "./trash_state";
import config from "../config";

export default function TrashDockItem() {
    let isHovered = false;
    return (
        <menubutton
            cssClasses={["dock-item", "trash-icon"]}
            widthRequest={config.dock.itemSize}
            heightRequest={config.dock.itemSize}
            tooltipText={"Trash"}
            valign={Gtk.Align.CENTER}
            cursor={CURSOR_POINTER}
        >
            <Gtk.GestureSingle
                button={2}
                onEnd={(source) => {
                    if (!isHovered) return;
                    AstalHyprland.get_default().get_focused_client().kill();
                    source.set_state(Gtk.EventSequenceState.CLAIMED);
                }}
            />
            <Gtk.GestureSingle
                button={3}
                onEnd={(source) => {
                    popupParentMenuButton(source.widget);
                    source.set_state(Gtk.EventSequenceState.CLAIMED);
                }}
            />
            <Gtk.EventControllerMotion onEnter={() => (isHovered = true)} onLeave={() => (isHovered = false)} />
            <box layoutManager={new Gtk.BinLayout()}>
                <Squircle>
                    <image
                        pixelSize={config.dock.iconSize}
                        iconName={isTrashFull.as((f) => (f ? "trashcan_full" : "trashcan_empty"))}
                    />
                </Squircle>
            </box>
            <GlassyMenu
                $={(self) => {
                    self.set_menu_model(trashMenu);
                    self.insert_action_group("trash", trashActionGroup);
                }}
            />
        </menubutton>
    );
}
