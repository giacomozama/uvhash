import { createBinding, createComputed, createState } from "gnim";
import { MediaState, MediaStatus } from "./types";
import AstalMpris from "gi://AstalMpris?version=0.1";
import { exec } from "ags/process";
import { Gdk } from "ags/gtk4";
import { generatePalette } from "../utils/colors";
import Gio from "gi://Gio?version=2.0";
import GLib from "gi://GLib?version=2.0";
import config from "../config";

const tmpPaletteDir = `${config.path.cacheDir}/mpd/tmp_generate_palette/`;

try {
    exec(`rm -rf ${tmpPaletteDir}`);
    exec(`mkdir -p ${tmpPaletteDir}`);
} catch (e) {}

const astalMpris = AstalMpris.get_default();
const mediaPlayers = createBinding(astalMpris, "players");
export const availableMediaPlayers = createComputed((get) =>
    get(mediaPlayers).filter((p) =>
        get(createBinding(p, "playbackStatus").as((s) => s !== AstalMpris.PlaybackStatus.STOPPED))
    )
);

const [activeMediaPlayer, setActiveMediaPlayer] = createState<AstalMpris.Player | undefined>(undefined);
export { activeMediaPlayer };

const [mediaStatus, setMediaStatus] = createState(MediaStatus.Dead);
const [mediaArtist, setMediaArtist] = createState("");
const [mediaTitle, setMediaTitle] = createState("");
const [mediaAlbum, setMediaAlbum] = createState("");
const [mediaPosition, setMediaPosition] = createState(0);
const [mediaDuration, setMediaDuration] = createState(0);
const [mediaArtPath, setMediaArtPath] = createState("");
const [mediaPalette, setMediaPalette] = createState<Gdk.RGBA[] | null[]>([null, null]);
const [mediaCanPlayPause, setMediaCanPlayPause] = createState(false);
const [mediaCanPrevious, setMediaCanPrevious] = createState(false);
const [mediaCanNext, setMediaCanNext] = createState(false);
const [mediaLoopStatus, setMediaLoopStatus] = createState(AstalMpris.Loop.UNSUPPORTED);
const [mediaShuffleStatus, setMediaShuffleStatus] = createState(AstalMpris.Shuffle.UNSUPPORTED);
const mediaPreviewLabelText = createComputed([mediaStatus, mediaArtist, mediaTitle], (status, artist, title) => {
    if (status === MediaStatus.Dead || (!artist && !title)) return "No media";
    if (!artist) return title;
    if (!title) return artist;
    return `${artist}  •  ${title}`;
});

function mediaCycleLoop() {
    const player = activeMediaPlayer?.get();
    if (!player) return;

    const loopStatus = player.get_loop_status();
    if (!loopStatus) return;

    const nextLoopStatus = (() => {
        switch (loopStatus) {
            case AstalMpris.Loop.NONE:
                return AstalMpris.Loop.TRACK;
            case AstalMpris.Loop.TRACK:
                return AstalMpris.Loop.PLAYLIST;
            case AstalMpris.Loop.PLAYLIST:
                return AstalMpris.Loop.NONE;
            case AstalMpris.Loop.UNSUPPORTED:
                return AstalMpris.Loop.UNSUPPORTED;
        }
    })();

    player.set_loop_status(nextLoopStatus);
}

function mediaCycleShuffle() {
    const player = activeMediaPlayer?.get();
    if (!player) return;

    const shuffleStatus = player.get_shuffle_status();
    if (!shuffleStatus) return;

    const nextShuffleStatus = (() => {
        switch (shuffleStatus) {
            case AstalMpris.Shuffle.OFF:
                return AstalMpris.Shuffle.ON;
            case AstalMpris.Shuffle.ON:
                return AstalMpris.Shuffle.OFF;
            case AstalMpris.Shuffle.UNSUPPORTED:
                return AstalMpris.Shuffle.UNSUPPORTED;
        }
    })();

    player.set_shuffle_status(nextShuffleStatus);
}

