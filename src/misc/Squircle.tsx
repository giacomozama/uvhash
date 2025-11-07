import { Gtk } from "ags/gtk4";
import giCairo from "cairo";
import config from "../config";

interface SquircleParams {
    borderSmoothing: number;
    borderRadius: number;
    width: number;
    height: number;
}

export function squirclePath(cr: giCairo.Context, { borderSmoothing, borderRadius, width, height }: SquircleParams) {
    function drawSecArc(dx: number, dy: number) {
        if (dx === 0 && dy === 0) return;

        let [x0, y0] = cr.getCurrentPoint();
        const x1 = x0 + dx;
        const y1 = y0 + dy;

        const distSq = (x1 - x0) ** 2 + (y1 - y0) ** 2;
        if (distSq > 4 * borderRadius ** 2) throw Error("Points are too far apart");

        const d = Math.sqrt(distSq);

        const xm = (x0 + x1) / 2;
        const ym = (y0 + y1) / 2;
        const s = Math.sqrt(borderRadius ** 2 - distSq / 4);

        const cx = xm + s * ((y1 - y0) / d);
        const cy = ym - s * ((x1 - x0) / d);

        // we could also try this center, but it doesn't seem necessary
        // const cx1 = xm - s * ((y1 - y0) / d);
        // const cx2 = ym + s * ((x1 - x0) / d);

        const startAngle = Math.atan2(y0 - cy, x0 - cx);
        const endAngle = Math.atan2(y1 - cy, x1 - cx);

        cr.arcNegative(cx, cy, borderRadius, startAngle, endAngle);
    }

    const maxRadius = Math.min(width, height) / 2;
    borderRadius = Math.min(borderRadius, maxRadius);

    const p = Math.min((1 + borderSmoothing) * borderRadius, maxRadius);

    let angleAlpha: number;
    let angleBeta: number;

    if (borderRadius <= maxRadius / 2) {
        angleBeta = 90 * (1 - borderSmoothing);
        angleAlpha = 45 * borderSmoothing;
    } else {
        const diffRatio = (borderRadius - maxRadius / 2) / (maxRadius / 2);

        angleBeta = 90 * (1 - borderSmoothing * (1 - diffRatio));
        angleAlpha = 45 * borderSmoothing * (1 - diffRatio);
    }

    const degreesToRadians = (degrees: number) => degrees * (Math.PI / 180);

    const angleTheta = (90 - angleBeta) / 2;
    const p3ToP4Distance = borderRadius * Math.tan(degreesToRadians(angleTheta / 2));

    const circularSectionLength = Math.sin(degreesToRadians(angleBeta / 2)) * borderRadius * Math.sqrt(2);

    const c = p3ToP4Distance * Math.cos(degreesToRadians(angleAlpha));
    const d = c * Math.tan(degreesToRadians(angleAlpha));
    const b = (p - circularSectionLength - c - d) / 3;
    const a = 2 * b;

    cr.moveTo(Math.max(width / 2, width - p), 0);
    cr.curveTo(width - (p - a), 0, width - (p - a - b), 0, width - (p - a - b - c), d);
    drawSecArc(circularSectionLength, circularSectionLength);
    cr.curveTo(width, p - a - b, width, p - a, width, Math.min(height / 2, p));

    cr.lineTo(width, Math.max(height / 2, height - p));
    cr.curveTo(width, height - (p - a), width, height - (p - a - b), width - d, height - (p - a - b - c));
    drawSecArc(-circularSectionLength, circularSectionLength);
    cr.curveTo(width - (p - a - b), height, width - (p - a), height, Math.max(width / 2, width - p), height);

    cr.lineTo(Math.min(width / 2, p), height);
    cr.curveTo(p - a, height, p - a - b, height, p - a - b - c, height - d);
    drawSecArc(-circularSectionLength, -circularSectionLength);
    cr.curveTo(0, height - (p - a - b), 0, height - (p - a), 0, Math.max(height / 2, height - p));

    cr.lineTo(0, Math.min(height / 2, p));
    cr.curveTo(0, p - a, 0, p - a - b, d, p - a - b - c);
    drawSecArc(circularSectionLength, -circularSectionLength);
    cr.curveTo(p - a - b, 0, p - a, 0, Math.min(width / 2, p), 0);

    cr.closePath();
}

function drawFilledSquircle(
    cr: giCairo.Context,
    setCairoSource: (cr: giCairo.Context, width: number, height: number) => void,
    squircleParams: SquircleParams
) {
    squirclePath(cr, squircleParams);
    setCairoSource(cr, squircleParams.width, squircleParams.height);
    cr.fill();
}

function drawDangerSquircle(cr: giCairo.Context, squircleParams: SquircleParams) {
    const thickness = 12;
    const interval = 5000;
    const offset = ((Date.now() % interval) / interval) * thickness * 3;
    const { red, green, blue, alpha } = config.colors.accent1;

    squirclePath(cr, squircleParams);
    cr.setSourceRGBA(red, green, blue, 0.4);
    cr.fillPreserve();
    cr.clip();

    cr.setSourceRGBA(red, green, blue, alpha);

    for (let i = 1; i < 6; i++) {
        cr.moveTo(-thickness - offset, i * thickness * 3 - offset);
        cr.lineTo(i * thickness * 3 - offset, -thickness - offset);
        cr.setLineWidth(thickness);
        cr.stroke();
    }

    cr.fill();
}

export function Squircle({
    children,
    setCairoSource,
}: {
    children: JSX.Element;
    setCairoSource?: (cr: giCairo.Context, width: number, height: number) => void;
}) {
    return (
        <box layoutManager={new Gtk.BinLayout()}>
            <drawingarea
                cssClasses={["squircle"]}
                $={(self) => {
                    self.set_draw_func((_, cr, width, height) => {
                        drawFilledSquircle(
                            cr,
                            setCairoSource ?? ((cr: giCairo.Context) => cr.setSourceRGBA(1, 1, 1, 0.2)),
                            {
                                borderRadius: 12,
                                borderSmoothing: 1,
                                width,
                                height,
                            }
                        );
                        cr.$dispose();
                    });
                }}
            />
            {children}
        </box>
    );
}

// export function DangerSquircle({ children }: { children: JSX.Element }) {
//     let animationTimer: Timer | undefined = undefined;
//     let drawingArea: Gtk.DrawingArea | undefined = undefined;

//     return (
//         <box layoutManager={new Gtk.BinLayout()}>
//             <Gtk.GestureSingle
//                 button={1}
//                 onBegin={(source) => {
//                     source.set_state(Gtk.EventSequenceState.CLAIMED);
//                 }}
//             />
//             <Gtk.EventControllerMotion
//                 onEnter={() => {
//                     animationTimer = frameInterval(() => drawingArea?.queue_draw());
//                 }}
//                 onLeave={() => {
//                     animationTimer?.cancel();
//                     animationTimer = undefined;
//                 }}
//             />
//             <drawingarea
//                 class="squircle-danger"
//                 onMap={(self) => (drawingArea = self)}
//                 onUnmap={() => (drawingArea = undefined)}
//                 $={(self) => {
//                     self.set_draw_func((_, cr, width, height) => {
//                         drawDangerSquircle(cr, {
//                             borderRadius: 12,
//                             borderSmoothing: 1,
//                             width,
//                             height,
//                         });
//                         cr.$dispose();
//                     });
//                 }}
//             />
//             {children}
//         </box>
//     );
// }
