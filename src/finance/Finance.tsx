import { Gtk } from "ags/gtk4";
import { Accessor, createState, For } from "gnim";
import {
    selectPeriod,
    selectedPeriod,
    selectedTicker,
    selectTicker,
    stockHistory,
    StockHistoryPeriod,
    StockMovement,
    TopStockMovements,
    topStockMovements,
    refreshStocks,
} from "./finance_state";
import { CURSOR_POINTER } from "../utils/gtk";
import Adw from "gi://Adw?version=1";
import config from "../config";
import giCairo from "cairo";

const GRAPH_FONT = "Adwaita Sans";
const TRADING_DAY_RATIO = 365 / 251;
const AXIS_DATE_FORMAT_1D: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
};
const AXIS_DATE_FORMAT_YEARLY: Intl.DateTimeFormatOptions = { month: "short", year: "numeric" };
const AXIS_DATE_FORMAT_DAILY: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
const POPUP_DATE_FORMAT_1D: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
};
const POPUP_DATE_FORMAT_DEFAULT: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };

function getPeriodDurationMs(period: StockHistoryPeriod): number {
    const now = new Date();
    const start = new Date();
    switch (period) {
        case StockHistoryPeriod.Period1D:
            return 24 * 60 * 60 * 1000;
        case StockHistoryPeriod.Period5D:
            return 5 * 24 * 60 * 60 * 1000;
        case StockHistoryPeriod.Period1M:
            start.setMonth(now.getMonth() - 1);
            break;
        case StockHistoryPeriod.Period3M:
            start.setMonth(now.getMonth() - 3);
            break;
        case StockHistoryPeriod.Period6M:
            start.setMonth(now.getMonth() - 6);
            break;
        case StockHistoryPeriod.Period1Y:
            start.setFullYear(now.getFullYear() - 1);
            break;
        case StockHistoryPeriod.Period5Y:
            start.setFullYear(now.getFullYear() - 5);
            break;
        case StockHistoryPeriod.PeriodYTD:
            start.setFullYear(now.getFullYear(), 0, 1);
            break;
        default:
            return 0;
    }
    return now.getTime() - start.getTime();
}

function drawGraphLine(
    cr: giCairo.Context,
    history: number[],
    width: number,
    height: number,
    min: number,
    range: number,
    padding: number
) {
    const spacing = width / (history.length - 1);
    cr.moveTo(-4, height - padding - ((history[0] - min) / range) * (height - padding * 2));

    for (let i = 0; i < history.length; i++) {
        const h = history[i];
        const x = spacing * i;
        cr.lineTo(x, height - padding - ((h - min) / range) * (height - padding * 2));
    }

    cr.lineTo(width + 4, height - padding - ((history[history.length - 1] - min) / range) * (height - padding * 2));
    cr.lineTo(width + 4, height + 4);
    cr.lineTo(-4, height + 4);
    cr.closePath();

    cr.setSourceRGBA(1, 1, 1, 0.4);
    cr.strokePreserve();
    cr.setSourceRGBA(1, 1, 1, 0.2);
    cr.fill();
}

