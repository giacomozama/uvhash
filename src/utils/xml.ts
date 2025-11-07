// from https://github.com/FullStackPlayer/ts-xml-parser

export type Attributes = {
    [key: string]: string;
};

export interface XmlDocument {
    declaration:
        | {
              attributes: Attributes;
          }
        | undefined;
    root: XmlNode | undefined;
}

export interface XmlNode {
    name: string;
    attributes?: Attributes;
    content?: string;
    children?: XmlNode[];
}

export default function parseXML(xml: string, withNS?: boolean): XmlDocument {
    xml = xml.trim();
    xml = xml.replace(/<!--[\s\S]*?-->/g, "");

    const doc: XmlDocument = {
        declaration: undefined,
        root: undefined,
    };

    doc.declaration = declaration();

    const m = xml.match(/<!\[CDATA\[[\s\S]*?\]\]>/gm);

    if (m) {
        for (const str of m) {
            xml = xml.replace(str, encodeCDATA(str));
        }
    }

    const parsed = parseAll(xml);
    if (parsed) {
        if (parsed.children.length === 1 && typeof parsed.children[0] !== "string") doc.root = parsed.children[0];
        else throw new Error();
    }

    if (doc.root && withNS === true) applyNS(doc.root);
    return doc;

    function encodeCDATA(str: string): string {
        const shadow = str
            .split(`<![CDATA[`)[1]
            .split(`]]>`)[0]
            .replace(/</, `[_*[$(<)$]*_]`)
            .replace(/>/, `[_*[$(>)$]*_]`)
            .replace(/\//, `[_*[$(/)$]*_]`)
            .replace(/\\/, `[_*[$(LS)$]*_]`);

        return `<![CDATA[${shadow}]]>`;
    }

    function decodeCDATA(str: string): string {
        const m = str.match(/<!\[CDATA\[[\s\S]*?\]\]>/gm);
        if (m) {
            for (const cdata of m) {
                const shadow = cdata
                    .split(`<![CDATA[`)[1]
                    .split(`]]>`)[0]
                    .replace(/\[_\*\[\$\(<\)\$\]\*\_]/, `<`)
                    .replace(/\[_\*\[\$\(>\)\$\]\*_]/, `>`)
                    .replace(/\[_\*\[\$\(\/\)\$\]\*_]/, `/`)
                    .replace(/\[_\*\[\$\(LS\)\$\]\*_]/, `\\`);
                str = str.replace(cdata, `<![CDATA[${shadow}]]>`);
            }
        }
        return str;
    }

    function declaration(): { attributes: Attributes } | undefined {
        let temp: string = "";

        const m = xml.match(/^<\?xml[\s\S]*\?>/m);
        if (!m) return undefined;

        temp = m[0];
        xml = xml.slice(temp.length);

        const node: XmlNode = {
            name: "",
        };

        getAttributes(temp, node);

        if (!node.attributes) return undefined;

        return {
            attributes: node.attributes,
        };
    }

    function parseAll(str: string): { [key: string]: any } | undefined {
        const all: XmlNode[] = [];

        while (true) {
            const firstTag = getFirstTag(str);
            if (!firstTag) break;

            let targetStr: string = "";
            let node: XmlNode | undefined = undefined;

            if (firstTag.type === "selfClose") {
                targetStr = firstTag.str;
                node = parseNode(targetStr, firstTag.name, true);
            }

            if (firstTag.type === "normal") {
                targetStr = firstTag.strs["outer"];
                node = parseNode(firstTag.strs, firstTag.name, false);
            }

            if (node) all.push(node);
            str = str.replace(targetStr, "");
        }

        str = str.replace(/[\r\n]/g, "").trim();
        if (all.length === 0) return undefined;

        return {
            children: all,
            strLeft: str,
        };
    }

    function parseNode(target: any, tagName: string, isSelfClose: boolean): XmlNode | undefined {
        const node: XmlNode = {
            name: tagName,
        };

        if (isSelfClose === true) {
            parseSelfCloseTag(target, node);
        } else {
            parseNormalTag(target, node);
        }

        return node;
    }

    function parseSelfCloseTag(str: string, node: XmlNode): void {
        getAttributes(str, node);
    }

    function parseNormalTag(strs: { [key: string]: string }, node: XmlNode): void {
        getAttributes(strs.attrs, node);
        let str = strs["inner"];
        if (str.match(/<(?<tag>[\w:]+)([^<^>])*?\/>/m) || str.match(/<(?<tag>[\w:]+)[\s\S]*?>[\s\S]*?<\/\k<tag>*?>/m)) {
            const res = parseAll(str);
            if (res) {
                if (res.children && res.children.length > 0) node.children = res.children;
                if (res.strLeft !== "") {
                    res.strLeft = res.strLeft.replace(/[\r\n]/g, "").trim();
                    node.content = decodeCDATA(res.strLeft);
                }
            }
        } else if (str !== "") {
            str = str.replace(/[\r\n]/g, "").trim();
            node.content = decodeCDATA(str);
        }
    }

    function getFirstTag(str: string): { [key: string]: any } | undefined {
        const m = str.match(/<([\w-:.]+)\s*/m);
        if (!m) return;
        const tagName = m[1];
        const selfCloseStr = getSelfCloseNode(str, tagName);

        if (selfCloseStr) {
            return {
                type: "selfClose",
                name: tagName,
                str: selfCloseStr,
            };
        }

        const normalStr = getNormalNode(str, tagName);
        if (!normalStr) return undefined;
        
        return {
            type: "normal",
            name: tagName,
            strs: normalStr,
        };
    }

    function getSelfCloseNode(str: string, tagName: string): string | undefined {
        return str.match(new RegExp(`<${tagName}[^<^>]*?\/>`, "m"))?.[0];
    }

    function getNormalNode(str: string, tagName: string): { [key: string]: string } | undefined {
        const m = new RegExp(`<${tagName}([\\s\\S]*?)>([\\s\\S]*?)<\/${tagName}>`, "gm").exec(str);
        return m
            ? {
                  outer: m[0],
                  attrs: m[1],
                  inner: m[2],
              }
            : undefined;
    }

    function getAttributes(str: string, node: XmlNode): void {
        while (true) {
            const m = str.match(/([\w:-]+)\s*=\s*("[^"]*"|'[^']*'|\w+)\s*/);
            if (!m) break;
            if (!node.attributes) node.attributes = {};
            node.attributes[m[1]] = strip(m[2]);
            str = str.replace(m[0], "");
        }
    }

    function strip(val: string): string {
        return val.replace(/^['"]|['"]$/g, "");
    }

    function applyNS(node: XmlNode, ns?: { [key: string]: string }): void {
        const nsMap: { [key: string]: string } = {};

        if (ns) {
            for (const key of Object.keys(ns)) {
                nsMap[key] = ns[key];
            }
        }

        if (node.attributes) {
            const keys = Object.keys(node.attributes);
            for (const key of keys) {
                if (key === "xmlns") nsMap["_"] = node.attributes[key];
                if (key.indexOf("xmlns:") === 0) {
                    const prefix = key.replace("xmlns:", "");
                    nsMap[prefix] = node.attributes[key];
                }
            }
        }

        if (node.name.indexOf(":") < 0) {
            if (nsMap["_"]) {
                node.name = nsMap["_"] + node.name;
            }
        } else if (
            node.name.indexOf(":") > 0 &&
            node.name.split(":")[0] !== "http" &&
            node.name.split(":")[0] !== "https"
        ) {
            const prefix = node.name.split(":")[0];
            if (nsMap[prefix]) {
                node.name = node.name.replace(`${prefix}:`, `${nsMap[prefix]}`);
            }
        }

        if (node.children) {
            for (const child of node.children) {
                applyNS(child, nsMap);
            }
        }
    }
}
