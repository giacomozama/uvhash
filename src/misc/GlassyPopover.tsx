import { Gdk, Gtk } from "ags/gtk4";
import Graphene from "gi://Graphene?version=1.0";
import GObject from "gnim/gobject";
import config from "../config";
import { gradientStroke } from "../utils/cairo";
import Gio from "gi://Gio?version=2.0";
import { add_throttled_tick_callback, walkChildren } from "../utils/gtk";
import { intrinsicElements } from "ags/gtk4/jsx-runtime";
import { CCProps } from "gnim";
import { eyeCandyConfig } from "../eye_candy/eye_candy_state";
import Gsk from "gi://Gsk?version=4.0";

// what follows is pure, unadulterated software butchery
// it is an insult to GTK and all of its design principles.

function addBorderToSnapshot(
    snapshot: Gtk.Snapshot,
    clock: Gdk.FrameClock,
    width: number,
    height: number,
    color1: Gdk.RGBA,
    color2: Gdk.RGBA
) {
    const rect = new Graphene.Rect({
        origin: new Graphene.Point({ x: 0, y: 0 }),
        size: new Graphene.Size({ width, height }),
    });
    const cr = snapshot.append_cairo(rect);
    gradientStroke({
        cr,
        width,
        height,
        radius: 18,
        animateBrightness: true,
        animationSpeed: 1.0,
        clock,
        color1,
        color2,
        thickness: 1.4,
    });
    cr.$dispose();
}

const GlassyMenuStack = GObject.registerClass(
    {
        GTypeName: "GlassyMenuStack",
    },
    class GlassyMenuStack extends Gtk.Stack {
        color1: Gdk.RGBA;
        color2: Gdk.RGBA;

        constructor(
            constructProperties: Partial<Gtk.Stack.ConstructorProps> & {
                color1?: Gdk.RGBA;
                color2?: Gdk.RGBA;
            }
        ) {
            const color1 = constructProperties.color1 ?? config.colors.accent1;
            const color2 = constructProperties.color2 ?? config.colors.accent2;

            delete constructProperties.color1;
            delete constructProperties.color2;

            super(constructProperties);

            this.color1 = color1;
            this.color2 = color2;

            this.add_css_class("glassy-menu-stack");
            this.color1 = constructProperties.color1 ?? config.colors.accent1;
            this.color2 = constructProperties.color2 ?? config.colors.accent2;
        }

        vfunc_map() {
            super.vfunc_map();
            if (!eyeCandyConfig.get().animateBorders) return;
            add_throttled_tick_callback(this, 120_000, (w) => {
                w.queue_draw();
                return w.get_mapped();
            });
        }

        vfunc_snapshot(snapshot: Gtk.Snapshot): void {
            super.vfunc_snapshot(snapshot);
            addBorderToSnapshot(
                snapshot,
                this.get_frame_clock()!,
                this.get_width(),
                this.get_height(),
                this.color1,
                this.color2
            );
        }
    }
);

export const GlassyMenu = GObject.registerClass(
    {
        GTypeName: "GlassyMenu",
    },
    class GlassyMenu extends Gtk.PopoverMenu {
        color1: Gdk.RGBA;
        color2: Gdk.RGBA;

        constructor(
            constructProperties: Partial<Gtk.PopoverMenu.ConstructorProps> & {
                color1?: Gdk.RGBA;
                color2?: Gdk.RGBA;
            }
        ) {
            const color1 = constructProperties.color1 ?? config.colors.accent1;
            const color2 = constructProperties.color2 ?? config.colors.accent2;

            delete constructProperties.color1;
            delete constructProperties.color2;

            super(constructProperties);

            this.color1 = color1;
            this.color2 = color2;

            this.hasArrow = false;
            this.set_flags(Gtk.PopoverMenuFlags.NESTED);
            this.set_css_classes(["menu", "glassy-menu", "fading"]);
        }

        vfunc_map() {
            this.add_css_class("visible");
            super.vfunc_map();
        }

        vfunc_unmap() {
            this.remove_css_class("visible");
            super.vfunc_unmap();
        }
    }
);

