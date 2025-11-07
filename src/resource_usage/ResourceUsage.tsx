import { Gtk } from "ags/gtk4";
import { Accessor, onCleanup } from "gnim";
import { resourceUsage } from "../resource_usage/resource_usage_state";
import giCairo from "cairo";
import config from "../config";

const STROKE_WIDTH = 3.5;
const CIRCLE_GAP = Math.PI / 4;
const START_ANGLE = -(3 / 2) * Math.PI + CIRCLE_GAP;
const LOW_USAGE_COLOR_RGB = [35 / 255, 161 / 255, 0];
const HIGH_USAGE_COLOR_RGB = [255 / 255, 32 / 255, 84 / 255];

const mixedColor = [config.colors.accent2.red, config.colors.accent2.green, config.colors.accent2.blue];

function mixUsageColors(fraction: number) {
    // mixedColor[0] = LOW_USAGE_COLOR_RGB[0] * (1 - fraction) + HIGH_USAGE_COLOR_RGB[0] * fraction;
    // mixedColor[1] = LOW_USAGE_COLOR_RGB[1] * (1 - fraction) + HIGH_USAGE_COLOR_RGB[1] * fraction;
    // mixedColor[2] = LOW_USAGE_COLOR_RGB[2] * (1 - fraction) + HIGH_USAGE_COLOR_RGB[2] * fraction;
    return mixedColor;
}

function drawDial(cr: giCairo.Context, width: number, height: number, fraction: number) {
    cr.setLineWidth(STROKE_WIDTH);
    cr.setLineCap(giCairo.LineCap.ROUND);

    const radius = (width - STROKE_WIDTH) / 2;

    cr.arc(width / 2, height / 2, radius, START_ANGLE, Math.PI / 2 - CIRCLE_GAP);
    cr.setSourceRGBA(1, 1, 1, 0.2);
    cr.stroke();

    cr.arc(width / 2, height / 2, radius, START_ANGLE, START_ANGLE + (2 * Math.PI - CIRCLE_GAP * 2) * fraction);

    const [red, green, blue] = mixUsageColors(fraction);
    cr.setSourceRGBA(red, green, blue, 1);
    cr.stroke();
}

function ResourceDial({
    name,
    iconName,
    percentage,
    iconMargin = 0,
}: {
    name: string;
    iconName: string;
    percentage: Accessor<number>;
    // cause the nvidia icon looks 1 px off to me and that bothers me a lot
    iconMargin?: number;
}) {
    return (
        <box
            layoutManager={new Gtk.BinLayout()}
            tooltipMarkup={percentage.as((p) => `<b>${name}:</b> ${p.toFixed(0).padStart(3, " ")}%`)}
        >
            <drawingarea
                widthRequest={32}
                heightRequest={32}
                halign={Gtk.Align.CENTER}
                valign={Gtk.Align.CENTER}
                $={(self) => {
                    self.set_draw_func((_, cr, width, height) => {
                        drawDial(cr, width, height, percentage.get() / 100);
                        cr.$dispose();
                    });

                    onCleanup(
                        percentage.subscribe(() => {
                            self.queue_draw();
                        })
                    );
                }}
            />
            <image
                iconName={iconName}
                marginEnd={iconMargin}
                pixelSize={16}
            />
        </box>
    );
}

export function ResourceUsageDash() {
    return (
        <box
            orientation={Gtk.Orientation.HORIZONTAL}
            cssName="resource-dials-container"
            spacing={8}
            marginTop={6}
            marginBottom={2}
            marginStart={8}
            marginEnd={8}
            valign={Gtk.Align.CENTER}
        >
            <ResourceDial name="CPU" iconName="cpu-symbolic" percentage={resourceUsage.as((r) => r.cpu)} />
            <ResourceDial name="RAM" iconName="ram-symbolic" percentage={resourceUsage.as((r) => r.ram)} />
            <ResourceDial
                name="GPU"
                iconName="nvidia-card-symbolic"
                percentage={resourceUsage.as((r) => r.gpu)}
                iconMargin={2}
            />
        </box>
    );
}