function drawAxisLabels(
    cr: giCairo.Context,
    history: number[],
    width: number,
    height: number,
    min: number,
    range: number,
    padding: number
) {
    cr.selectFontFace(GRAPH_FONT, 0, 1);
    cr.setFontSize(11);
    cr.setSourceRGBA(1, 1, 1, 0.5);

    const numPriceLabels = 5;
    for (let i = 0; i <= numPriceLabels; i++) {
        const price = min + (range / numPriceLabels) * i;
        const y = height - padding - ((price - min) / range) * (height - padding * 2);
        cr.moveTo(4, y - 4);
        cr.showText(`$${price.toFixed(2)}`);
    }

    const period = selectedPeriod.get();
    const durationMs = getPeriodDurationMs(period);
    const numDateLabels = 4;
    const now = Date.now();

    for (let i = 0; i <= numDateLabels; i++) {
        let date: Date;
        if (period === StockHistoryPeriod.PeriodMax) {
            const daysToSubtract = Math.round((history.length - 1) * (1 - i / numDateLabels) * TRADING_DAY_RATIO);
            date = new Date();
            date.setDate(date.getDate() - daysToSubtract);
        } else {
            const pointInTime = now - durationMs * (1 - i / numDateLabels);
            date = new Date(pointInTime);
        }

        let formatOptions: Intl.DateTimeFormatOptions;
        switch (period) {
            case StockHistoryPeriod.Period1D:
                formatOptions = AXIS_DATE_FORMAT_1D;
                break;
            case StockHistoryPeriod.Period1Y:
            case StockHistoryPeriod.Period5Y:
            case StockHistoryPeriod.PeriodMax:
                formatOptions = AXIS_DATE_FORMAT_YEARLY;
                break;
            default:
                formatOptions = AXIS_DATE_FORMAT_DAILY;
                break;
        }
        const dateString = date.toLocaleDateString(undefined, formatOptions);

        const extents = cr.textExtents(dateString);
        let x;
        switch (i) {
            case 0:
                x = 4;
                break;
            case numDateLabels:
                x = width - extents.width - 4;
                break;
            default:
                x = width * (i / numDateLabels) - extents.width / 2;
                break;
        }
        cr.moveTo(x, height - 8);
        cr.showText(dateString);
    }
}

function drawHoverPopup(
    cr: giCairo.Context,
    history: number[],
    width: number,
    height: number,
    min: number,
    range: number,
    padding: number,
    mouseX: number
) {
    const { red, green, blue } = config.colors.accent1;
    const spacing = width / (history.length - 1);
    let lineX = -9999;

    for (let i = 0; i < history.length; i++) {
        const x = spacing * i;
        if (mouseX < x) {
            const h = history[i];
            const y = height - padding - ((h - min) / range) * (height - padding * 2);
            lineX = x;

            cr.arc(x, y, 4, 0, 2 * Math.PI);

            const sign = x > width / 2 ? -1 : 1;

            const period = selectedPeriod.get();
            const durationMs = getPeriodDurationMs(period);
            let date: Date;
            if (period === StockHistoryPeriod.PeriodMax) {
                const daysToSubtract = (history.length - 1 - i) * TRADING_DAY_RATIO;
                date = new Date();
                date.setDate(date.getDate() - daysToSubtract);
            } else {
                const pointInTime = Date.now() - durationMs * (1 - i / (history.length - 1));
                date = new Date(pointInTime);
            }

            const priceString = `$${h.toFixed(2)}`;
            const dateFormatOpts: Intl.DateTimeFormatOptions =
                period === StockHistoryPeriod.Period1D ? POPUP_DATE_FORMAT_1D : POPUP_DATE_FORMAT_DEFAULT;
            const dateString = date.toLocaleDateString(undefined, dateFormatOpts);

            drawPopupBox(cr, x, y, sign, priceString, dateString);
            drawPopupText(cr, x, y, sign, priceString, dateString);

            break;
        }
    }

    cr.moveTo(lineX, 0);
    cr.lineTo(lineX, height);
    cr.setLineWidth(1);
    cr.setSourceRGBA(red, green, blue, 0.7);
    cr.stroke();
}

