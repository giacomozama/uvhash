import fetch from "gnim/fetch";
import parseXML from "../utils/xml";
import config from "../config";
import { createPollState } from "../utils/gnim";
import GLib from "gi://GLib?version=2.0";
import Gio from "gi://Gio?version=2.0";
import { readFile, writeFileAsync } from "ags/file";
import { execAsync } from "ags/process";
import { LruCache } from "../utils/lru_cache";

export type NewsItem = {
    source: string;
    time: Date;
    title: string;
    link: string;
    picture: string;
    pictureWidth: number;
    pictureHeight: number;
    description: string;
};

GLib.mkdir_with_parents(config.news.picsCacheDir, 493);

const cacheIndexFile = Gio.file_new_for_path(`${config.news.picsCacheDir}/index.json`);

const picsCache = (() => {
    const persisted: { [key: string]: string } = cacheIndexFile.query_exists(null)
        ? JSON.parse(readFile(cacheIndexFile))
        : {};

    const entries = Object.keys(persisted).map((k) => [k, persisted[k]] as [string, string]);

    return new LruCache(20, entries, (_, value) => {
        Gio.File.new_for_path(`${config.news.picsCacheDir}/${value}.jpg`).delete_async(0, null, (file, res) => {
            file?.delete_finish(res);
        });
    });
})();

async function persistCache() {
    await writeFileAsync(cacheIndexFile, JSON.stringify(Object.fromEntries(picsCache.entries())));
}

export async function fetchImage(url: string) {
    const cached = picsCache.get(url);
    if (cached) {
        const file = Gio.File.new_for_path(`${config.news.picsCacheDir}/${cached}.jpg`);
        if (file.query_exists(null)) return file;
    }

    try {
        const bytes = await (await fetch(url)).bytes();
        const uuid = GLib.uuid_string_random();
        const tmpPath = `${config.news.picsCacheDir}/${uuid}_tmp.jpg`;
        const tmpFile = Gio.File.new_for_path(tmpPath);

        await new Promise((resolve, reject) => {
            tmpFile.create_async(Gio.FileCreateFlags.REPLACE_DESTINATION, 0, null, (file, res) => {
                const stream = file?.create_finish(res);
                if (stream) {
                    stream.write_bytes_async(bytes!, 0, null, (stream, res) => {
                        if (stream?.write_bytes_finish(res)) {
                            resolve(null);
                        } else {
                            reject("Couldn't write to temp file");
                        }
                    });
                } else {
                    reject("Couldn't create temp file");
                }
            });
        });

        const path = `${config.news.picsCacheDir}/${uuid}.jpg`;
        const command = `${config.path.magick} "${tmpPath}" -geometry x500 -quality 95 "${path}"`;
        await execAsync(command);

        await new Promise((resolve) => {
            tmpFile.delete_async(0, null, (file, res) => {
                file?.delete_finish(res);
                resolve(null);
            });
        });

        picsCache.set(url, uuid);
        await persistCache();

        return Gio.File.new_for_path(path);
    } catch (err) {
        printerr("Couldn't fetch image", err);
        return undefined;
    }
}

const imgTagPattern = /src=\"(https?:\/\/.*\.(?:jpg|jpeg|webp|png))\"/;

async function fetchNews(): Promise<NewsItem[]> {
    const result = [];

    for (const { name, url } of config.news.feeds) {
        try {
            const response = await (await fetch(url)).text();
            const parsed = parseXML(response);

            for (const item of parsed.root?.children?.[0]?.children?.filter((c) => c.name === "item") ?? []) {
                const newsItem: NewsItem = {
                    source: name,
                    time: new Date(0),
                    title: "",
                    link: "",
                    picture: "",
                    pictureWidth: 0,
                    pictureHeight: 0,
                    description: "",
                };

                for (const child of item.children ?? []) {
                    switch (child.name) {
                        case "pubDate":
                            newsItem.time = new Date(child.content!);
                            break;
                        case "title":
                            newsItem.title = child.content!;
                            break;
                        case "link":
                            newsItem.link = child.content!;
                            break;
                        case "description":
                            newsItem.description = child.content!;

                            // hacky way of removing figure tags while extracting img urls from them
                            const figureIdx = newsItem.description.indexOf("&lt;figure&gt;");
                            if (figureIdx > 0) {
                                const figureMarkup = newsItem.description.slice(figureIdx);
                                const srcRes = imgTagPattern.exec(figureMarkup);
                                if (srcRes) {
                                    const src = srcRes[1];
                                    if (src) {
                                        newsItem.picture = src;
                                    }
                                }
                                newsItem.description = newsItem.description.slice(0, figureIdx);
                            }
                            break;
                        case "media:content":
                        case "media:thumbnail":
                            newsItem.picture = child.attributes?.url!;
                            newsItem.pictureWidth = parseInt(child.attributes?.width!);
                            newsItem.pictureHeight = parseInt(child.attributes?.height!);
                            break;
                    }
                }

                result.push(newsItem);
            }
        } catch (err) {
            printerr(`Couldn't fetch news for ${url}`, err);
        }
    }

    result.sort((a, b) => b.time.getTime() - a.time.getTime());
    result.length = 15;

    return result;
}

const [newsItems, setNewsItems] = createPollState([], 600_000, fetchNews);

export { newsItems };

export function refreshNews() {
    fetchNews().then(setNewsItems);
}
