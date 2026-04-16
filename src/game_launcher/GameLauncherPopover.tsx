import { Gtk } from "ags/gtk4";
import { GameLauncherEntry } from "../game_launcher/types";
import { popdownParentWindow } from "../utils/gtk";
import { CURSOR_POINTER } from "../utils/gtk";
import { Squircle } from "../misc/Squircle";
import { createEffect, createState } from "gnim";
import { launchers } from "../game_launcher/game_launcher_state";
import config from "../config";
import app from "ags/gtk4/app";
import { launchOrFocus } from "../compositor/compositor";

const width = 500;
const padding = 24;
const spacing = 12;
const cols = 3;
const capsuleWidth = (width - padding * 2 - spacing * (cols - 1)) / cols;
const capsuleHeight = (capsuleWidth * 3) / 2;
const viewportHeight = capsuleHeight * 2 + padding * 2 + spacing;

function GameList({ entries }: { entries: GameLauncherEntry[] }) {
    return (
        <scrolledwindow vexpand={true} cssClasses={["game-launcher-scrolledwindow"]} heightRequest={viewportHeight}>
            <Gtk.FlowBox
                cssClasses={["game-launcher-flow-box"]}
                orientation={Gtk.Orientation.HORIZONTAL}
                activateOnSingleClick={true}
                maxChildrenPerLine={cols}
                minChildrenPerLine={cols}
                selectionMode={Gtk.SelectionMode.NONE}
                valign={Gtk.Align.START}
                rowSpacing={spacing}
                columnSpacing={spacing}
                marginBottom={24}
            >
                {entries.map((entry) => (
                    <button
                        class="game-launcher-button"
                        onClicked={(self) => {
                            try {
                                entry.command();
                            } catch (e) {
                                printerr(e);
                            }
                            popdownParentWindow(self);
                        }}
                        widthRequest={capsuleWidth}
                        heightRequest={capsuleHeight}
                        tooltipText={entry.title}
                        halign={Gtk.Align.START}
                        valign={Gtk.Align.START}
                        overflow={Gtk.Overflow.HIDDEN}
                        cursor={CURSOR_POINTER}
                    >
                        <box layoutManager={new Gtk.BinLayout()} vexpand={true} hexpand={true}>
                            <box
                                css={`
                                    background-image: url("file://${entry.image}");
                                `}
                                cssClasses={["game-launcher-thumb"]}
                                halign={Gtk.Align.FILL}
                                valign={Gtk.Align.FILL}
                                hexpand={true}
                                vexpand={true}
                            />
                            <box cssClasses={["game-launcher-thumb-gloss"]} hexpand={true} vexpand={true} />
                        </box>
                    </button>
                ))}
            </Gtk.FlowBox>
        </scrolledwindow>
    );
}

export function CombinedGameLauncherPopoverWindow() {
    const [visibleLauncher, setVisibleLauncher] = createState(launchers[0]);

    return (
        <contrapshellpopoverwindow name="game-launcher" anchoredToDock={true} widthRequest={width}>
            <box orientation={Gtk.Orientation.VERTICAL} widthRequest={width} cssClasses={["popover-standard-inner"]}>
                <box orientation={Gtk.Orientation.HORIZONTAL} cssClasses={["popover-title"]} valign={Gtk.Align.START}>
                    <image iconName="applications-games-symbolic" halign={Gtk.Align.START} />
                    <label label="Games" xalign={0} hexpand={true} />
                    <box class="button-group" valign={Gtk.Align.CENTER} overflow={Gtk.Overflow.HIDDEN}>
                        {launchers.map((launcher) => (
                            <togglebutton
                                class="glassy-chip-button"
                                onClicked={() => setVisibleLauncher(launcher)}
                                valign={Gtk.Align.CENTER}
                                active={launcher === launchers[0]}
                                cursor={CURSOR_POINTER}
                                onNotifyParent={(self) => {
                                    const group = self.parent?.get_first_child();
                                    if (group instanceof Gtk.ToggleButton && group !== self) {
                                        self.set_group(group);
                                    }
                                }}
                            >
                                <box>
                                    <image iconName={launcher.iconName} />
                                    <label label={launcher.app.get_name()} />
                                </box>
                            </togglebutton>
                        ))}
                    </box>
                    <button
                        iconName="external-link-symbolic"
                        cssClasses={["glassy-chip-button", "corner"]}
                        tooltipText={visibleLauncher.as((l) => `Launch ${l.app.get_name()}`)}
                        cursor={CURSOR_POINTER}
                        valign={Gtk.Align.CENTER}
                        onClicked={(self) => {
                            launchOrFocus(visibleLauncher.peek().app);
                            popdownParentWindow(self);
                        }}
                    />
                </box>
                <stack
                    transitionType={Gtk.StackTransitionType.CROSSFADE}
                    transitionDuration={100}
                    $={(self) => createEffect(() => self.set_visible_child_name(visibleLauncher().id))}
                >
                    {launchers.map((launcher) => (
                        <box $type="named" name={launcher.id}>
                            <GameList entries={launcher.entries} />
                        </box>
                    ))}
                </stack>
            </box>
        </contrapshellpopoverwindow>
    );
}

export function GameLauncherDockItem({ iconName, tooltip }: { iconName: string; tooltip: string }) {
    return (
        <button
            cssClasses={["dock-item"]}
            widthRequest={config.dock.itemSize}
            heightRequest={config.dock.itemSize}
            tooltipText={""}
            valign={Gtk.Align.CENTER}
            cursor={CURSOR_POINTER}
            onClicked={(self) => {
                self.add_css_class("active");
                const window = app.get_window("game-launcher") as GlassyWidgets.ContrapshellPopoverWindow;
                const connId = window.connect("hide", () => {
                    self.remove_css_class("active");
                    window.disconnect(connId);
                });
                window.show_from(self);
            }}
        >
            <Squircle>
                <image pixelSize={config.dock.iconSize} iconName={iconName} tooltipText={tooltip} />
            </Squircle>
        </button>
    );
}
