const VISITOR_TTL_MS = 90_000;

const visitors = new Map<string, number>();

function pruneVisitors(now = Date.now()) {
  for (const [id, lastSeen] of visitors) {
    if (now - lastSeen > VISITOR_TTL_MS) {
      visitors.delete(id);
    }
  }
}

export function recordVisitor(id: string): number {
  const now = Date.now();
  pruneVisitors(now);
  visitors.set(id, now);
  return visitors.size;
}

export function getOnlineCount(): number {
  pruneVisitors();
  return visitors.size;
}
