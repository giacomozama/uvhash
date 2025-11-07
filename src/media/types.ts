import { Gdk } from "ags/gtk4";
import AstalMpris from "gi://AstalMpris?version=0.1";
import { Accessor } from "gnim";

export enum MusicVisualierMode {
    Rectangles,
    Pills,
}

export enum MediaStatus {
    Playing,
    Paused,
    Stopped,
    Dead,
}

export type MediaState = {
    status: Accessor<MediaStatus>;
    previewLabelText: Accessor<string>;
    artist: Accessor<string>;
    title: Accessor<string>;
    album: Accessor<string>;
    position: Accessor<number>;
    duration: Accessor<number>;
    artPath: Accessor<string>;
    palette: Accessor<Gdk.RGBA[] | null[]>;
    canPlayPause: Accessor<boolean>;
    playPause(): void;
    canPrevious: Accessor<boolean>;
    skipPrevious(): void;
    canNext: Accessor<boolean>;
    skipNext(): void;
    stop(): void;
    loopStatus: Accessor<AstalMpris.Loop>;
    cycleLoop(): void;
    shuffleStatus: Accessor<AstalMpris.Shuffle>;
    cycleShuffle(): void;
    seek(position: number): void;
};
