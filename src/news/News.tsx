import { Gdk, Gtk } from "ags/gtk4";
import { For } from "gnim";
import { fetchImage, NewsItem, newsItems, refreshNews } from "./news_state";
import { CURSOR_POINTER } from "../utils/gtk";
import { execAsync } from "ags/process";
import config from "../config";
import Adw from "gi://Adw?version=1";

const TIME_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    second: "2-digit",
};

function formatNewsDate(newsItem: NewsItem) {
    return newsItem.time.toLocaleString("default", TIME_FORMAT_OPTIONS);
}

function NewsItemPicture({ item }: { item: NewsItem }) {
    return (
        <box
            class="picture"
            layoutManager={new Gtk.BinLayout()}
            hexpand={true}
            heightRequest={350}
            $={(self) => {
                fetchImage(item.picture)
                    .then((file) => {
                        const stack = self.get_first_child()! as Gtk.Stack;
                        const picture = stack.get_child_by_name("pic") as Gtk.Picture;
                        picture.set_file(file);
                        stack.set_visible_child_name("pic");
                    })
                    .catch(() => {
                        const stack = self.get_first_child()! as Gtk.Stack;
                        const picture = stack.get_child_by_name("pic") as Gtk.Picture;
                        const paintable = Gtk.IconTheme.get_for_display(Gdk.Display.get_default()!).lookup_icon(
                            "image-missing-symbolic",
                            [],
                            64,
                            1,
                            null,
                            null
                        );
                        picture.set_content_fit(Gtk.ContentFit.SCALE_DOWN);
                        picture.set_paintable(paintable);
                        stack.set_visible_child_name("pic");
                    });
            }}
        >
            <stack $={(self) => self.set_visible_child_name("loading")}>
                <Gtk.Picture
                    $type="named"
                    name="pic"
                    vexpand={true}
                    heightRequest={350}
                    contentFit={Gtk.ContentFit.COVER}
                />
                <Adw.Spinner
                    $type="named"
                    name="loading"
                    widthRequest={64}
                    heightRequest={64}
                    valign={Gtk.Align.CENTER}
                    halign={Gtk.Align.CENTER}
                />
            </stack>
            <box class="picture-gloss" />
        </box>
    );
}

function NewsItem({ item }: { item: NewsItem }) {
    return (
        <box class="news-item" orientation={Gtk.Orientation.VERTICAL} hexpand={true} spacing={12}>
            <box>
                <box orientation={Gtk.Orientation.VERTICAL} spacing={12}>
                    <label
                        class="subtext"
                        label={`<b>${item.source}</b> • ${formatNewsDate(item)}`}
                        xalign={0}
                        useMarkup={true}
                        hexpand={true}
                        valign={Gtk.Align.START}
                    />
                    <label class="title" label={item.title} xalign={0} maxWidthChars={0} wrap={true} />
                </box>
                <button
                    cssClasses={["glassy-chip-button", "corner"]}
                    iconName={"external-link-symbolic"}
                    cursor={CURSOR_POINTER}
                    valign={Gtk.Align.START}
                    marginStart={24}
                    onClicked={() => execAsync(`${config.path.xdgOpen} ${item.link}`)}
                />
            </box>
            {item.picture && <NewsItemPicture item={item} />}
            <label
                class="description"
                label={item.description}
                justify={Gtk.Justification.FILL}
                xalign={0}
                maxWidthChars={0}
                wrap={true}
            />
        </box>
    );
}

export function News() {
    return (
        <box cssClasses={["news"]} layoutManager={new Gtk.BinLayout()} hexpand={true} hexpandSet={true}>
            <box orientation={Gtk.Orientation.VERTICAL} hexpand={true}>
                <box orientation={Gtk.Orientation.HORIZONTAL} cssClasses={["popover-title"]} valign={Gtk.Align.START}>
                    <image iconName={"newspaper-symbolic"} halign={Gtk.Align.START} pixelSize={16} />
                    <label label="News" xalign={0} hexpand={true} />
                    <button cursor={CURSOR_POINTER} valign={Gtk.Align.CENTER} onClicked={() => refreshNews()}>
                        <box spacing={12}>
                            <image iconName="view-refresh-symbolic" />
                            <label label="Refresh" />
                        </box>
                    </button>
                </box>
                <scrolledwindow
                    child={
                        (
                            <box orientation={Gtk.Orientation.VERTICAL}>
                                <For each={newsItems}>{(item) => <NewsItem item={item} />}</For>
                            </box>
                        ) as Gtk.Widget
                    }
                />
            </box>
            <box class={"gloss"} canFocus={false} canTarget={false} />
        </box>
    );
}
