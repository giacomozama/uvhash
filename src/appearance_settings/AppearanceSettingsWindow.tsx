import { Gtk } from "ags/gtk4";
import app from "ags/gtk4/app";
import { Accessor, createEffect, createRoot, For, onCleanup } from "gnim";
import Gio from "gi://Gio?version=2.0";
import { execAsync } from "ags/process";
import config from "../config";
import { parseRGBA, rgbToHex } from "../utils/colors";
import { appearanceSettingsState } from "./appearance_settings_state";
import Adw from "gi://Adw?version=1";
import GObject from "gnim/gobject";

function AccentButton({
    color,
    colorSetter,
    label,
}: {
    color: Accessor<string>;
    colorSetter: (color: string) => void;
    label: string;
}) {
    return (
        <button
            onClicked={() => {
                const colorDialog = new Gtk.ColorDialog();
                colorDialog.choose_rgba(
                    app.get_window("appearance"),
                    parseRGBA(appearanceSettingsState().accent1.peek()),
                    null,
                    (_, res) => {
                        const color = colorDialog.choose_rgba_finish(res);
                        if (color) {
                            colorSetter(rgbToHex(color));
                        }
                    }
                );
            }}
        >
            <box>
                <box
                    cssClasses={["accent-preview"]}
                    widthRequest={20}
                    heightRequest={20}
                    css={color.as((c) => `background: ${c};`)}
                    valign={Gtk.Align.CENTER}
                />
                <label label={label} hexpand={true} xalign={0.5} />
            </box>
        </button>
    );
}

function browseWallpaper() {
    const fileDialog = new Gtk.FileDialog();
    fileDialog.set_title("Select wallpaper");

    const filtersList = new Gio.ListStore({
        item_type: Gtk.FileFilter.$gtype,
    });

    filtersList.append(
        new Gtk.FileFilter({
            name: "PNG or JPEG files",
            patterns: ["*.png", "*.jpeg", "*.jpg"],
            mime_types: ["image/png", "image/jpeg"],
        })
    );

    if (config.appearance.defaultWallpapersDir) {
        fileDialog.set_initial_folder(Gio.File.new_for_path(config.appearance.defaultWallpapersDir));
    }

    fileDialog.set_filters(filtersList);

    fileDialog.open(app.get_window("appearance"), null, (_, res) => {
        const file = fileDialog.open_finish(res);
        if (file) {
            appearanceSettingsState().setWallpaper(file.get_path()!);
        }
    });
}

function AppearanceSettingsWindowActionButtons() {
    return (
        <box cssClasses={["buttons-bar"]} hexpand={true} spacing={8} orientation={Gtk.Orientation.VERTICAL}>
            <box orientation={Gtk.Orientation.VERTICAL} spacing={8}>
                <For each={appearanceSettingsState().generatedPalette}>
                    {(color) => (
                        <button
                            css={`
                                background-color: ${color};
                            `}
                            heightRequest={40}
                            tooltipText={color}
                            hexpand={true}
                            onClicked={() => {
                                appearanceSettingsState().setAccent1(color);
                            }}
                        >
                            <Gtk.GestureSingle button={3} onBegin={() => appearanceSettingsState().setAccent2(color)} />
                        </button>
                    )}
                </For>
            </box>
            <Gtk.Separator orientation={Gtk.Orientation.HORIZONTAL} />
            <button label={"Browse wallpaper"} onClicked={() => browseWallpaper()} />
            <AccentButton
                color={appearanceSettingsState().accent1}
                colorSetter={appearanceSettingsState().setAccent1}
                label={"Accent 1"}
            />
            <AccentButton
                color={appearanceSettingsState().accent2}
                colorSetter={appearanceSettingsState().setAccent2}
                label={"Accent 2"}
            />
            <Gtk.CheckButton
                active={appearanceSettingsState().useScrim}
                marginStart={8}
                marginEnd={8}
                hexpand={true}
                onNotifyActive={(self) => {
                    appearanceSettingsState().setUseScrim(self.active);
                }}
            >
                <label label={"Use bar scrim"} hexpand={true} />
            </Gtk.CheckButton>
            <Gtk.CheckButton
                active={appearanceSettingsState().useDarkPanels}
                marginStart={8}
                marginEnd={8}
                hexpand={true}
                onNotifyActive={(self) => {
                    appearanceSettingsState().setUseDarkPanels(self.active);
                }}
            >
                <label label={"Use dark panels"} hexpand={true} />
            </Gtk.CheckButton>
            <box vexpand={true} />
            <button
                label={"Apply and restart shell"}
                class={"suggested-action"}
                onClicked={() => {
                    const param1 = `${appearanceSettingsState().accent1.peek().slice(1)}`;
                    const param2 = `${appearanceSettingsState().accent2.peek().slice(1)}`;
                    appearanceSettingsState().applyAppearance(() =>
                        execAsync(`${SRC}/scripts/restart_shell.sh ${param1} ${param2}`)
                    );
                }}
            />
            <button
                label={"Apply"}
                onClicked={() => {
                    appearanceSettingsState().applyAppearance(() => {});
                }}
            />
            <button label={"Cancel"} onClicked={() => app.get_window("appearance")?.close()} />
        </box>
    );
}

function AppearanceSettingsWindowSplitView() {
    return (
        <Adw.OverlaySplitView cssName="main" hexpand={true} vexpand={true} sidebarPosition={Gtk.PackType.END}>
            <box $type="content">
                <Gtk.Box layoutManager={new Gtk.BinLayout()} valign={Gtk.Align.CENTER}>
                    <Gtk.Picture
                        file={appearanceSettingsState().wallpaper.as(Gio.File.new_for_path)}
                        cssClasses={["wallpaper"]}
                        canShrink={true}
                        overflow={Gtk.Overflow.HIDDEN}
                        valign={Gtk.Align.CENTER}
                        contentFit={Gtk.ContentFit.SCALE_DOWN}
                    />
                    <Gtk.Box class={"wallpaper-gloss"} />
                </Gtk.Box>
            </box>
            <box $type="sidebar" orientation={Gtk.Orientation.VERTICAL}>
                <AppearanceSettingsWindowActionButtons />
            </box>
        </Adw.OverlaySplitView>
    ) as Adw.OverlaySplitView;
}

export function AppearanceSettingsWindow() {
    return createRoot((dispose) => {
        const splitView = <AppearanceSettingsWindowSplitView />;
        return (
            <Adw.ApplicationWindow
                visible
                name="appearance"
                cssClasses={["Appearance"]}
                title={"Appearance"}
                application={app}
                onCloseRequest={(self) => {
                    dispose();
                    self.destroy();
                }}
                $={(self) => {
                    self.add_breakpoint(
                        (
                            <Adw.Breakpoint
                                condition={Adw.BreakpointCondition.new_length(
                                    Adw.BreakpointConditionLengthType.MAX_WIDTH,
                                    600,
                                    Adw.LengthUnit.SP
                                )}
                                $={(self) => {
                                    const value = new GObject.Value();
                                    value.init(GObject.TYPE_BOOLEAN);
                                    value.set_boolean(false);
                                    self.add_setter(splitView, "collapsed", value);
                                }}
                            />
                        ) as Adw.Breakpoint
                    );
                    createEffect(appearanceSettingsState().updatePalette);
                }}
            >
                <AppearanceSettingsWindowSplitView />
            </Adw.ApplicationWindow>
        ) as Gtk.Window;
    });
}
