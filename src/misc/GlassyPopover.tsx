import { Astal, Gdk, Gtk } from "ags/gtk4";
import Graphene from "gi://Graphene?version=1.0";
import GObject from "gnim/gobject";
import config from "../config";
import { intrinsicElements } from "ags/gtk4/jsx-runtime";
import { Accessor, CCProps } from "gnim";
import Gsk from "gi://Gsk?version=4.0";
import Gtk4LayerShell from "gi://Gtk4LayerShell?version=1.0";
import app from "ags/gtk4/app";
import { bezierEasing } from "../utils/cubic_bezier";
import Gio from "gi://Gio?version=2.0";
import GLib from "gi://GLib?version=2.0";

let currentPopoverMenu: GlassyWidgets.ContrapshellPopoverMenu | undefined;

const easeOutQuint = bezierEasing({ x: 0.23, y: 1 }, { x: 0.32, y: 1 });

export function PopoverOutsideClickInterceptor(monitor: Gdk.Monitor) {
    return (
        <window
            name={`outside-click-interceptor-${monitor.connector}`}
            css={"opacity: 0.0000001;"}
            layer={Astal.Layer.OVERLAY}
            gdkmonitor={monitor}
            keymode={Astal.Keymode.ON_DEMAND}
            exclusivity={Astal.Exclusivity.IGNORE}
            anchor={
                Astal.WindowAnchor.TOP | Astal.WindowAnchor.RIGHT | Astal.WindowAnchor.BOTTOM | Astal.WindowAnchor.LEFT
            }
            application={app}
            namespace={`${config.shellName}-overlay`}
        >
            <Gtk.GestureClick
                button={0}
                onBegin={() => {
                    currentPopoverMenu?.animate_hide();
                }}
            />
            <Gtk.EventControllerKey
                onKeyPressed={(_, key) => {
                    if (key === Gdk.KEY_Escape) {
                        currentPopoverMenu?.animate_hide();
                    }
                }}
            />
        </window>
    );
}

function showInterceptors() {
    for (const monitor of app.monitors) {
        app.get_window(`outside-click-interceptor-${monitor.connector}`)?.show();
    }
}

function hideInterceptors() {
    for (const monitor of app.monitors) {
        app.get_window(`outside-click-interceptor-${monitor.connector}`)?.hide();
    }
}

export function readMenu(menu: Gio.MenuModel, depth: number) {
    const items = menu.get_n_items();
    for (let i = 0; i < items; i++) {
        const attributes_iter = menu.iterate_item_attributes(i);
        let attr;
        while ((attr = attributes_iter.get_next())[0]) {
            const [, name, value] = attr;
        }

        const links_iter = menu.iterate_item_links(i);
        let link;
        while ((link = links_iter.get_next())[0]) {
            const [, name, menuModel] = link;
            if (menuModel) {
            }
        }
    }
}

type MenuItem = {
    action?: string;
    actionNamespace?: string;
    icon?: string;
    label?: string;
    target?: string;
    is_section?: boolean;
    is_submenu?: boolean;
    children?: MenuItem[];
};

export function extractMenu(menuModel: Gio.MenuModel | null): MenuItem[] {
    if (!menuModel) return [];

    const items = [];
    const itemCount = menuModel.get_n_items();

    for (let i = 0; i < itemCount; i++) {
        const section = menuModel.get_item_link(i, Gio.MENU_LINK_SECTION);
        const submenu = menuModel.get_item_link(i, Gio.MENU_LINK_SUBMENU);

        const item = {
            action:
                menuModel.get_item_attribute_value(i, Gio.MENU_ATTRIBUTE_ACTION, null)?.get_string()?.[0] ?? undefined,
            actionNamespace:
                menuModel.get_item_attribute_value(i, Gio.MENU_ATTRIBUTE_ACTION_NAMESPACE, null)?.get_string()?.[0] ??
                undefined,
            icon: menuModel.get_item_attribute_value(i, Gio.MENU_ATTRIBUTE_ICON, null)?.get_string()?.[0] ?? undefined,
            label:
                menuModel.get_item_attribute_value(i, Gio.MENU_ATTRIBUTE_LABEL, null)?.get_string()?.[0] ?? undefined,
            target:
                menuModel.get_item_attribute_value(i, Gio.MENU_ATTRIBUTE_TARGET, null)?.get_string()?.[0] ?? undefined,
            is_section: !!section,
            is_submenu: !!submenu,
            children: section ? extractMenu(section) : submenu ? extractMenu(submenu) : undefined,
        } as MenuItem;

        items.push(item);
    }

    return items;
}

