import { Gdk, Gtk } from "ags/gtk4";

function walkChildrenAndSiblings(widget: Gtk.Widget, callback: (widget: Gtk.Widget) => void) {
    callback(widget);

    const firstChild = widget.get_first_child();
    if (firstChild) {
        walkChildrenAndSiblings(firstChild, callback);
    }

    const nextSibling = widget.get_next_sibling();
    if (nextSibling) {
        walkChildrenAndSiblings(nextSibling, callback);
    }
}

export function walkChildren(widget: Gtk.Widget, callback: (widget: Gtk.Widget) => void) {
    const firstChild = widget.get_first_child();
    if (firstChild) {
        walkChildrenAndSiblings(firstChild, callback);
    }
}

export function clearChildren(widget: Gtk.Box) {
    let child;
    while (child = widget.get_first_child()) {
        widget.remove(child)
    }
}

export function findParent(widget: Gtk.Widget, predicate: (widget: Gtk.Widget) => boolean): Gtk.Widget | null {
    if (predicate(widget)) return widget;
    const parent = widget.get_parent();
    return parent ? findParent(parent, predicate) : null;
}

export function popdownParentMenuButton(widget: Gtk.Widget) {
    const menuButton = findParent(widget, (w) => w instanceof Gtk.MenuButton) as Gtk.MenuButton;
    menuButton.popdown();
}

export function popupParentMenuButton(widget: Gtk.Widget) {
    const menuButton = findParent(widget, (w) => w instanceof Gtk.MenuButton) as Gtk.MenuButton;
    menuButton.popup();
}

export function removePopoverFromParentMenuButton(widget: Gtk.Widget) {
    const parent = findParent(widget, (w) => w instanceof Gtk.MenuButton) as Gtk.MenuButton;
    parent.set_popover(null);
    parent.set_sensitive(true);
}

export function add_throttled_tick_callback<T extends Gtk.Widget>(
    widget: T,
    minInterval: number,
    callback: (widget: T, clock: Gdk.FrameClock) => boolean
) {
    let lastFrameTime = 0;
    return widget.add_tick_callback((w, clock) => {
        const frameTime = clock.get_frame_time();
        if (frameTime - lastFrameTime > minInterval) {
            lastFrameTime = frameTime;
            return callback(w as T, clock);
        }
        return true;
    });
}

export function add_throttled_tick_callback_dynamic<T extends Gtk.Widget>(
    widget: T,
    minIntervalGetter: () => number,
    callback: (widget: T, clock: Gdk.FrameClock) => boolean
) {
    let lastFrameTime = 0;
    return widget.add_tick_callback((w, clock) => {
        const frameTime = clock.get_frame_time();
        if (frameTime - lastFrameTime > minIntervalGetter()) {
            lastFrameTime = frameTime;
            return callback(w as T, clock);
        }
        return true;
    });
}

export const CURSOR_POINTER = Gdk.Cursor.new_from_name("pointer", null);
