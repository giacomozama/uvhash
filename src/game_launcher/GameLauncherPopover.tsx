import { Gtk } from "ags/gtk4";
import AstalApps from "gi://AstalApps?version=0.1";
import { GameLauncherEntry } from "../game_launcher/types";
import { Monitor } from "../utils/monitors";
import { launchOrFocus } from "../utils/apps";
import { popdownParentMenuButton } from "../utils/gtk";
import { CURSOR_POINTER } from "../utils/gtk";
import { execAsync } from "ags/process";
import { Squircle } from "../misc/Squircle";
import { steamEntries } from "../game_launcher/steam";
import { bottlesEntries } from "../game_launcher/bottles";
import { createState, onCleanup } from "gnim";
import { DockItem } from "../dock/types";
import { titleCase } from "../utils/strings";
import { launchers } from "../game_launcher/game_launcher_state";
import config from "../config";

const width = 500;
const padding = 24;
const spacing = 12;
const cols = 3;
const capsuleWidth = (width - padding * 2 - spacing * (cols - 1)) / cols;
const capsuleHeight = (capsuleWidth * 3) / 2;
const viewportHeight = capsuleHeight * 2 + padding * 2 + spacing;

const gameLauncherDropdownItems = new Gtk.StringList({
    strings: launchers.map(({ id, iconName }) => JSON.stringify({ id, iconName })),
});

const listItemFactory = new Gtk.SignalListItemFactory();

listItemFactory.connect("setup", (_, item: Gtk.ListItem) =>
    item.set_child(
        (
            <box widthRequest={100} cursor={CURSOR_POINTER} vexpand={true} spacing={8}>
                <image />
                <label hexpand={true} xalign={0.5} />
            </box>
        ) as Gtk.Widget
    )
);

function bindListItem(item: Gtk.ListItem) {
    const entry = JSON.parse((item.item as Gtk.StringObject).string) as { id: string; iconName: string };

    const box = item.get_child() as Gtk.Box;

    const icon = box.get_first_child() as Gtk.Image;
    icon.set_from_icon_name(entry.iconName);

    const nameLabel = icon.get_next_sibling() as Gtk.Label;
    nameLabel.set_label(titleCase(entry.id));
}

listItemFactory.connect("bind", (_, item: Gtk.ListItem) => bindListItem(item));

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
                        cssClasses={["game-launcher-button"]}
                        onClicked={(self) => {
                            execAsync(entry.command).catch();
                            popdownParentMenuButton(self);
                        }}
                        widthRequest={capsuleWidth}
                        heightRequest={capsuleHeight}
                        label={entry.title}
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

function CombinedGameLauncherPopover({ monitor }: { monitor: Monitor }) {
    const [visibleLauncher, setVisibleLauncher] = createState(launchers[0]);

    return (
        <glassypopover marginBottom={15}>
            <box orientation={Gtk.Orientation.VERTICAL} widthRequest={width} cssClasses={["popover-standard-inner"]}>
                <box orientation={Gtk.Orientation.HORIZONTAL} cssClasses={["popover-title"]} valign={Gtk.Align.START}>
                    <image iconName="applications-games-symbolic" halign={Gtk.Align.START} />
                    <label label="Games" xalign={0} hexpand={true} />
                    <Gtk.DropDown
                        model={gameLauncherDropdownItems}
                        cursor={CURSOR_POINTER}
                        marginEnd={8}
                        halign={Gtk.Align.CENTER}
                        valign={Gtk.Align.CENTER}
                        overflow={Gtk.Overflow.HIDDEN}
                        factory={listItemFactory}
                        onNotifySelectedItem={(self) => {
                            const { id } = JSON.parse(self.get_selected_item<Gtk.StringObject>()!.string) as {
                                id: string;
                            };
                            setVisibleLauncher(launchers.find((l) => l.id === id)!);
                        }}
                    />
                    <button
                        iconName="external-link-symbolic"
                        cssClasses={["glassy-chip-button", "corner"]}
                        tooltipText={visibleLauncher.as((l) => `Launch ${l.app.name}`)}
                        cursor={CURSOR_POINTER}
                        valign={Gtk.Align.CENTER}
                        onClicked={(self) => {
                            launchOrFocus(visibleLauncher.get().app, monitor);
                            popdownParentMenuButton(self);
                        }}
                    />
                </box>
                <stack
                    transitionType={Gtk.StackTransitionType.CROSSFADE}
                    transitionDuration={100}
                    $={(self) => {
                        onCleanup(
                            visibleLauncher.subscribe(() => self.set_visible_child_name(visibleLauncher.get().id))
                        );
                        self.set_visible_child_name(visibleLauncher.get().id);
                    }}
                >
                    {launchers.map((launcher) => (
                        <box $type="named" name={launcher.id}>
                            <GameList entries={launcher.entries} />
                        </box>
                    ))}
                </stack>
            </box>
        </glassypopover>
    ) as Gtk.Popover;
}

function GameLauncherPopover({
    app,
    iconName,
    entries,
    monitor,
}: {
    app: AstalApps.Application;
    iconName: string;
    entries: GameLauncherEntry[];
    monitor: Monitor;
}) {
    return (
        <glassypopover marginBottom={15}>
            <box orientation={Gtk.Orientation.VERTICAL} widthRequest={width} cssClasses={["popover-standard-inner"]}>
                <box orientation={Gtk.Orientation.HORIZONTAL} cssClasses={["popover-title"]} valign={Gtk.Align.START}>
                    <image iconName={iconName} halign={Gtk.Align.START} />
                    <label label={app.name} xalign={0} hexpand={true} />
                    <button
                        label={`Open ${app.name}`}
                        cursor={CURSOR_POINTER}
                        valign={Gtk.Align.CENTER}
                        onClicked={(self) => {
                            launchOrFocus(app, monitor);
                            popdownParentMenuButton(self);
                        }}
                    />
                </box>
                <GameList entries={entries} />
            </box>
        </glassypopover>
    ) as Gtk.Popover;
}

export function GameLauncherDockItem({
    iconName,
    tooltip,
    monitor,
}: {
    iconName: string;
    tooltip: string;
    monitor: Monitor;
}) {
    return (
        <menubutton
            cssClasses={["dock-item"]}
            widthRequest={config.dock.itemSize}
            heightRequest={config.dock.itemSize}
            tooltipText={""}
            valign={Gtk.Align.CENTER}
            cursor={CURSOR_POINTER}
        >
            <Squircle>
                <image pixelSize={config.dock.iconSize} iconName={iconName} tooltipText={tooltip} />
            </Squircle>
            <CombinedGameLauncherPopover monitor={monitor} />
        </menubutton>
    );
}

export function SteamGameLauncherPopover({ item, monitor }: { item: DockItem; monitor: Monitor }) {
    return (
        <GameLauncherPopover app={item.app!} iconName={item.iconName} entries={steamEntries} monitor={monitor} />
    ) as Gtk.Popover;
}

export function BottlesGameLauncherPopover({ item, monitor }: { item: DockItem; monitor: Monitor }) {
    return (
        <GameLauncherPopover app={item.app!} iconName={item.iconName} entries={bottlesEntries} monitor={monitor} />
    ) as Gtk.Popover;
}
