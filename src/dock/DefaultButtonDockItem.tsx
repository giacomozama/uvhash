import { Gtk } from "ags/gtk4";
import { DockItem } from "./types";
import { createComputed, createEffect, createState } from "gnim";
import Gio from "gi://Gio?version=2.0";
import { CURSOR_POINTER } from "../utils/gtk";
import { popupParentMenuButton } from "../utils/gtk";
import { Squircle } from "../misc/Squircle";
import config from "../config";
import { findAppClient, isAppRunning, launchInHomeDir, launchOrFocus } from "../compositor/compositor";

const appMenuModel = new Gio.Menu();
appMenuModel.append("Open", `dock_item.open`);
appMenuModel.append("New instance", "dock_item.new_instance");
appMenuModel.append("Close", "dock_item.close");

export function DefaultButtonDockItem({
    leftClickPopover,
    item
}: {
    leftClickPopover?: Gtk.Popover;
    item: DockItem;
}) {
    const isAppRunningBinding = isAppRunning(item.app!);
    const [justOpenedState, setJustOpenedState] = createState(false);

    const cssClasses = createComputed(() => {
        const isAppRunning = isAppRunningBinding();
        const justOpened = justOpenedState();
        const res = ["dock-item"];
        if (isAppRunning) {
            res.push("active");
        }
        if (justOpened) {
            res.push("opening");
        }
        return res;
    });

    function doOpen() {
        if (!justOpenedState.peek() && launchOrFocus(item.app!)) {
            setJustOpenedState(true);
            setTimeout(() => setJustOpenedState(false), 2000);
        }
    }

    function doNewInstance() {
        launchInHomeDir(item.app!);
        setJustOpenedState(true);
        setTimeout(() => setJustOpenedState(false), 2000);
    }

    function doClose() {
        if (item.app) {
            findAppClient(item.app)?.kill();
        }
    }

    const actionGroup = new Gio.SimpleActionGroup();
    actionGroup.add_action_entries([
        { name: "open", activate: doOpen },
        { name: "new_instance", activate: doNewInstance },
        { name: "close", activate: doClose },
    ]);

    const rightClickPopoverMenu = (
        <contrapshellpopovermenu
            $={(self) => {
                self.set_menu_model(appMenuModel);
                self.insert_action_group("dock_item", actionGroup);

                createEffect(() => {
                    const isRunning = isAppRunningBinding();
                    (actionGroup.lookup_action("new_instance") as Gio.SimpleAction).set_enabled(isRunning);
                    (actionGroup.lookup_action("close") as Gio.SimpleAction).set_enabled(isRunning);
                });
            }}
        />
    ) as Gtk.Popover;

    return (
        <menubutton
            cssClasses={cssClasses}
            widthRequest={config.dock.itemSize}
            heightRequest={config.dock.itemSize}
            tooltipText={item.tooltip ?? item.app?.get_name() ?? ""}
            valign={Gtk.Align.CENTER}
            cursor={CURSOR_POINTER}
            popover={rightClickPopoverMenu}
        >
            <Gtk.GestureSingle
                button={1}
                onBegin={(source) => {
                    if (leftClickPopover) {
                        (source.widget as Gtk.MenuButton).popover = leftClickPopover;
                        popupParentMenuButton(source.widget);
                    } else {
                        doOpen();
                    }
                    source.set_state(Gtk.EventSequenceState.CLAIMED);
                }}
            />
            <Gtk.GestureSingle button={2} onBegin={doNewInstance} />
            <Gtk.GestureSingle
                button={3}
                onBegin={(source) => {
                    (source.widget as Gtk.MenuButton).popover = rightClickPopoverMenu;
                    popupParentMenuButton(source.widget);
                }}
            />
            <Squircle>
                <image pixelSize={config.dock.iconSize} iconName={item.iconName} cssClasses={["icon-image"]} />
            </Squircle>
        </menubutton>
    );
}
