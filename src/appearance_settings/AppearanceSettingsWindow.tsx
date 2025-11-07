import { Gtk } from "ags/gtk4";
import app from "ags/gtk4/app";
import { CURSOR_POINTER } from "../utils/gtk";
import { createRoot, For, onCleanup } from "gnim";
import Gio from "gi://Gio?version=2.0";
import { execAsync } from "ags/process";
import config from "../config";
import { parseRGBA, rgbToHex } from "../utils/colors";
import {
    accent1,
    accent2,
    applyAppearance,
    generatedPalette,
    setAccent1,
    setAccent2,
    setWallpaper,
    updatePalette,
    wallpaper,
} from "./appearance_settings_state";

export function AppearanceSettingsWindow() {
    return createRoot(
        (dispose) =>
            (
                <Gtk.ApplicationWindow
                    visible
                    name="appearance"
                    cssClasses={["Appearance"]}
                    title={"Appearance"}
                    application={app}
                    onCloseRequest={(self) => {
                        dispose();
                        self.destroy();
                    }}
                    $={() => {
                        onCleanup(wallpaper.subscribe(updatePalette));
                        updatePalette();
                    }}
                >
                    <box cssName="main-inner" hexpand={true} vexpand={true} orientation={Gtk.Orientation.VERTICAL}>
                        <box
                            cssClasses={["picture-box"]}
                            overflow={Gtk.Overflow.HIDDEN}
                            vexpand={true}
                            layoutManager={new Gtk.BinLayout()}
                        >
                            <Gtk.Picture
                                file={wallpaper.as(Gio.File.new_for_path)}
                                cssClasses={["wallpaper"]}
                                canShrink={true}
                                contentFit={Gtk.ContentFit.SCALE_DOWN}
                            />
                            <box cssClasses={["gloss"]} />
                        </box>
                        <box cssClasses={["colors-row"]} spacing={8}>
                            <For each={generatedPalette}>
                                {(color) => (
                                    <button
                                        css={`
                                            background-color: ${color};
                                        `}
                                        tooltipText={color}
                                        onClicked={() => {
                                            setAccent1(color);
                                        }}
                                    >
                                        <Gtk.GestureSingle button={3} onBegin={() => setAccent2(color)} />
                                    </button>
                                )}
                            </For>
                        </box>
                        <box cssClasses={["buttons-row"]} hexpand={true} spacing={8}>
                            <button
                                label={"Browse wallpaper"}
                                cssClasses={["glassy-chip-button"]}
                                cursor={CURSOR_POINTER}
                                halign={Gtk.Align.START}
                                onClicked={() => {
                                    const fileDialog = new Gtk.FileDialog();
                                    fileDialog.set_title("Select wallpaper");

                                    const filtersList = new Gio.ListStore({
                                        item_type: Gtk.FileFilter.$gtype,
                                    });

                                    filtersList.append(
                                        new Gtk.FileFilter({
                                            name: "PNG files",
                                            patterns: ["*.png"],
                                            mime_types: ["image/png"],
                                        })
                                    );

                                    if (config.appearance.defaultWallpapersDir) {
                                        fileDialog.set_initial_folder(
                                            Gio.File.new_for_path(config.appearance.defaultWallpapersDir)
                                        );
                                    }

                                    fileDialog.set_filters(filtersList);

                                    fileDialog.open(app.get_window("appearance"), null, (_, res) => {
                                        const file = fileDialog.open_finish(res);
                                        if (file) {
                                            setWallpaper(file.get_path()!);
                                        }
                                    });
                                }}
                            />
                            <button
                                cssClasses={["glassy-chip-button"]}
                                halign={Gtk.Align.END}
                                onClicked={() => {
                                    const colorDialog = new Gtk.ColorDialog();
                                    colorDialog.choose_rgba(
                                        app.get_window("appearance"),
                                        parseRGBA(accent1.get()),
                                        null,
                                        (_, res) => {
                                            const color = colorDialog.choose_rgba_finish(res);
                                            if (color) {
                                                setAccent1(rgbToHex(color));
                                            }
                                        }
                                    );
                                }}
                            >
                                <box spacing={8}>
                                    <box
                                        cssClasses={["accent-preview"]}
                                        widthRequest={20}
                                        heightRequest={20}
                                        css={accent1.as((c) => `background: ${c};`)}
                                        valign={Gtk.Align.CENTER}
                                        halign={Gtk.Align.START}
                                    />
                                    <label label={"Accent 1"} />
                                </box>
                            </button>
                            <button
                                cssClasses={["glassy-chip-button"]}
                                onClicked={() => {
                                    const colorDialog = new Gtk.ColorDialog();
                                    colorDialog.choose_rgba(
                                        app.get_window("appearance"),
                                        parseRGBA(accent2.get()),
                                        null,
                                        (_, res) => {
                                            const color = colorDialog.choose_rgba_finish(res);
                                            if (color) {
                                                setAccent2(rgbToHex(color));
                                            }
                                        }
                                    );
                                }}
                            >
                                <box spacing={8}>
                                    <box
                                        cssClasses={["accent-preview"]}
                                        widthRequest={20}
                                        heightRequest={20}
                                        css={accent2.as((c) => `background: ${c};`)}
                                        valign={Gtk.Align.CENTER}
                                        halign={Gtk.Align.START}
                                    />
                                    <label label={"Accent 2"} />
                                </box>
                            </button>
                            <box hexpand={true} />
                            <button
                                label={"Apply and restart shell"}
                                cssClasses={["glassy-chip-button"]}
                                onClicked={() => {
                                    const param1 = `${accent1.get().slice(1)}`;
                                    const param2 = `${accent2.get().slice(1)}`;
                                    applyAppearance(() =>
                                        execAsync(`${SRC}/scripts/restart_shell.sh ${param1} ${param2}`)
                                    );
                                }}
                                cursor={CURSOR_POINTER}
                                halign={Gtk.Align.END}
                            />
                            <button
                                label={"Apply"}
                                cssClasses={["glassy-chip-button"]}
                                onClicked={() => {
                                    applyAppearance(() => {});
                                }}
                                cursor={CURSOR_POINTER}
                                halign={Gtk.Align.END}
                            />
                            <button
                                label={"Cancel"}
                                cssClasses={["glassy-chip-button"]}
                                onClicked={() => app.get_window("appearance")?.close()}
                                cursor={CURSOR_POINTER}
                                halign={Gtk.Align.END}
                            />
                        </box>
                    </box>
                </Gtk.ApplicationWindow>
            ) as Gtk.Window
    );
}
