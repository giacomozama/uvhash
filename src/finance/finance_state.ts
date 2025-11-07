import fetch from "gnim/fetch";
import config from "../config";
import { createPoll } from "ags/time";
import { execAsync } from "ags/process";
import { createPollState } from "../utils/gnim";
import { createState } from "gnim";

export enum StockHistoryPeriod {
    Period1D = "1d",
    Period5D = "5d",
    Period1M = "1mo",
    Period3M = "3mo",
    Period6M = "6mo",
    Period1Y = "1y",
    Period2Y = "2y",
    Period5Y = "5y",
    Period10Y = "10y",
    PeriodYTD = "ytd",
    PeriodMax = "max",
}

export type StockMovement = {
    ticker: string;
    name: string;
    price: number;
    change_amount: number;
    change_percent: number;
    volume: number;
};

export type TopStockMovements = {
    topGainers: StockMovement[];
    topLosers: StockMovement[];
    mostActive: StockMovement[];
};

export const [stockHistory, setStockHistory] = createState<number[] | null>(null);
const [selectedTicker, setSelectedTicker] = createState<string | null>(null);
export const [selectedPeriod, setSelectedPeriod] = createState(StockHistoryPeriod.Period6M);

const [topStockMovements, setTopStockMovements] = createPollState(
    {
        topGainers: [],
        topLosers: [],
        mostActive: [],
    },
    600_000,
    getLatestTopStockMovements
);

export { topStockMovements, selectedTicker };

function refreshStockHistory() {
    setStockHistory(null);
    const ticker = selectedTicker.get();
    execAsync(`${config.path.python} ${SRC}/scripts/stocks.py history ${ticker} ${selectedPeriod.get()}`).then(
        (raw) => {
            if (selectedTicker.get() === ticker) {
                setStockHistory(JSON.parse(raw).map((d: { Close: number }) => d.Close));
            }
        }
    );
}

export function selectTicker(ticker: string | null) {
    setSelectedTicker(ticker);
    refreshStockHistory();
}

export function selectPeriod(period: StockHistoryPeriod) {
    setSelectedPeriod(period);
    refreshStockHistory();
}

export async function getLatestTopStockMovements() {
    try {
        const gainers = execAsync(`${config.path.python} ${SRC}/scripts/stocks.py day_gainers`);
        const losers = execAsync(`${config.path.python} ${SRC}/scripts/stocks.py day_losers`);
        const mostActive = execAsync(`${config.path.python} ${SRC}/scripts/stocks.py most_actives`);

        const movements = {
            topGainers: JSON.parse(await gainers),
            topLosers: JSON.parse(await losers),
            mostActive: JSON.parse(await mostActive),
        } as TopStockMovements;

        if (selectedTicker.get() === null) {
            selectTicker(movements.mostActive[0].ticker ?? null);
        }

        return movements;
    } catch (e) {
        printerr("Couldn't fetch stock data", e);
        return {
            topGainers: [],
            topLosers: [],
            mostActive: [],
        };
    }
}

export function refreshStocks() {
    getLatestTopStockMovements().then(setTopStockMovements);
}
