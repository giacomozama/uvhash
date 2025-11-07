import { Accessor } from "gnim";

export type Album = {
    title: string;
    artist: string;
    coverArtPath: string;
    songs: Song[];
};

export type Song = {
    title: string;
    artist: string;
    file: string;
    track: number;
    time?: string;
};