const DEFAULT_CORNER_SIZE = new Graphene.Size({ width: 18, height: 18 });
const DEFAULT_GLOSS_COLOR_INNER = new Gdk.RGBA({ red: 1, green: 1, blue: 1, alpha: 0.07 });
const DEFAULT_GLOSS_COLOR_OUTER = new Gdk.RGBA({ red: 1, green: 1, blue: 1, alpha: 0.15 });

export const GlassyPopover = GObject.registerClass(
    {
        GTypeName: "GlassyPopover",
    },
    class GlassyPopover extends Gtk.Popover {
        color1: Gdk.RGBA;
        color2: Gdk.RGBA;

        constructor(
            constructProperties: Partial<Gtk.Popover.ConstructorProps> & {
                color1?: Gdk.RGBA;
                color2?: Gdk.RGBA;
            }
        ) {
            const color1 = constructProperties.color1 || config.colors.accent1;
            const color2 = constructProperties.color2 || config.colors.accent2;

            delete constructProperties.color1;
            delete constructProperties.color2;

            super(constructProperties);

            this.color1 = color1;
            this.color2 = color2;

            this.set_position(constructProperties.position ?? null);
            this.hasArrow = constructProperties.hasArrow ?? false;
            this.set_css_classes(["fading", "popover-standard-dark"]);
        }

        vfunc_map() {
            super.vfunc_map();
            if (eyeCandyConfig.get().animateBorders) {
                add_throttled_tick_callback(this, 120_000, (w) => {
                    w.queue_draw();
                    return w.get_mapped();
                });
            }
            this.add_css_class("visible");
        }

        vfunc_unmap() {
            super.vfunc_unmap();
            this.remove_css_class("visible");
        }

        vfunc_snapshot(snapshot: Gtk.Snapshot): void {
            super.vfunc_snapshot(snapshot);
            const roundedRect = new Gsk.RoundedRect().init(
                new Graphene.Rect({
                    origin: Graphene.Point.zero(),
                    size: new Graphene.Size({
                        width: this.get_width(),
                        height: this.get_height(),
                    }),
                }),
                DEFAULT_CORNER_SIZE,
                DEFAULT_CORNER_SIZE,
                DEFAULT_CORNER_SIZE,
                DEFAULT_CORNER_SIZE
            );
            snapshot.append_inset_shadow(roundedRect, DEFAULT_GLOSS_COLOR_INNER, 0, 0, 3.5, 1);
            snapshot.append_inset_shadow(roundedRect, DEFAULT_GLOSS_COLOR_OUTER, 0, 0, 1, 0);
        }
    }
);

type Props<T extends Gtk.Widget, Props> = CCProps<T, Partial<Props>>;

declare global {
    namespace GlassyWidgets {
        class GlassyPopover extends Gtk.Popover {
            color1: Gdk.RGBA;
            color2: Gdk.RGBA;
        }

        namespace GlassyPopover {
            interface ConstructorProps extends Gtk.PopoverMenu.ConstructorProps {
                color1: Gdk.RGBA | undefined;
                color2: Gdk.RGBA | undefined;
            }
        }

        class GlassyMenu extends Gtk.PopoverMenu {
            color1: Gdk.RGBA;
            color2: Gdk.RGBA;
        }

        namespace GlassyMenu {
            interface ConstructorProps extends Gtk.PopoverMenu.ConstructorProps {
                color1: Gdk.RGBA | undefined;
                color2: Gdk.RGBA | undefined;
            }
        }
    }

    namespace JSX {
        interface IntrinsicElements {
            glassymenu: Props<GlassyWidgets.GlassyMenu, GlassyWidgets.GlassyMenu.ConstructorProps>;
            glassypopover: Props<GlassyWidgets.GlassyPopover, GlassyWidgets.GlassyPopover.ConstructorProps>;
        }
    }
}

Object.assign(intrinsicElements, {
    glassymenu: GlassyMenu,
    glassypopover: GlassyPopover,
});
