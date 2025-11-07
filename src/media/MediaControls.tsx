import { Gtk } from "ags/gtk4";
import { Accessor, createComputed, onCleanup, With } from "gnim";
import Pango from "gi://Pango?version=1.0";
import { CURSOR_POINTER } from "../utils/gtk";
import { formatSecondsToMMSS } from "../utils/time";
import { MediaStatus } from "./types";
import { activeMediaPlayer, availableMediaPlayers, mediaState, watchActivePlayer } from "./media_state";
import { popdownParentMenuButton } from "../utils/gtk";
import AstalMpris from "gi://AstalMpris?version=0.1";
import config from "../config";
import { rgbToHex } from "../utils/colors";
import { MusicVisualizer } from "./MusicVisualizer";

interface PlayerListEntry {
    busName: string;
    name: string;
    instance: string | undefined;
}

const BUS_NAME_REGEX = /org\.mpris\.MediaPlayer2\.(\w+)(?:\.instance_)?(\w+)?/;

function parsePlayerListEntry(busName: string): PlayerListEntry {
    const res = BUS_NAME_REGEX.exec(busName);
    return {
        busName,
        name: res?.[1] || busName,
        instance: res?.[2],
    };
}

const playerDropdownItems = availableMediaPlayers.as(
    (mp) => new Gtk.StringList({ strings: mp.map((p) => JSON.stringify(parsePlayerListEntry(p.busName))) })
);

const listItemFactory = new Gtk.SignalListItemFactory();

listItemFactory.connect("setup", (_, item: Gtk.ListItem) => {
    item.set_child(
        (
            <box widthRequest={100} cursor={CURSOR_POINTER} vexpand={true}>
                <label class="name" hexpand={true} xalign={0} />
                <label class="instance" xalign={1} />
            </box>
        ) as Gtk.Widget
    );
});

function bindListItem(item: Gtk.ListItem) {
    const entry = JSON.parse((item.item as Gtk.StringObject).string) as PlayerListEntry;

    const box = item.get_child() as Gtk.Box;

    const nameLabel = box.get_first_child() as Gtk.Label;
    nameLabel.set_label(entry.name);

    const instanceLabel = nameLabel.get_next_sibling() as Gtk.Label;
    instanceLabel.set_label(entry.instance ?? "");
}

listItemFactory.connect("bind", (_, item: Gtk.ListItem) => {
    bindListItem(item);
});

const accentColor1 = mediaState.palette.as((p) => p?.[0] ?? config.colors.accent1);
const accentColor2 = mediaState.palette.as((p) => p?.[1] ?? config.colors.accent2);

function MediaControlsButtons() {
    return (
        <box
            widthRequest={144}
            halign={Gtk.Align.CENTER}
            valign={Gtk.Align.CENTER}
            spacing={12}
            cssClasses={["buttons-box"]}
        >
            <button
                iconName={mediaState.shuffleStatus.as((s) =>
                    (() => {
                        switch (s) {
                            case AstalMpris.Shuffle.OFF:
                            case AstalMpris.Shuffle.UNSUPPORTED:
                                return "media-playlist-consecutive-symbolic";
                            case AstalMpris.Shuffle.ON:
                                return "media-playlist-shuffle-symbolic";
                        }
                    })()
                )}
                cssClasses={["circular"]}
                widthRequest={48}
                heightRequest={48}
                vexpand={false}
                valign={Gtk.Align.CENTER}
                cursor={CURSOR_POINTER}
                sensitive={mediaState.shuffleStatus.as((s) => s !== AstalMpris.Shuffle.UNSUPPORTED)}
                onClicked={mediaState.cycleShuffle}
            />
            <button
                iconName="media-skip-backward-symbolic"
                cssClasses={["circular"]}
                widthRequest={48}
                heightRequest={48}
                vexpand={false}
                valign={Gtk.Align.CENTER}
                cursor={CURSOR_POINTER}
                sensitive={createComputed([mediaState.position, mediaState.canPrevious], (pos, cp) =>
                    pos > 2 ? !!activeMediaPlayer?.get()?.canControl : cp
                )}
                onClicked={() => {
                    if (mediaState.position.get() > 2) {
                        mediaState.seek(0);
                    } else {
                        mediaState.skipPrevious();
                    }
                }}
            />
            <button
                iconName={mediaState.status.as((s) =>
                    s === MediaStatus.Playing ? "media-playback-pause-symbolic" : "media-playback-start-symbolic"
                )}
                cssClasses={["play-pause", "circular"]}
                widthRequest={64}
                heightRequest={64}
                vexpand={false}
                valign={Gtk.Align.CENTER}
                cursor={CURSOR_POINTER}
                sensitive={mediaState.canPlayPause}
                onClicked={mediaState.playPause}
            />
            <button
                iconName="media-skip-forward-symbolic"
                cssClasses={["circular"]}
                widthRequest={48}
                heightRequest={48}
                valign={Gtk.Align.CENTER}
                cursor={CURSOR_POINTER}
                sensitive={mediaState.canNext}
                onClicked={mediaState.skipNext}
            />
            <button
                iconName={mediaState.loopStatus.as((s) =>
                    (() => {
                        switch (s) {
                            case AstalMpris.Loop.NONE:
                            case AstalMpris.Loop.UNSUPPORTED:
                                return "media-playlist-no-repeat-symbolic";
                            case AstalMpris.Loop.TRACK:
                                return "media-playlist-repeat-one-symbolic";
                            case AstalMpris.Loop.PLAYLIST:
                                return "media-playlist-repeat-symbolic";
                        }
                    })()
                )}
                cssClasses={["circular"]}
                widthRequest={48}
                heightRequest={48}
                vexpand={false}
                valign={Gtk.Align.CENTER}
                cursor={CURSOR_POINTER}
                sensitive={mediaState.loopStatus.as((s) => s !== AstalMpris.Loop.UNSUPPORTED)}
                onClicked={mediaState.cycleLoop}
            />
        </box>
    );
}

