import { createPoll } from "ags/time";
import { createState, State } from "gnim";
import { Storage } from "../storage/types";
import { setStorage, storage } from "../storage/storage_state";

export function createPollState(init: string, interval: number, exec: string | string[]): State<string>;

export function createPollState<T>(
    init: T,
    interval: number,
    exec: string | string[],
    transform: (stdout: string, prev: T) => T
): State<T>;

export function createPollState<T>(init: T, interval: number, fn: (prev: T) => T | Promise<T>): State<T>;

export function createPollState<T>(
    init: T,
    interval: number,
    execOrFn: string | string[] | ((prev: T) => T | Promise<T>),
    transform?: (stdout: string, prev: T) => T
): State<T> {
    const state = createState(init);
    const poll =
        typeof execOrFn === "function"
            ? createPoll(init, interval, execOrFn)
            : createPoll(init, interval, execOrFn, transform ?? ((stdout) => stdout as T));
    poll.subscribe(() => state[1](poll.get()));
    return state;
}

export function createStorageBackedState<T>(key: keyof Storage): State<T> {
    return [storage.as((s) => s[key] as T), (v) => setStorage({ ...storage.get(), [key]: v } as Storage)];
}