export const mediaState: MediaState = {
    status: mediaStatus,
    previewLabelText: mediaPreviewLabelText,
    artist: mediaArtist,
    title: mediaTitle,
    album: mediaAlbum,
    position: mediaPosition,
    duration: mediaDuration,
    artPath: mediaArtPath,
    palette: mediaPalette,
    canPlayPause: mediaCanPlayPause,
    canPrevious: mediaCanPrevious,
    canNext: mediaCanNext,
    loopStatus: mediaLoopStatus,
    shuffleStatus: mediaShuffleStatus,
    playPause: () => activeMediaPlayer?.get()?.play_pause(),
    skipPrevious: () => activeMediaPlayer?.get()?.previous(),
    skipNext: () => activeMediaPlayer?.get()?.next(),
    stop: () => activeMediaPlayer?.get()?.stop(),
    cycleLoop: mediaCycleLoop,
    cycleShuffle: mediaCycleShuffle,
    seek: (position) => activeMediaPlayer?.get()?.set_position(position),
};

function getMediaStatus(status: AstalMpris.PlaybackStatus) {
    switch (status) {
        case AstalMpris.PlaybackStatus.PLAYING:
            return MediaStatus.Playing;
        case AstalMpris.PlaybackStatus.PAUSED:
            return MediaStatus.Paused;
        case AstalMpris.PlaybackStatus.STOPPED:
            return MediaStatus.Stopped;
        default:
            return MediaStatus.Dead;
    }
}

let disconnectPlayer: (() => void) | undefined;

export function watchActivePlayer(player: AstalMpris.Player | undefined) {
    if (player?.busName === activeMediaPlayer.get()?.busName) return;

    disconnectPlayer?.();
    disconnectPlayer = undefined;

    setActiveMediaPlayer(player);
    if (!player) {
        setMediaStatus(MediaStatus.Dead);
        return;
    }

    const connectionId = player.connect("notify", (source, param) => {
        switch (param.name) {
            case "playback-status":
                setMediaStatus(getMediaStatus(source.playbackStatus));
                if (source.playbackStatus === AstalMpris.PlaybackStatus.PLAYING) {
                    setMediaCanPlayPause(player.canPause);
                } else {
                    setMediaCanPlayPause(player.canPlay);
                }
                break;
            case "artist":
                setMediaArtist(source.artist ?? "");
                break;
            case "title":
                setMediaTitle(source.title ?? "");
                break;
            case "album":
                setMediaAlbum(source.album ?? "");
                break;
            case "position":
                setMediaPosition(source.position);
                break;
            case "length":
                setMediaDuration(source.length);
                break;
            case "art-url":
                setMediaArtPath(source.artUrl);
                updateBorderColor(source.artUrl);
                break;
            case "loop-status":
                setMediaLoopStatus(source.loopStatus);
                break;
            case "shuffle-status":
                setMediaShuffleStatus(source.shuffleStatus);
                break;
            case "can-go-previous":
                setMediaCanPrevious(source.canGoPrevious);
                break;
            case "can-go-next":
                setMediaCanNext(source.canGoNext);
                break;
            case "can-play":
            case "can-pause":
                if (source.playbackStatus === AstalMpris.PlaybackStatus.PLAYING) {
                    setMediaCanPlayPause(player.canPause);
                } else {
                    setMediaCanPlayPause(player.canPlay);
                }
                break;
        }
    });

    setMediaStatus(getMediaStatus(player.playbackStatus));
    if (player.playbackStatus === AstalMpris.PlaybackStatus.PLAYING) {
        setMediaCanPlayPause(player.canPause);
    } else {
        setMediaCanPlayPause(player.canPlay);
    }
    setMediaArtist(player.artist ?? "");
    setMediaTitle(player.title ?? "");
    setMediaAlbum(player.album ?? "");
    setMediaPosition(player.position);
    setMediaDuration(player.length);
    setMediaArtPath(player.artUrl);
    updateBorderColor(player.artUrl);
    setMediaLoopStatus(player.loopStatus);
    setMediaShuffleStatus(player.shuffleStatus);
    setMediaCanPrevious(player.canGoPrevious);
    setMediaCanNext(player.canGoNext);

    disconnectPlayer = () => player.disconnect(connectionId);
}

