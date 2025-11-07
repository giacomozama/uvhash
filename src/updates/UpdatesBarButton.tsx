import { Gtk } from "ags/gtk4";
import { CURSOR_POINTER } from "../utils/gtk";
import { popdownParentMenuButton } from "../utils/gtk";
import { For } from "gnim";
import Pango from "gi://Pango?version=1.0";
import { onInstallClicked, sortedUpdates } from "../updates/updates_state";

function UpdatesPopover() {
    return (
        <glassypopover widthRequest={500} heightRequest={650}>
            <box orientation={Gtk.Orientation.VERTICAL} cssClasses={["popover-standard-inner"]}>
                <box orientation={Gtk.Orientation.HORIZONTAL} cssClasses={["popover-title"]} valign={Gtk.Align.START}>
                    <image iconName="software-update-available-symbolic" halign={Gtk.Align.START} />
                    <label label="Software updates" xalign={0} hexpand={true} />
                    <button
                        cursor={CURSOR_POINTER}
                        valign={Gtk.Align.CENTER}
                        onClicked={(self) => {
                            onInstallClicked();
                            popdownParentMenuButton(self);
                        }}
                    >
                        <box spacing={12}>
                            <image iconName="system-software-install-symbolic" />
                            <label label="Install" />
                        </box>
                    </button>
                </box>
                <scrolledwindow overlayScrolling={true} vexpand={true}>
                    <box orientation={Gtk.Orientation.VERTICAL} class="popover-control-list">
                        <For each={sortedUpdates}>
                            {(pkg) => {
                                const spaceIndex = pkg.indexOf(" ");
                                const pkgName = pkg.slice(0, spaceIndex);
                                const pkgVersion = pkg.slice(spaceIndex + 1);

                                return (
                                    <box class="popover-control-list-item">
                                        <label
                                            label={pkgName}
                                            ellipsize={Pango.EllipsizeMode.END}
                                            xalign={0}
                                            hexpand={true}
                                        />
                                        <label class="subtext" label={pkgVersion} marginStart={12} />
                                    </box>
                                );
                            }}
                        </For>
                    </box>
                </scrolledwindow>
            </box>
        </glassypopover>
    );
}

export default function UpdatesBarButton() {
    return (
        <menubutton
            cssClasses={["updates", "bar-button"]}
            halign={Gtk.Align.START}
            widthRequest={90}
            cursor={CURSOR_POINTER}
            sensitive={sortedUpdates.as((u) => u.length > 0)}
        >
            <box>
                <image iconName="software-update-available-symbolic" marginEnd={12} />
                <label label={sortedUpdates.as((u) => `${u.length ? u.length : "-"}`)} xalign={0.5} hexpand={true} />
            </box>
            <UpdatesPopover />
        </menubutton>
    );
}
