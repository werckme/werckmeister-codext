import { AnyNode, EventNode, Span } from "./ast";

/**
 * Calls `cb` for every event (depth first, in source order),
 * including events nested in groups, voices and phrase definitions.
 */
export function forEachEvent(node: AnyNode, cb: (event: EventNode) => void): void {
    switch (node.kind) {
        case "document":
        case "fragment":
            node.items.forEach(item => forEachEvent(item, cb));
            return;
        case "track":
            node.voices.forEach(voice => forEachEvent(voice, cb));
            return;
        case "voice":
        case "phraseDef":
            node.events.forEach(event => forEachEvent(event, cb));
            return;
        case "group":
            cb(node);
            node.events.forEach(event => forEachEvent(event, cb));
            return;
        case "using":
        case "config":
        case "delimiter":
            return;
        default:
            cb(node);
    }
}

/**
 * All events overlapping `range` (a partially selected event counts).
 * An empty range (cursor) returns the events touching that position.
 * Groups are returned together with their overlapping child events.
 */
export function eventsInRange(node: AnyNode, range: Span): EventNode[] {
    const result: EventNode[] = [];
    forEachEvent(node, event => {
        if (overlaps(event, range)) {
            result.push(event);
        }
    });
    return result;
}

function overlaps(a: Span, range: Span): boolean {
    if (range.start === range.end) {
        return a.start <= range.start && range.start <= a.end;
    }
    return a.start < range.end && range.start < a.end;
}