function renderMenu(items: MenuItem[], depth: number): Gtk.Widget {
    const box = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        css_classes: ["menu-section"],
    });

    for (const [i, item] of items.entries()) {
        if (item.is_section) {
            if (item.children) {
                const childBox = renderMenu(item.children, depth + 1);
                box.append(childBox);
                if (i < items.length - 1) {
                    const separator = new Gtk.Separator({
                        orientation: Gtk.Orientation.HORIZONTAL,
                        css_classes: ["menu-separator"],
                        margin_top: 4,
                        margin_bottom: 4,
                    });
                    box.append(separator);
                }
            }
        } else if (item.is_submenu) {
            const menuButton = new Gtk.Button({
                css_classes: ["menu-item-button"],
                halign: Gtk.Align.FILL,
            });

            const itemBox = new Gtk.Box({
                orientation: Gtk.Orientation.HORIZONTAL,
                spacing: 8,
            });
            menuButton.set_child(itemBox);

            if (item.icon) {
                itemBox.append(new Gtk.Image({ icon_name: item.icon, pixel_size: 16 }));
            }
            if (item.label) {
                itemBox.append(new Gtk.Label({ label: item.label, xalign: 0, hexpand: true }));
            }
            const arrow = new Gtk.Image({ icon_name: "pan-end-symbolic", pixel_size: 16 });
            arrow.get_style_context().add_class("dim-label");
            itemBox.append(arrow);

            const popover = new ContrapshellPopoverMenu({});
            popover.set_parent(menuButton);
            popover.set_child(renderMenu(item.children ?? [], depth + 1));

            menuButton.connect("clicked", () => {
                popover.popup();
            });

            box.append(menuButton);
        } else {
            const button = new Gtk.Button({
                halign: Gtk.Align.FILL,
                css_classes: ["menu-item-button"],
            });

            const itemBox = new Gtk.Box({
                orientation: Gtk.Orientation.HORIZONTAL,
                spacing: 8,
            });
            button.set_child(itemBox);

            if (item.icon) {
                itemBox.append(new Gtk.Image({ icon_name: item.icon, pixel_size: 16 }));
            }
            if (item.label) {
                itemBox.append(new Gtk.Label({ label: item.label, xalign: 0, hexpand: true }));
            }

            if (item.action) {
                button.connect("clicked", () => {
                    const actionName = (
                        item.actionNamespace ? `${item.actionNamespace}.${item.action}` : item.action!
                    ).replace(/^app\./, "");
                    const target = item.target ? new GLib.Variant("s", item.target) : null;
                    app.activate_action(actionName, target);
                    currentPopoverMenu?.animate_hide();
                    hideInterceptors();
                });
            } else {
                button.set_sensitive(false);
            }

            box.append(button);
        }
    }

    return box;
}

export function ContrapshellMenu({ menuModel }: { menuModel: Accessor<Gio.MenuModel> }) {
    let popover = new Gtk.Popover();

    menuModel.subscribe(() => {
        popover.set_child(renderMenu(extractMenu(menuModel.peek()), 0));
    });
    popover.set_child(renderMenu(extractMenu(menuModel.peek()), 0));

    return popover;
}

