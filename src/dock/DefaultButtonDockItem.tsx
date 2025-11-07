import { Gtk } from "ags/gtk4";
import { Monitor } from "../utils/monitors";
import { DockItem } from "./types";
import { createComputed, createState, onCleanup } from "gnim";
import { findAppClient, isAppRunning, launchOrFocus } from "../utils/apps";
import Gio from "gi://Gio?version=2.0";
import { CURSOR_POINTER } from "../utils/gtk";
import { popupParentMenuButton } from "../utils/gtk";
import { Squircle } from "../misc/Squircle";
import { GlassyMenu } from "../misc/GlassyPopover";
import config from "../config";

const appMenuModel = new Gio.Menu();
appMenuModel.append("Open", `dock_item.open`);
appMenuModel.append("New instance", "dock_item.new_instance");
appMenuModel.append("Close", "dock_item.close");

export function DefaultButtonDockItem({
    leftClickPopover,
    item,
    monitor,
}: {
    leftClickPopover?: Gtk.Popover;
    item: DockItem;
    monitor: Monitor;
}) {
    const isAppRunningBinding = isAppRunning(item.app!);
    const [justOpened, setJustOpened] = createState(false);

    const cssClasses = createComputed([isAppRunningBinding, justOpened], (isAppRunning, justOpened) => {
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
        if (!justOpened.get() && launchOrFocus(item.app!, monitor)) {
            setJustOpened(true);
            setTimeout(() => setJustOpened(false), 2000);
        }
    }

    function doNewInstance() {
        item.app!.launch();
        setJustOpened(true);
        setTimeout(() => setJustOpened(false), 2000);
    }

    function doClose() {
        findAppClient(item.app!)?.kill();
    }

    const actionGroup = new Gio.SimpleActionGroup();
    actionGroup.add_action_entries([
        { name: "open", activate: doOpen },
        { name: "new_instance", activate: doNewInstance },
        { name: "close", activate: doClose },
    ]);

    const rightClickPopoverMenu = (
        <GlassyMenu
            $={(self) => {
                self.set_menu_model(appMenuModel);
                self.insert_action_group("dock_item", actionGroup);

                function updateEnabledActions() {
                    const isRunning = isAppRunningBinding.get();
                    (actionGroup.lookup_action("new_instance") as Gio.SimpleAction).set_enabled(isRunning);
                    (actionGroup.lookup_action("close") as Gio.SimpleAction).set_enabled(isRunning);
                }

                onCleanup(isAppRunningBinding.subscribe(updateEnabledActions));
                updateEnabledActions();
            }}
        />
    ) as Gtk.Popover;

    return (
        <menubutton
            cssClasses={cssClasses}
            widthRequest={config.dock.itemSize}
            heightRequest={config.dock.itemSize}
            tooltipText={item.tooltip ?? item.app?.name ?? ""}
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
                <image
                    pixelSize={config.dock.iconSize}
                    iconName={item.iconName}
                    cssClasses={["icon-image"]}
                />
            </Squircle>
        </menubutton>
    );
}