function drawPopupBox(
    cr: giCairo.Context,
    x: number,
    y: number,
    sign: number,
    priceString: string,
    dateString: string
) {
    cr.selectFontFace(GRAPH_FONT, 0, 1);
    cr.setFontSize(14);
    const priceExtents = cr.textExtents(priceString);
    cr.setFontSize(11);
    const dateExtents = cr.textExtents(dateString);

    const boxPaddingX = 8;
    const boxPaddingY = 8;
    const hWidth = Math.max(priceExtents.width, dateExtents.width) + boxPaddingX * 2 + 16;
    const hHeight = (14 + 11) / 2 + boxPaddingY;
    const hArrWidth = 16;
    const cornerRadius = 5;
    const RAD_DEG_RATIO = Math.PI / 180.0;

    const tipX = x + 8 * sign;
    const p2 = { x: x + hArrWidth * sign, y: y - hHeight };
    const p3 = { x: x + hWidth * sign, y: y - hHeight };
    const p4 = { x: x + hWidth * sign, y: y + hHeight };
    const p5 = { x: x + hArrWidth * sign, y: y + hHeight };

    cr.moveTo(tipX, y);

    if (sign === 1) {
        cr.arc(p2.x + cornerRadius, p2.y + cornerRadius, cornerRadius, 180 * RAD_DEG_RATIO, 270 * RAD_DEG_RATIO);
        cr.lineTo(p3.x - cornerRadius, p3.y);
        cr.arc(p3.x - cornerRadius, p3.y + cornerRadius, cornerRadius, 270 * RAD_DEG_RATIO, 360 * RAD_DEG_RATIO);
        cr.lineTo(p4.x, p4.y - cornerRadius);
        cr.arc(p4.x - cornerRadius, p4.y - cornerRadius, cornerRadius, 0 * RAD_DEG_RATIO, 90 * RAD_DEG_RATIO);
        cr.lineTo(p5.x + cornerRadius, p5.y);
        cr.arc(p5.x + cornerRadius, p5.y - cornerRadius, cornerRadius, 90 * RAD_DEG_RATIO, 180 * RAD_DEG_RATIO);
    } else {
        cr.arcNegative(p2.x - cornerRadius, p2.y + cornerRadius, cornerRadius, 0 * RAD_DEG_RATIO, 270 * RAD_DEG_RATIO);
        cr.lineTo(p3.x + cornerRadius, p3.y);
        cr.arcNegative(
            p3.x + cornerRadius,
            p3.y + cornerRadius,
            cornerRadius,
            270 * RAD_DEG_RATIO,
            180 * RAD_DEG_RATIO
        );
        cr.lineTo(p4.x, p4.y - cornerRadius);
        cr.arcNegative(p4.x + cornerRadius, p4.y - cornerRadius, cornerRadius, 180 * RAD_DEG_RATIO, 90 * RAD_DEG_RATIO);
        cr.lineTo(p5.x - cornerRadius, p5.y);
        cr.arcNegative(p5.x - cornerRadius, p5.y - cornerRadius, cornerRadius, 90 * RAD_DEG_RATIO, 0 * RAD_DEG_RATIO);
    }

    cr.closePath();

    const { red, green, blue } = config.colors.accent1;
    cr.setSourceRGBA(red, green, blue, 1);
    cr.fill();
}

function drawPopupText(
    cr: giCairo.Context,
    x: number,
    y: number,
    sign: number,
    priceString: string,
    dateString: string
) {
    cr.selectFontFace(GRAPH_FONT, 0, 1);
    cr.setFontSize(14);
    const priceExtents = cr.textExtents(priceString);
    cr.setFontSize(11);
    const dateExtents = cr.textExtents(dateString);

    const boxPaddingX = 8;
    const hArrWidth = 16;

    cr.setSourceRGBA(1, 1, 1, 1);

    cr.selectFontFace(GRAPH_FONT, 0, 1);
    cr.setFontSize(14);
    const textX = x + (hArrWidth + boxPaddingX) * sign;
    const priceX = sign === 1 ? textX : textX - priceExtents.width;
    cr.moveTo(priceX, y - 4);
    cr.showText(priceString);

    cr.setFontSize(11);
    cr.setSourceRGBA(1, 1, 1, 0.7);
    const dateX = sign === 1 ? textX : textX - dateExtents.width;
    cr.moveTo(dateX, y + 12);
    cr.showText(dateString);
}

