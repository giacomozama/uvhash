import { Gtk } from "ags/gtk4";
import { CURSOR_POINTER } from "../utils/gtk";
import { Squircle } from "../misc/Squircle";
import MusicLibraryPopover from "../mpd/MusicLibraryPopover";
import { mpdMusicLibrary } from "./mpd_state";
import config from "../config";

export default function MusicLibraryDockItem({ iconName }: { iconName: string }) {
    return (
        <menubutton
            cssClasses={["dock-item", "mpd"]}
            widthRequest={config.dock.itemSize}
            heightRequest={config.dock.itemSize}
            tooltipText={"Music"}
            sensitive={mpdMusicLibrary.as((ml) => !!ml.length)}
            valign={Gtk.Align.CENTER}
            cursor={CURSOR_POINTER}
        >
            <Squircle>
                <image pixelSize={config.dock.iconSize} iconName={iconName} />
            </Squircle>
            <MusicLibraryPopover />
        </menubutton>
    );
}