function MediaControlsPlayerDropDown() {
    return (
        <Gtk.DropDown
            cursor={CURSOR_POINTER}
            marginEnd={8}
            halign={Gtk.Align.CENTER}
            overflow={Gtk.Overflow.HIDDEN}
            factory={listItemFactory}
            valign={Gtk.Align.CENTER}
            selected={createComputed([availableMediaPlayers, activeMediaPlayer], (available, active) => {
                for (let i = 0; i < available.length; i++) {
                    if (available[i].busName === active?.busName) return i;
                }
                return 0;
            })}
            $={(self) => {
                const model = playerDropdownItems.get();

                self.set_model(model);

                const activePlayerBusName = activeMediaPlayer.get()?.busName;
                if (activePlayerBusName) {
                    const playerCount = model.get_n_items();
                    for (let i = 0; i < playerCount; i++) {
                        const item = model.get_item(i) as Gtk.StringObject;
                        const entry = JSON.parse(item.string) as PlayerListEntry;
                        if (entry.busName === activePlayerBusName) {
                            self.set_selected(i);
                            break;
                        }
                    }
                }

                onCleanup(
                    playerDropdownItems.subscribe(() => {
                        const selectedItem = self.get_selected_item<Gtk.StringObject>();
                        const model = playerDropdownItems.get();
                        const index = selectedItem ? model.find(selectedItem.string) : Infinity;
                        self.set_model(model);
                        if (index < model.get_n_items()) {
                            self.set_selected(index);
                        }
                    })
                );

                const notifySelectedItemConnId = self.connect("notify::selected-item", (self) => {
                    const selectedItem = self.get_selected_item<Gtk.StringObject>();
                    if (!selectedItem) return;

                    const entry = JSON.parse(selectedItem.string) as PlayerListEntry;
                    const player = availableMediaPlayers.get().find((p) => p.busName === entry.busName);
                    if (!player) return;

                    watchActivePlayer(player);
                });

                onCleanup(() => self.disconnect(notifySelectedItemConnId));
            }}
        />
    );
}

function MediaControlsSongInfoBox() {
    return (
        <box cssClasses={["song-info-box"]} valign={Gtk.Align.CENTER} hexpand={true}>
            <box orientation={Gtk.Orientation.VERTICAL} valign={Gtk.Align.CENTER} hexpand={true} spacing={4}>
                <label
                    label={mediaState.artist}
                    cssClasses={["artist-label"]}
                    halign={Gtk.Align.START}
                    maxWidthChars={0}
                    wrap={true}
                    lines={1}
                    visible={mediaState.artist.as((a) => a !== "")}
                    ellipsize={Pango.EllipsizeMode.END}
                />
                <label
                    label={mediaState.title}
                    cssClasses={["title-label"]}
                    maxWidthChars={0}
                    wrap={true}
                    halign={Gtk.Align.START}
                    lines={2}
                    wrapMode={Pango.WrapMode.WORD_CHAR}
                    ellipsize={Pango.EllipsizeMode.END}
                />
                <label
                    label={mediaState.album}
                    cssClasses={["album-label"]}
                    maxWidthChars={0}
                    wrap={true}
                    halign={Gtk.Align.START}
                    lines={1}
                    visible={mediaState.album.as((a) => a !== "")}
                    ellipsize={Pango.EllipsizeMode.END}
                />
            </box>
            <button
                iconName="media-playback-stop-symbolic"
                cssClasses={["circular"]}
                widthRequest={32}
                heightRequest={32}
                vexpand={false}
                marginStart={12}
                valign={Gtk.Align.CENTER}
                halign={Gtk.Align.END}
                cursor={CURSOR_POINTER}
                visible={activeMediaPlayer.as((p) => !!p?.canControl)}
                onClicked={() => activeMediaPlayer.get()?.stop()}
            />
        </box>
    );
}

