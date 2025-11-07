import { Gtk } from "ags/gtk4";
import { CURSOR_POINTER } from "../utils/gtk";
import { BluetoothPopover } from "./BluetoothPopover";

export default function BluetoothBarButton() {
    return (
        <menubutton
            $type="start"
            cssClasses={["bar-button"]}
            cursor={CURSOR_POINTER}
            vexpand={false}
            halign={Gtk.Align.START}
        >
            <image iconName="bluetooth-symbolic" halign={Gtk.Align.CENTER} />
            <BluetoothPopover />
        </menubutton>
    );
}
