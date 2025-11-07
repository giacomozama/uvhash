type Node<V> = {
    next: Node<V> | null;
    prev: Node<V> | null;
    key: string;
    value?: V;
};

export class LruCache<V> {
    private capacity: number;
    private head: Node<V> = { next: null, prev: null, key: "dummy" };
    private tail: Node<V> = { next: null, prev: null, key: "dummy" };
    private nodes = new Map<string, Node<V>>();
    private onEntryEvicted: (key: string, value: V) => void;

    constructor(capacity: number, initialEntries: [string, V][], onEntryEvicted: (key: string, value: V) => void) {
        this.capacity = capacity;
        this.head.next = this.tail;
        this.tail.prev = this.head;
        this.onEntryEvicted = onEntryEvicted;

        for (const [key, value] of initialEntries) {
            this.set(key, value);
        }

        this.evictExpired();
    }

    entries(): [string, V][] {
        const res = []
        let node = this.head.next;
        while (node) {
            res.push([node.key, node.value]);
            node = node.next;
        }
        return res as [string, V][];
    }

    private evictExpired() {
        if (this.nodes.size <= this.capacity) return;

        const evicted = this.tail.prev!;
        this.tail.prev = evicted.prev;
        evicted.prev!.next = this.tail;
        this.nodes.delete(evicted.key);

        this.onEntryEvicted(evicted.key, evicted.value!);
        
        this.evictExpired();
    }

    set(key: string, value: V) {
        let node = this.nodes.get(key);

        if (node) {
            node.prev!.next = node.next;
            node.next!.prev = node.prev;
        } else {
            node = { next: null, prev: null, key, value };
            this.nodes.set(key, node);
        }

        node.prev = this.head;
        node.next = this.head.next;
        this.head.next!.prev = node;
        this.head.next = node;

        this.evictExpired();
    }

    get(key: string): V | undefined {
        const node = this.nodes.get(key);
        if (!node) return undefined;

        node.prev!.next = node.next;
        node.next!.prev = node.prev;
        node.prev = this.head;
        node.next = this.head.next;
        this.head.next!.prev = node;
        this.head.next = node;

        return node.value;
    }
}