function MediaControlsPopover() {
    return (
        <glassypopover widthRequest={600} color1={accentColor1} color2={accentColor2}>
            <box
                layoutManager={new Gtk.BinLayout()}
                hexpand={true}
                vexpand={true}
                class="media-controls-popover-content"
            >
                <box cssClasses={["cover-art-background"]} overflow={Gtk.Overflow.HIDDEN}>
                    <box
                        hexpand={true}
                        vexpand={true}
                        css={mediaState.artPath.as((p) => `background-image: url("${p}");`)}
                    />
                </box>
                <box
                    hexpand={true}
                    vexpand={true}
                    orientation={Gtk.Orientation.VERTICAL}
                    cssClasses={["popover-standard-inner"]}
                >
                    <box
                        orientation={Gtk.Orientation.HORIZONTAL}
                        cssClasses={["popover-title"]}
                        valign={Gtk.Align.START}
                    >
                        <image iconName="emblem-music-symbolic" halign={Gtk.Align.START} />
                        <label label="Media" xalign={0} hexpand={true} />
                        <MediaControlsPlayerDropDown />
                        <button
                            iconName="external-link-symbolic"
                            cssClasses={["glassy-chip-button", "corner"]}
                            cursor={CURSOR_POINTER}
                            valign={Gtk.Align.CENTER}
                            sensitive={activeMediaPlayer.as((p) => p?.canRaise === true)}
                            onClicked={(self) => {
                                activeMediaPlayer.get()?.raise();
                                popdownParentMenuButton(self);
                            }}
                        />
                    </box>
                    <box orientation={Gtk.Orientation.VERTICAL} class="media-controls-inner">
                        <box orientation={Gtk.Orientation.HORIZONTAL}>
                            <box halign={Gtk.Align.START}>
                                <With value={mediaState.artPath}>
                                    {(path) =>
                                        path ? (
                                            <box layoutManager={new Gtk.BinLayout()}>
                                                <box
                                                    cssClasses={["cover-art"]}
                                                    halign={Gtk.Align.START}
                                                    css={mediaState.artPath.as((p) => `background-image: url("${p}");`)}
                                                />
                                                <box cssClasses={["gloss"]} />
                                            </box>
                                        ) : (
                                            <box layoutManager={new Gtk.BinLayout()}>
                                                <box
                                                    cssClasses={["cover-art"]}
                                                    halign={Gtk.Align.START}
                                                    overflow={Gtk.Overflow.HIDDEN}
                                                >
                                                    <image iconName={"media-album-cover"} pixelSize={128} />
                                                </box>
                                                <box cssClasses={["gloss"]} />
                                            </box>
                                        )
                                    }
                                </With>
                            </box>
                            <MediaControlsSongInfoBox />
                        </box>
                        <slider
                            cssClasses={["slider"]}
                            max={mediaState.duration}
                            min={0}
                            value={mediaState.position}
                            css={accentColor1.as((c) => `--slider-color: ${rgbToHex(c)};`)}
                            sensitive={activeMediaPlayer.as((p) => !!p?.canControl)}
                            onChangeValue={(self) => mediaState.seek(self.value)}
                        />
                        <box class="slider-labels" hexpand={true}>
                            <label
                                label={mediaState.position.as((p) => formatSecondsToMMSS(p ?? 0))}
                                halign={Gtk.Align.START}
                                hexpand={true}
                                xalign={0}
                            />
                            <label label={mediaState.duration.as((d) => formatSecondsToMMSS(d ?? 0))} xalign={1} />
                        </box>
                        <MediaControlsButtons />
                    </box>
                </box>
            </box>
        </glassypopover>
    );
}

export default function MediaControls() {
    return (
        <box layoutManager={new Gtk.BinLayout()} cssName="media-controls" hexpand={true}>
            <MusicVisualizer />
            <menubutton
                cursor={CURSOR_POINTER}
                sensitive={activeMediaPlayer.as((s) => !!s)}
                cssClasses={["bar-button"]}
                widthRequest={600}
            >
                <box
                    cssClasses={["media-controls-button-content"]}
                    orientation={Gtk.Orientation.HORIZONTAL}
                    vexpand={true}
                >
                    <image iconName="emblem-music-symbolic" marginEnd={12} />
                    <box>
                        <label
                            cssClasses={["currently-playing"]}
                            label={mediaState.previewLabelText}
                            hexpand={true}
                            xalign={0.5}
                            maxWidthChars={0}
                            wrap={true}
                            ellipsize={Pango.EllipsizeMode.END}
                        />
                    </box>
                </box>
                <MediaControlsPopover />
            </menubutton>
        </box>
    );
}