function StockGraphDrawingArea() {
    let mouseX = -9999;

    return (
        <drawingarea
            class="graph"
            hexpand={true}
            overflow={Gtk.Overflow.HIDDEN}
            $={(self) => {
                self.set_draw_func((_, cr, width, height) => {
                    const history = stockHistory.get();
                    if (!history || !history.length) return;

                    const min = Math.min(...history);
                    const max = Math.max(...history);
                    const range = max - min;
                    const padding = 32;

                    drawGraphLine(cr, history, width, height, min, range, padding);
                    drawAxisLabels(cr, history, width, height, min, range, padding);

                    if (mouseX >= 0) {
                        drawHoverPopup(cr, history, width, height, min, range, padding, mouseX);
                    }

                    cr.$dispose();
                });
            }}
        >
            <Gtk.EventControllerMotion
                onLeave={(self) => {
                    mouseX = -9999;
                    self.get_widget()!.queue_draw();
                }}
                onMotion={(self, x) => {
                    mouseX = x;
                    self.get_widget()!.queue_draw();
                }}
            />
        </drawingarea>
    );
}

function StockGraphPeriodSelector() {
    return (
        <box class="page-selector">
            <togglebutton
                label={"1D"}
                hexpand={true}
                active={selectedPeriod.as((p) => p === StockHistoryPeriod.Period1D)}
                onClicked={() => selectPeriod(StockHistoryPeriod.Period1D)}
            />
            <togglebutton
                label={"5D"}
                hexpand={true}
                active={selectedPeriod.as((p) => p === StockHistoryPeriod.Period5D)}
                onClicked={() => selectPeriod(StockHistoryPeriod.Period5D)}
            />
            <togglebutton
                label={"1M"}
                hexpand={true}
                active={selectedPeriod.as((p) => p === StockHistoryPeriod.Period1M)}
                onClicked={() => selectPeriod(StockHistoryPeriod.Period1M)}
            />
            <togglebutton
                label={"3M"}
                hexpand={true}
                active={selectedPeriod.as((p) => p === StockHistoryPeriod.Period3M)}
                onClicked={() => selectPeriod(StockHistoryPeriod.Period3M)}
            />
            <togglebutton
                label={"6M"}
                hexpand={true}
                active={selectedPeriod.as((p) => p === StockHistoryPeriod.Period6M)}
                onClicked={() => selectPeriod(StockHistoryPeriod.Period6M)}
            />
            <togglebutton
                label={"1Y"}
                hexpand={true}
                active={selectedPeriod.as((p) => p === StockHistoryPeriod.Period1Y)}
                onClicked={() => selectPeriod(StockHistoryPeriod.Period1Y)}
            />
            <togglebutton
                label={"5Y"}
                hexpand={true}
                active={selectedPeriod.as((p) => p === StockHistoryPeriod.Period5Y)}
                onClicked={() => selectPeriod(StockHistoryPeriod.Period5Y)}
            />
            <togglebutton
                label={"YTD"}
                hexpand={true}
                active={selectedPeriod.as((p) => p === StockHistoryPeriod.PeriodYTD)}
                onClicked={() => selectPeriod(StockHistoryPeriod.PeriodYTD)}
            />
            <togglebutton
                label={"Max"}
                hexpand={true}
                active={selectedPeriod.as((p) => p === StockHistoryPeriod.PeriodMax)}
                onClicked={() => selectPeriod(StockHistoryPeriod.PeriodMax)}
            />
        </box>
    );
}

function StockGraph() {
    return (
        <box orientation={Gtk.Orientation.VERTICAL} class="graph-container">
            <StockGraphPeriodSelector />
            <stack
                heightRequest={340}
                hexpand={true}
                visibleChildName={stockHistory.as((h) => (h ? "graph" : "loading"))}
            >
                <box $type="named" name="loading" hexpand={true} halign={Gtk.Align.CENTER}>
                    <Adw.Spinner widthRequest={64} heightRequest={64} />
                </box>
                <box $type="named" name="graph" hexpand={true}>
                    <StockGraphDrawingArea />
                </box>
            </stack>
        </box>
    );
}

