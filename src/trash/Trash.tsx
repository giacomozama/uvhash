import { CURSOR_POINTER, popupParentMenuButton } from "../utils/gtk";
import { Gtk } from "ags/gtk4";
import { Squircle } from "../misc/Squircle";
import { ContrapshellPopoverMenu } from "../misc/GlassyPopover";
import { isTrashFull, trashActionGroup, trashMenu } from "./trash_state";
import config from "../config";
import { closeFocusedApp } from "../compositor/compositor";

export default function Trash() {
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
                    closeFocusedApp();
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
            <ContrapshellPopoverMenu
                $={(self) => {
                    self.set_menu_model(trashMenu);
                    self.insert_action_group("trash", trashActionGroup);
                }}
            />
        </menubutton>
    );
}
