import { execAsync } from "ags/process";
import { Album, Song } from "./types";
import config from "../config";
import GLib from "gi://GLib?version=2.0";
import Gio from "gi://Gio?version=2.0";
import { createBinding, createState } from "gnim";
import AstalMpris from "gi://AstalMpris?version=0.1";
import { readFile, writeFileAsync } from "ags/file";

const astalMpris = AstalMpris.get_default();
const mpdPlayer = createBinding(astalMpris, "players").as((ps) =>
    ps.find((p) => p.busName === "org.mpris.MediaPlayer2.mpd")
);
const mpcBin = config.path.mpc;

const [mpdMusicLibrary, setMusicLibrary] = createState<Album[]>([]);
const allSongs: Song[] = [];

(async () => {
    const albums = new Map<string, Album>();
    const raw = await execAsync(
        `${mpcBin} -f %album%\\\\n%albumartist%\\\\n%title%\\\\n%artist%\\\\n%file%\\\\n%track%\\\\n%time%\\\\n listall`
    );
    const rawSongs = raw.split("\n\n").map((s) => s.split("\n"));

    for (const [albumTitle, albumArtist, title, artist, file, track, time] of rawSongs) {
        const key = JSON.stringify([albumTitle, albumArtist]);
        let album = albums.get(key);

        if (!album) {
            album = {
                title: albumTitle,
                artist: albumArtist,
                coverArtPath: "",
                songs: [],
            };
            albums.set(key, album);
        }

        const song: Song = {
            title,
            artist,
            file,
            track: parseInt(track),
            time,
        };

        allSongs.push(song);
        album.songs.push(song);
    }

    GLib.mkdir_with_parents(config.mpd.coversCacheDir, 493);

    const indexFile = Gio.file_new_for_path(`${config.mpd.coversCacheDir}/index.json`);
    const cacheIndex: { [key: string]: string } = indexFile.query_exists(null) ? JSON.parse(readFile(indexFile)) : {};

    for (const album of albums.values()) {
        album.songs.sort((a, b) => a.track - b.track);

        const file = album.songs[0].file;

        let uuid = cacheIndex[file];
        if (!uuid) {
            uuid = GLib.uuid_string_random();

            let newFilePath: string | undefined;

            const extensions = ["jpg", "jpeg", "png", "webp", "gif", "tiff"];
            function findExternalCover() {
                for (const ext of extensions) {
                    const dir = file?.split("/").slice(0, -1).join("/");
                    const externalCover = `${config.mpd.musicLibraryDir}/${dir}/cover.${ext}`;
                    if (Gio.file_new_for_path(externalCover).query_exists(null)) {
                        return externalCover;
                    }
                }
                return null;
            }

            const externalCover = findExternalCover();
            if (externalCover) {
                newFilePath = externalCover;
            } else {
                try {
                    await execAsync(
                        `${SRC}/scripts/compress_cover_art.sh \"${file}\" \"${config.mpd.coversCacheDir}/tmp_embedded\"`
                    );
                } catch (e) {
                    printerr(e);
                    continue;
                }
                newFilePath = `${config.mpd.coversCacheDir}/tmp_embedded`;
            }

            if (newFilePath) {
                try {
                    await execAsync(
                        `${config.path.magick} "${newFilePath}" -resize 150x150 -quality 70 "${config.mpd.coversCacheDir}/${uuid}.jpg"`
                    );
                } catch (e) {
                    printerr(e);
                    continue;
                }
                cacheIndex[file] = uuid;
            }
        }

        album.coverArtPath = `${config.mpd.coversCacheDir}/${uuid}.jpg`;
    }

    writeFileAsync(indexFile, JSON.stringify(cacheIndex));

    setMusicLibrary([...albums.values()]);
})();

const [currentMpdSongFile, setCurrentSongFile] = createState("");

function updateCurrentSong() {
    execAsync(`${mpcBin} -f %file% current`)
        .then((file) => setCurrentSongFile(file))
        .catch(() => setCurrentSongFile(""));
}

let disconnectPlayerTitle: (() => void) | undefined;

function watchTitle() {
    disconnectPlayerTitle?.();
    disconnectPlayerTitle = undefined;

    const player = mpdPlayer.get();
    if (!player) return;

    const connId = player.connect("notify::title", updateCurrentSong);
    disconnectPlayerTitle = () => player.disconnect(connId);

    updateCurrentSong();
}

mpdPlayer.subscribe(watchTitle);
watchTitle();

function mpdPlaySongs(songs: Song[], startingFrom: number) {
    let command = `${mpcBin} clear`;
    for (const song of songs) {
        const escapedPath = song.file.replaceAll("'", "\\'");
        command += ` && ${mpcBin} add $'${escapedPath}'`;
    }
    command += ` && ${mpcBin} play ${Math.floor(startingFrom) + 1}`;
    execAsync(`/bin/bash -c "${command}"`).catch(printerr);
}

function mpdPlayAlbum(album: Album, startingFrom: number) {
    mpdPlaySongs(album.songs, startingFrom);
}

function mpdShufflePlayAll() {
    const startingFrom = Math.random() * allSongs.length;
    const command = `${mpcBin} clear && mpc add / && mpc random on && mpc play ${Math.floor(startingFrom) + 1}`;
    execAsync(`/bin/bash -c "${command}"`).catch(printerr);
}

export { currentMpdSongFile, mpdMusicLibrary, mpdPlayAlbum, mpdShufflePlayAll };
