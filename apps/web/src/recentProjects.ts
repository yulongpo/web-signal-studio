/**
 * Bot-B G01 File recent projects (localStorage).
 * Mirrors desktop recentProjectsMenu_ / QSettings recentProjects.
 */
const KEY = 'wss.recentProjects.v1';
const MAX = 8;
const MAX_BYTES = 400_000;

export type RecentProjectEntry = {
  name: string;
  text: string;
  savedAt: string;
};

export function listRecentProjects(): RecentProjectEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentProjectEntry[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX) : [];
  } catch {
    return [];
  }
}

export function pushRecentProject(name: string, text: string): void {
  if (!text || text.length > MAX_BYTES) return;
  const entry: RecentProjectEntry = {
    name: name || 'project.json',
    text,
    savedAt: new Date().toISOString(),
  };
  const prev = listRecentProjects().filter((e) => e.name !== entry.name);
  const next = [entry, ...prev].slice(0, MAX);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    while (next.length > 1) {
      next.pop();
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
        return;
      } catch {
        /* continue */
      }
    }
  }
}

export function clearRecentProjects(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
