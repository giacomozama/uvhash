import { Gtk } from "ags/gtk4";
import { CURSOR_POINTER } from "../utils/gtk";
import { Accessor } from "gnim";

export default function Notes() {
    return (
        <box cssClasses={["events"]} layoutManager={new Gtk.BinLayout()} hexpandSet={true}>
            <box orientation={Gtk.Orientation.VERTICAL} hexpand={true}>
                <box orientation={Gtk.Orientation.HORIZONTAL} cssClasses={["popover-title"]} valign={Gtk.Align.START}>
                    <image iconName={"knotes-symbolic"} halign={Gtk.Align.START} pixelSize={16} />
                    <label label="Notes" xalign={0} hexpand={true} />
                    <button cursor={CURSOR_POINTER} valign={Gtk.Align.CENTER} onClicked={() => {}}>
                        <box spacing={12}>
                            <image iconName="view-refresh-symbolic" />
                            <label label="Refresh" />
                        </box>
                    </button>
                </box>
                <scrolledwindow>
                    <box vexpand={true}>
                        
                    </box>
                </scrolledwindow>
            </box>
            <box class={"gloss"} canFocus={false} canTarget={false} />
        </box>
    );
}
