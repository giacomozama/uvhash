import { Astal, Gtk } from "ags/gtk4";
import { firstNonFullscreenMonitor } from "../compositor/compositor";
import { createRoot } from "gnim";
import app from "ags/gtk4/app";
import { audioState } from "./audio_state";
import config from "../config";

export function VolumeChangeWindow() {
    return createRoot(
        (dispose) =>
            (
                <window
                    name="volume-change"
                    gdkmonitor={firstNonFullscreenMonitor}
                    exclusivity={Astal.Exclusivity.IGNORE}
                    anchor={Astal.WindowAnchor.TOP}
                    cssClasses={["VolumeChange"]}
                    marginTop={240}
                    widthRequest={382}
                    layer={Astal.Layer.OVERLAY}
                    halign={Gtk.Align.CENTER}
                    application={app}
                    overflow={Gtk.Overflow.HIDDEN}
                    onCloseRequest={(self) => {
                        dispose();
                        self.destroy();
                    }}
                    namespace={`${config.shellName}-overlay`}
                >
                    <box orientation={Gtk.Orientation.HORIZONTAL} valign={Gtk.Align.CENTER}>
                        <image iconName={audioState().volumeIconName} pixelSize={32} />
                        <label label="Volume:" hexpand={true} widthRequest={140} xalign={1} halign={Gtk.Align.START} />
                        <label
                            cssClasses={["volume"]}
                            label={audioState().output.volume.as((v) => `${(v * 100).toFixed(0)}%`)}
                            xalign={1}
                            halign={Gtk.Align.END}
                        />
                    </box>
                </window>
            ) as Gtk.Window
    );
}
