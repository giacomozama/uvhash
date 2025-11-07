import { Gtk } from "ags/gtk4";
import { CURSOR_POINTER } from "../utils/gtk";
import app from "ags/gtk4/app";
import ShutdownWindow from "./ShutdownWindow";

export function ShutdownBarButton() {
    return (
        <box cssClasses={["bar-button"]}>
            <button
                $type="start"
                cursor={CURSOR_POINTER}
                vexpand={false}
                halign={Gtk.Align.START}
                iconName="system-shutdown-symbolic"
                onClicked={() => {
                    (app.get_window("shutdown") ?? ShutdownWindow()).show();
                }}
            />
        </box>
    );
}
