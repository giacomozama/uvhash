import { Gtk } from "ags/gtk4";

export function BarDivider() {
    return <Gtk.Separator orientation={Gtk.Orientation.VERTICAL} />;
}
