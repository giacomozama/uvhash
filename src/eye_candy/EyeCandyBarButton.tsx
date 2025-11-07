import { Gtk } from "ags/gtk4";
import { CURSOR_POINTER } from "../utils/gtk";
import { EyeCandyMode } from "../eye_candy/types";
import { eyeCandyConfig, setEyeCandyMode } from "../eye_candy/eye_candy_state";

function EyeCandyPopover() {
    const optionButton = (mode: EyeCandyMode, iconName: string, title: string, description: string) => {
        const active = eyeCandyConfig.as((c) => c.eyeCandyMode === mode);
        return (
            <togglebutton
                class={"popover-control-list-item"}
                cursor={CURSOR_POINTER}
                onClicked={() => setEyeCandyMode(mode)}
                active={active}
            >
                <box>
                    <image
                        class="popover-control-list-item-icon"
                        valign={Gtk.Align.CENTER}
                        iconName={iconName}
                        pixelSize={16}
                    />
                    <box orientation={Gtk.Orientation.VERTICAL} hexpand={true}>
                        <label class={"title"} label={title} xalign={0} />
                        <label class={"description"} label={description} xalign={0} wrap={true} maxWidthChars={0} />
                    </box>
                    <box widthRequest={20} marginStart={18}>
                        <image
                            class="checkmark"
                            iconName="checkmark-symbolic"
                            visible={active}
                            valign={Gtk.Align.CENTER}
                            halign={Gtk.Align.END}
                        />
                    </box>
                </box>
            </togglebutton>
        );
    };

    return (
        <glassypopover widthRequest={500}>
            <box orientation={Gtk.Orientation.VERTICAL} class="popover-standard-inner">
                <box orientation={Gtk.Orientation.HORIZONTAL} class="popover-title" valign={Gtk.Align.START}>
                    <image iconName="starred-symbolic" halign={Gtk.Align.START} />
                    <label label="Eye candy" xalign={0} hexpand={true} />
                </box>
                <box orientation={Gtk.Orientation.VERTICAL} class={"popover-control-list"}>
                    {optionButton(
                        EyeCandyMode.Off,
                        "non-starred-symbolic",
                        "Off",
                        "Disable popover border animations, music visualizer and background toy."
                    )}
                    {optionButton(
                        EyeCandyMode.Performance,
                        "semi-starred-symbolic",
                        "Performance",
                        "Disable background toy Cava integration and reduce its framerate. Reduce music visualizer framerate."
                    )}
                    {optionButton(
                        EyeCandyMode.Balanced,
                        "starred-symbolic",
                        "Balanced",
                        "Enable all eye candy effects, with throttled redraws."
                    )}
                    {optionButton(
                        EyeCandyMode.Cranked,
                        "fire-symbolic",
                        "Cranked",
                        "Enable all eye candy effects, with unthrottled redraws. Heavily increases CPU usage."
                    )}
                </box>
            </box>
        </glassypopover>
    );
}

export default function EyeCandyBarButton() {
    return (
        <menubutton
            cssClasses={["eye-candy", "bar-button"]}
            halign={Gtk.Align.START}
            cursor={CURSOR_POINTER}
            iconName={eyeCandyConfig.as((c) => {
                switch (c.eyeCandyMode) {
                    case EyeCandyMode.Off:
                        return "non-starred-symbolic";
                    case EyeCandyMode.Performance:
                        return "semi-starred-symbolic";
                    case EyeCandyMode.Balanced:
                        return "starred-symbolic";
                    case EyeCandyMode.Cranked:
                        return "fire-symbolic";
                }
            })}
        >
            <EyeCandyPopover />
        </menubutton>
    );
}
