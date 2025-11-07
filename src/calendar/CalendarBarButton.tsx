import { Gtk } from "ags/gtk4";
import { CURSOR_POINTER, popdownParentMenuButton } from "../utils/gtk";
import { execAsync } from "ags/process";
import { currentDateString } from "../time/time_state";

function CalendarPopover() {
    return (
        <glassypopover widthRequest={500}>
            <box
                orientation={Gtk.Orientation.VERTICAL}
                cssClasses={["popover-standard-inner"]}
                overflow={Gtk.Overflow.HIDDEN}
            >
                <box orientation={Gtk.Orientation.HORIZONTAL} cssClasses={["popover-title"]} valign={Gtk.Align.START}>
                    <image iconName={"office-calendar-symbolic"} halign={Gtk.Align.START} />
                    <label label={"Calendar"} xalign={0} hexpand={true} />
                    <button
                        label="Show calendar"
                        cursor={CURSOR_POINTER}
                        valign={Gtk.Align.CENTER}
                        onClicked={(self) => {
                            execAsync("gnome-calendar");
                            popdownParentMenuButton(self);
                        }}
                    >
                        <box spacing={12}>
                            <image iconName="org.gnome.Calendar.Devel-symbolic" />
                            <label label="Show calendar" />
                        </box>
                    </button>
                </box>
                <Gtk.Calendar cssClasses={["calendar-full"]} />
            </box>
        </glassypopover>
    );
}

export default function CalendarBarButton() {
    return (
        <menubutton cssClasses={["calendar", "bar-button"]} halign={Gtk.Align.END} cursor={CURSOR_POINTER}>
            <label label={currentDateString.as((t) => t.replace(",", ""))} widthChars={11} />
            <CalendarPopover />
        </menubutton>
    );
}
