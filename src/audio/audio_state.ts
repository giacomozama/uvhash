import { Gtk } from "ags/gtk4";
import { timeout, Timer } from "ags/time";
import AstalWp from "gi://AstalWp?version=0.1";
import { Accessor, createBinding, createComputed, createState } from "gnim";
import app from "ags/gtk4/app";

export type AudioState = {
    defaultEndpoint: Accessor<AstalWp.Endpoint>;
    volume: Accessor<number>;
    muted: Accessor<boolean>;
    iconName: Accessor<string>;
    endpoints: Accessor<AstalWp.Endpoint[]>;
};

const wp = AstalWp.get_default();

const defaultSpeaker = createBinding(wp, "defaultSpeaker");
const defaultSpeakerVolume = createBinding(wp.defaultSpeaker, "volume");
const defaultSpeakerMuted = createBinding(wp.defaultSpeaker, "mute");
const defaultSpeakerIcon = createComputed([defaultSpeakerVolume, defaultSpeakerMuted], (volume, muted) =>
    volume && !muted ? "audio-volume-headphones-symbolic" : "audio-volume-muted-headphones-symbolic"
);
const speakers = createBinding(wp.audio, "speakers");

export const audioOutputState: AudioState = {
    defaultEndpoint: defaultSpeaker,
    volume: defaultSpeakerVolume,
    muted: defaultSpeakerMuted,
    iconName: defaultSpeakerIcon,
    endpoints: speakers,
};

const defaultMic = createBinding(wp, "defaultMicrophone");
const defaultMicVolume = createBinding(wp.defaultMicrophone, "volume");
const defaultMicMuted = createBinding(wp.defaultMicrophone, "mute");
const defaultMicIcon = createComputed([defaultMicVolume, defaultMicMuted], (volume, muted) =>
    volume && !muted ? "audio-input-microphone-symbolic" : "audio-input-microphone-muted-symbolic"
);
const microphones = createBinding(wp.audio, "microphones");

export const audioInputState: AudioState = {
    defaultEndpoint: defaultMic,
    volume: defaultMicVolume,
    muted: defaultMicMuted,
    iconName: defaultMicIcon,
    endpoints: microphones,
};

const [isAudioPopoverVisible, setIsAudioPopoverVisible] = createState(false);
const [showVolumeChangedWindow, setShowVolumeChangedWindow] = createState(false);
export { showVolumeChangedWindow };

export function onShowAudioPopover() {
    setShowVolumeChangedWindow(false);
    setIsAudioPopoverVisible(true);
}

export function onHideAudioPopover() {
    setIsAudioPopoverVisible(false);
}

let hasJustLaunched = true;
let volumeChangedTimer: Timer | null = null;

const VOLUME_CHANGE_SOUND = Gtk.MediaFile.new_for_filename(`${SRC}/assets/click.ogg`);

defaultSpeakerVolume.subscribe(() => {
    if (hasJustLaunched) {
        hasJustLaunched = false;
        return;
    }

    if (isAudioPopoverVisible.get()) {
        setShowVolumeChangedWindow(false);
        volumeChangedTimer?.cancel();
        volumeChangedTimer = null;
        return;
    }

    setShowVolumeChangedWindow(true);

    volumeChangedTimer?.cancel();
    volumeChangedTimer = timeout(2000, () => {
        setShowVolumeChangedWindow(false);
        volumeChangedTimer = null;
    });

    VOLUME_CHANGE_SOUND.play();
});

export const volumeIconName = createComputed([defaultSpeakerVolume, defaultSpeakerMuted], (volume, muted) => {
    if (muted || volume === 0) return "audio-volume-muted-symbolic";
    if (volume > 0.66) return "audio-volume-high-symbolic";
    if (volume > 0.33) return "audio-volume-medium-symbolic";
    return "audio-volume-low-symbolic";
});

showVolumeChangedWindow.subscribe(() => {
    const window = app.get_window("volume-change")!;
    if (showVolumeChangedWindow.get()) {
        window.show();
    } else {
        window.hide();
    }
});