function StockList({ name, selector }: { name: string; selector: (item: TopStockMovements) => StockMovement[] }) {
    return (
        <scrolledwindow
            $type="named"
            name={name}
            vexpand={true}
            child={
                (
                    <box orientation={Gtk.Orientation.VERTICAL} hexpand={true}>
                        <For each={topStockMovements.as(selector)}>
                            {(item: StockMovement) => (
                                <togglebutton
                                    class="stock-item"
                                    active={selectedTicker.as((t) => t === item.ticker)}
                                    onClicked={() => selectTicker(item.ticker)}
                                >
                                    <box hexpand={true} valign={Gtk.Align.START}>
                                        <box orientation={Gtk.Orientation.VERTICAL}>
                                            <label
                                                class="ticker"
                                                label={`${item.ticker} <span color="#ffffffa0">$${item.price}</span>`}
                                                hexpand={true}
                                                xalign={0}
                                                useMarkup={true}
                                            />
                                            <label
                                                class="subtext"
                                                label={item.name}
                                                hexpand={true}
                                                xalign={0}
                                                marginTop={4}
                                                marginBottom={4}
                                            />
                                        </box>
                                        <label
                                            cssClasses={["change", item.change_amount < 0 ? "negative" : "positive"]}
                                            label={`${item.change_amount > 0 ? "+" : ""}${
                                                item.change_amount
                                            } <span color="#ffffff80">•</span> ${
                                                item.change_amount > 0 ? "+" : ""
                                            }${item.change_percent.toFixed(2)}%`}
                                            valign={Gtk.Align.CENTER}
                                            useMarkup={true}
                                        />
                                    </box>
                                </togglebutton>
                            )}
                        </For>
                    </box>
                ) as Gtk.Widget
            }
        />
    );
}

export function Finance() {
    const [visiblePage, setVisiblePage] = createState("most_active");

    return (
        <box cssClasses={["finance"]} layoutManager={new Gtk.BinLayout()} hexpand={true} hexpandSet={true}>
            <box orientation={Gtk.Orientation.VERTICAL}>
                <box orientation={Gtk.Orientation.HORIZONTAL} cssClasses={["popover-title"]} valign={Gtk.Align.START}>
                    <image iconName={"profit-symbolic"} halign={Gtk.Align.START} pixelSize={16} />
                    <label label="Finance" xalign={0} hexpand={true} />
                    <button
                        cursor={CURSOR_POINTER}
                        valign={Gtk.Align.CENTER}
                        onClicked={() => {
                            refreshStocks();
                        }}
                    >
                        <box spacing={12}>
                            <image iconName="view-refresh-symbolic" />
                            <label label="Refresh" />
                        </box>
                    </button>
                </box>
                <StockGraph />
                <box class="page-selector">
                    <togglebutton
                        label={"Most active"}
                        active={visiblePage.as((p) => p === "most_active")}
                        onClicked={() => setVisiblePage("most_active")}
                        hexpand={true}
                    />
                    <togglebutton
                        label={"Gainers"}
                        active={visiblePage.as((p) => p === "gainers")}
                        onClicked={() => setVisiblePage("gainers")}
                        hexpand={true}
                    />
                    <togglebutton
                        label={"Losers"}
                        active={visiblePage.as((p) => p === "losers")}
                        onClicked={() => setVisiblePage("losers")}
                        hexpand={true}
                    />
                </box>
                <stack visibleChildName={visiblePage} transitionType={Gtk.StackTransitionType.CROSSFADE}>
                    <StockList name="gainers" selector={(item) => item.topGainers} />
                    <StockList name="losers" selector={(item) => item.topLosers} />
                    <StockList name="most_active" selector={(item) => item.mostActive} />
                </stack>
            </box>
            <box class={"gloss"} canFocus={false} canTarget={false} />
        </box>
    );
}
