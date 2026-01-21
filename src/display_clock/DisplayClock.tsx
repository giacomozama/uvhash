import { Gtk } from "ags/gtk4";
import { createPoll } from "ags/time";
import { Accessor } from "gnim";

const TIME_OPTIONS: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
};

function getTime() {
    const timeString = new Date().toLocaleTimeString("en-US", TIME_OPTIONS);
    const [hours, minutes] = timeString.split(":");
    return { hours, minutes };
}

function getDate() {
    const now = new Date();
    return {
        weekday: now.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase(),
        month: now.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
        day: now.toLocaleDateString("en-US", { day: "numeric" }),
    };
}

const currentTime = createPoll(getTime(), 1000, getTime);
const currentDate = createPoll(getDate(), 1000, getDate);

export function DisplayClock() {
    return (
        <box hexpand={true} vexpand={true} class="display-clock-calendar-container">
            <box
                class="display-clock-calendar"
                orientation={Gtk.Orientation.VERTICAL}
                hexpand={true}
                valign={Gtk.Align.CENTER}
                halign={Gtk.Align.CENTER}
            >
                <box class="clock-time" halign={Gtk.Align.CENTER}>
                    <label class="clock-time-hours" label={currentTime.as((t) => t.hours)} />
                    <label label={currentTime.as((t) => t.minutes)} />
                </box>
                <box class="clock-date" halign={Gtk.Align.CENTER} spacing={12}>
                    <label class="clock-date-weekday" label={currentDate.as((d) => d.weekday)} />
                    <label class="clock-date-month" label={currentDate.as((d) => d.month)} />
                    <label class="clock-date-day" label={currentDate.as((d) => d.day)} />
                </box>
            </box>
        </box>
    );
}