export function getIndexOfFirstPlayingPlayer() {
    const players = availableMediaPlayers.get();
    for (let i = 0; i < players.length; i++) {
        if (players[i].playbackStatus === AstalMpris.PlaybackStatus.PLAYING) {
            return i;
        }
    }
    return null;
}

let unwatchPlayers: (() => void) | undefined;

function watchPlayers() {
    unwatchPlayers?.();
    unwatchPlayers = undefined;

    const players = availableMediaPlayers.get();

    if (!players.length) {
        setActiveMediaPlayer(undefined);
        setMediaStatus(MediaStatus.Dead);
        setMediaArtist("");
        setMediaTitle("");
        setMediaAlbum("");
        setMediaPosition(0);
        setMediaDuration(0);
        setMediaArtPath("");
        setMediaLoopStatus(AstalMpris.Loop.UNSUPPORTED);
        setMediaShuffleStatus(AstalMpris.Shuffle.UNSUPPORTED);
        setMediaPalette([null, null]);
        return;
    }

    const disposeFuncs: (() => void)[] = [];

    for (const player of players) {
        function checkStatus() {
            if (activeMediaPlayer.get()?.busName === player.busName) {
                if (player.playbackStatus !== AstalMpris.PlaybackStatus.PLAYING) {
                    const index = getIndexOfFirstPlayingPlayer();
                    if (index !== null) {
                        watchActivePlayer(players[index]);
                    }
                }
            } else if (
                activeMediaPlayer.get()?.playbackStatus !== AstalMpris.PlaybackStatus.PLAYING &&
                player.playbackStatus === AstalMpris.PlaybackStatus.PLAYING
            ) {
                watchActivePlayer(player);
            }
        }

        const connectionId = player.connect("notify::playback-status", checkStatus);
        disposeFuncs.push(() => player.disconnect(connectionId));

        checkStatus();
    }

    unwatchPlayers = () => disposeFuncs.forEach((f) => f());
}

availableMediaPlayers.subscribe(watchPlayers);
watchPlayers();

const firstPlayingPlayerIndex = getIndexOfFirstPlayingPlayer();
watchActivePlayer(availableMediaPlayers.get()[firstPlayingPlayerIndex ?? 0]);

let lastPalettePath = "";

function updateBorderColor(artUrl: string) {
    const artPath = artUrl.slice(7);
    if (!artPath) {
        setMediaPalette([null, null]);
        return;
    }

    if (artPath === lastPalettePath) return;

    lastPalettePath = artPath;

    let tmpFile: Gio.File | undefined;

    function onFileReady(path: string) {
        generatePalette(path, 2, "colorful").then((palette) => {
            if (lastPalettePath === artPath) {
                setMediaPalette(palette);
            }
            tmpFile?.delete_async(0, null, (f, res) => f?.delete_finish(res));
        });
    }

    const file = Gio.File.new_for_path(artPath);
    if (file.get_basename()?.includes(".")) {
        onFileReady(artPath);
        return;
    }

    // if file has no extension, we make a temp copy of it and just hope it's JPEG
    const tmpFilePath = `${tmpPaletteDir}/${GLib.uuid_string_random()}.jpg`;
    tmpFile = Gio.File.new_for_path(tmpFilePath);
    file.copy_async(tmpFile, Gio.FileCopyFlags.OVERWRITE, 0, null, null, (_, res) => {
        if (file.copy_finish(res)) {
            onFileReady(tmpFilePath);
        } else {
            setMediaPalette([null, null]);
            tmpFile?.delete_async(0, null, (f, res) => f?.delete_finish(res));
        }
    });
}

updateBorderColor(mediaArtPath.get());
