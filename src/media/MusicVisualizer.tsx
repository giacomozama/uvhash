import giCairo from "cairo";
import config from "../config";
import { MediaStatus, MusicVisualierMode } from "./types";
import { mediaState } from "./media_state";
import { Gtk } from "ags/gtk4";
import { onCleanup } from "gnim";
import { add_throttled_tick_callback } from "../utils/gtk";
import { eyeCandyConfig } from "../eye_candy/eye_candy_state";
import { cava } from "../cava/cava_state";

function drawMusicVisualizer(cr: giCairo.Context, width: number, height: number) {
    switch (config.mediaControls.visualizerMode) {
        case MusicVisualierMode.Rectangles:
            drawMusicVisualizerRectangles(cr, width, height);
            break;
        case MusicVisualierMode.Pills:
            drawMusicVisualizerPills(cr, width, height);
            break;
    }
}

const musicVisualizerGradient = (() => {
    const { red: r1, green: g1, blue: b1, alpha: a1 } = config.colors.accent1;
    const { red: r2, green: g2, blue: b2, alpha: a2 } = config.colors.accent2;

    const gradient = new giCairo.LinearGradient(0, 0, 0, 50);

    gradient.addColorStopRGBA(0, r2, g2, b2, a2);
    gradient.addColorStopRGBA(1, r1, g1, b1, a1);

    return gradient;
})();

function drawMusicVisualizerRectangles(cr: giCairo.Context, width: number, height: number) {
    cr.setSource(musicVisualizerGradient);

    const spacing = config.mediaControls.visualizerBarSpacing;
    const cavaValues = cava!.get_values();
    const barWidth = (width - (cavaValues.length + 1) * spacing) / cavaValues.length;

    cr.moveTo(0, height);

    for (let i = 0; i < cavaValues.length; i++) {
        const val = cavaValues[i];

        const x = spacing + (barWidth + spacing) * i;
        const y = height * (1 - val);

        spacing && cr.lineTo(x, height);
        cr.lineTo(x, y);
        cr.lineTo(x + barWidth, y);
        cr.lineTo(x + barWidth, height);
    }

    cr.moveTo(width, height);
    cr.closePath();

    cr.fill();
}

function drawMusicVisualizerPills(cr: giCairo.Context, width: number, height: number) {
    cr.setSource(musicVisualizerGradient);

    const spacing = config.mediaControls.visualizerBarSpacing;
    const cavaValues = cava!.get_values();
    const barWidth = (width - (cavaValues.length + 1) * spacing) / cavaValues.length;

    cr.setLineWidth(barWidth);
    cr.setLineCap(giCairo.LineCap.ROUND);

    for (let i = 0; i < cavaValues.length; i++) {
        const val = cavaValues[i];

        const x = spacing + (barWidth + spacing) * i + barWidth / 2;
        const y = height * (1 - val) + barWidth / 2;

        cr.moveTo(x, height + barWidth / 2);
        cr.lineTo(x, y);
    }

    cr.stroke();
}

export function MusicVisualizer() {
    return (
        <drawingarea
            cssClasses={mediaState.status.as((s) => (s === MediaStatus.Playing ? ["bars"] : ["bars", "fading"]))}
            overflow={Gtk.Overflow.HIDDEN}
            halign={Gtk.Align.FILL}
            vexpand={true}
            hexpand={true}
            visible={eyeCandyConfig.as((c) => c.musicVisualizerEnabled)}
            $={(self) => {
                self.set_draw_func((_, cr, width, height) => {
                    drawMusicVisualizer(cr, width, height);
                    cr.$dispose();
                });

                let tickCallbackId: number | null = null;

                function updateTickCallback() {
                    const status = mediaState.status.get();
                    const ecConfig = eyeCandyConfig.get();

                    if (ecConfig.musicVisualizerEnabled && status === MediaStatus.Playing) {
                        tickCallbackId && self.remove_tick_callback(tickCallbackId);
                        tickCallbackId = add_throttled_tick_callback(self, ecConfig.musicVisualizerMinInterval, (w) => {
                            w.queue_draw();
                            return true;
                        });
                        return;
                    }

                    if (tickCallbackId) {
                        self.remove_tick_callback(tickCallbackId);
                        tickCallbackId = null;
                    }
                }

                onCleanup(() => tickCallbackId && self.remove_tick_callback(tickCallbackId));
                onCleanup(mediaState.status.subscribe(updateTickCallback));
                onCleanup(eyeCandyConfig.subscribe(updateTickCallback));
                updateTickCallback();
            }}
        />
    );
}