export const ContrapshellPopoverMenu = GObject.registerClass(
    {
        GTypeName: "ContrapshellPopoverMenu",
    },
    class ContrapshellPopoverMenu extends Gtk.PopoverMenu {
        private anim_fraction: number = 0;

        constructor(constructProperties: Partial<Gtk.PopoverMenu.ConstructorProps>) {
            super(constructProperties);

            this.hasArrow = false;

            this.set_flags(Gtk.PopoverMenuFlags.NESTED);
            this.set_css_classes(["menu", "glassy-menu"]);
            this.set_autohide(false);

            const keyController = new Gtk.EventControllerKey();
            keyController.connect("key-pressed", (_, key) => {
                if (key === Gdk.KEY_Escape) {
                    this.animate_hide();
                    hideInterceptors();
                }
            });

            this.add_controller(keyController);
        }

        vfunc_map() {
            currentPopoverMenu = this;
            showInterceptors();
            this.anim_fraction = 0;
            const startFrame = this.get_frame_clock()!.get_frame_time();
            this.add_tick_callback((_, clock) => {
                const now = clock.get_frame_time();
                const progress = Math.min(100, (now - startFrame) / 1500);
                this.anim_fraction = progress;
                this.queue_draw();
                return this.get_mapped() && this.anim_fraction < 100;
            });
            super.vfunc_map();
        }

        vfunc_unmap(): void {
            hideInterceptors();
            super.vfunc_unmap();
        }

        animate_hide(): void {
            currentPopoverMenu = undefined;
            this.anim_fraction = 100;
            const startFrame = this.get_frame_clock()!.get_frame_time();
            this.add_tick_callback((_, clock) => {
                const now = clock.get_frame_time();
                const progress = Math.max(0, 100 - (now - startFrame) / 1500);
                this.anim_fraction = progress;
                this.queue_draw();
                const cont = this.get_mapped() && this.anim_fraction > 0;
                if (!cont) {
                    this.hide();
                }
                return cont;
            });
        }

        vfunc_snapshot(snapshot: Gtk.Snapshot): void {
            const lf = this.anim_fraction / 100;
            const f = easeOutQuint(lf);
            const scaleX = 0.5 + f / 2;
            const scaleY = 0.5 + f / 2;
            snapshot.translate(
                new Graphene.Point({
                    x: (this.get_width() * (1 - scaleX)) / 2,
                    y: (this.get_height() * (1 - scaleY)) / 2,
                })
            );
            snapshot.push_opacity(lf);
            snapshot.scale(scaleX, scaleY);
            super.vfunc_snapshot(snapshot);
            snapshot.pop();
        }
    }
);

const DEFAULT_CORNER_SIZE = new Graphene.Size({ width: 12, height: 12 });
const DEFAULT_GLOSS_COLOR_INNER = new Gdk.RGBA({ red: 1, green: 1, blue: 1, alpha: 0.1 });
const DEFAULT_GLOSS_COLOR_OUTER = new Gdk.RGBA({ red: 1, green: 1, blue: 1, alpha: 0.15 });

export const ContrapshellPopoverWindow = GObject.registerClass(
    {
        GTypeName: "ContrapshellPopoverWindow",
    },
    class ContrapshellPopoverWindow extends Gtk.Window {
        private originWidget: Gtk.Widget | undefined;
        private anchoredToDock = false;

        constructor(constructProperties: Partial<Gtk.Window.ConstructorProps> & { anchoredToDock?: boolean }) {
            if (constructProperties.widthRequest) {
                // add the extra box shadow margin
                constructProperties.widthRequest += 16;
            }

            const anchoredToDock = constructProperties.anchoredToDock ?? false;
            delete constructProperties.anchoredToDock;

            super(constructProperties);

            this.anchoredToDock = anchoredToDock;

            Gtk4LayerShell.init_for_window(this);
            Gtk4LayerShell.set_layer(this, Gtk4LayerShell.Layer.TOP);
            Gtk4LayerShell.set_exclusive_zone(this, -1);
            Gtk4LayerShell.set_keyboard_mode(this, Gtk4LayerShell.KeyboardMode.EXCLUSIVE);
            Gtk4LayerShell.set_anchor(this, Gtk4LayerShell.Edge.TOP, !anchoredToDock);
            Gtk4LayerShell.set_anchor(this, Gtk4LayerShell.Edge.BOTTOM, anchoredToDock);
            Gtk4LayerShell.set_anchor(this, Gtk4LayerShell.Edge.LEFT, true);
            Gtk4LayerShell.set_namespace(this, `${config.shellName}-overlay`);

            this.add_css_class("popover-standard");

            const gesture = new Gtk.GestureClick();
            gesture.set_propagation_phase(Gtk.PropagationPhase.TARGET);
            gesture.connect("pressed", () => {
                this.hide();
            });

            // we need to add/remove the controller as the window is shown/hidden, otherwise
            // the first click outside of the window is ignored if the mouse hasn't moved.
            this.connect("show", () => this.add_controller(gesture));
            this.connect("hide", () => this.remove_controller(gesture));

            app.add_window(this);
        }

        vfunc_show(): void {
            let root: Gtk.Widget | null = this.originWidget!;
            while ((root = root.get_parent()) && !(root instanceof Gtk.Window)) {}

            if (!root) return;

            const [
                ,
                {
                    origin: { x: origX, y: origY },
                    size: { width: origW, height: origH },
                },
            ] = this.originWidget!.compute_bounds(root);

            super.vfunc_show();

            const width = this.measure(Gtk.Orientation.HORIZONTAL, -1)[0];

            const monitorWidth = root.display.get_monitor_at_surface(root.get_surface()!)!.geometry.width!;

            let x = 0;

            const [, , , rootWidth, rootHeight] = root.get_bounds();
            x = (monitorWidth - rootWidth - width) / 2 + origX + origW / 2;

            // make sure to include the extra 8 margin we addeded to fit the box shadow in
            if (this.anchoredToDock) {
                const margin = rootHeight + 4;
                Gtk4LayerShell.set_margin(this, Gtk4LayerShell.Edge.BOTTOM, margin - 8);
            } else {
                const margin = origY + origH;
                Gtk4LayerShell.set_margin(this, Gtk4LayerShell.Edge.TOP, margin - 8);
            }

            x = Math.max(-8, x);
            x = Math.min(x, monitorWidth - width + 8);

            Gtk4LayerShell.set_margin(this, Gtk4LayerShell.Edge.LEFT, x);

            this.queue_resize();
        }

        show_from(activator: Gtk.Widget) {
            this.originWidget = activator;
            this.show();
            this.originWidget = undefined;
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
            snapshot.append_inset_shadow(roundedRect, DEFAULT_GLOSS_COLOR_INNER, 0, 0, 3, 1);
            snapshot.append_inset_shadow(roundedRect, DEFAULT_GLOSS_COLOR_OUTER, 0, 0, 1, 0);
        }
    }
);

type Props<T extends Gtk.Widget, Props> = CCProps<T, Partial<Props>>;

declare global {
    namespace GlassyWidgets {
        class ContrapshellPopoverWindow extends Gtk.Window {
            show_from(activator: Gtk.Widget): void;
        }

        namespace ContrapshellPopoverWindow {
            interface ConstructorProps extends Gtk.Window.ConstructorProps {
                anchoredToDock?: boolean;
            }
        }

        class ContrapshellPopoverMenu extends Gtk.PopoverMenu {
            animate_hide(): void;
        }

        namespace ContrapshellPopoverMenu {
            interface ConstructorProps extends Gtk.PopoverMenu.ConstructorProps {}
        }
    }

    namespace JSX {
        interface IntrinsicElements {
            contrapshellpopovermenu: Props<
                GlassyWidgets.ContrapshellPopoverMenu,
                GlassyWidgets.ContrapshellPopoverMenu.ConstructorProps
            >;
            contrapshellpopoverwindow: Props<
                GlassyWidgets.ContrapshellPopoverWindow,
                GlassyWidgets.ContrapshellPopoverWindow.ConstructorProps
            >;
        }
    }
}

Object.assign(intrinsicElements, {
    contrapshellpopovermenu: ContrapshellPopoverMenu,
    contrapshellpopoverwindow: ContrapshellPopoverWindow,
});
