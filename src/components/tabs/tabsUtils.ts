import { nanoid } from 'nanoid';
import type { TabItem, TabSession, TabsState } from '../../types';

// ── Bookmark Filter ──────────────────────────────────────────

export function matchesFilter(
  item: { title?: string; url: string; tags: string[] },
  searchQuery: string,
  activeTagFilter: string | null,
): boolean {
  const query = searchQuery.toLowerCase();
  const matchesSearch =
    !query ||
    item.title?.toLowerCase().includes(query) ||
    item.url.toLowerCase().includes(query) ||
    item.tags.some((t) => t.toLowerCase().includes(query));

  const matchesTag = !activeTagFilter || item.tags.includes(activeTagFilter);

  return matchesSearch && matchesTag;
}

// ── URL Parsing ─────────────────────────────────────────────────

export function parseUrls(raw: string): string[] {
  return raw
    .split(/[\n\s,]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && isValidUrl(s));
}

export function isValidUrl(url: string): boolean {
  return /^https?:\/\//.test(url);
}

export function deduplicateUrls(urls: string[]): { unique: string[]; duplicates: string[] } {
  const seen = new Set<string>();
  const unique: string[] = [];
  const duplicates: string[] = [];

  for (const url of urls) {
    if (seen.has(url)) {
      duplicates.push(url);
    } else {
      seen.add(url);
      unique.push(url);
    }
  }

  return { unique, duplicates };
}

// ── Favicon & Domain ───────────────────────────────────────────

export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

// TODO: This sends every domain to Google's favicon service (privacy tradeoff).
// For MVP this is acceptable; consider self-hosted favicons or icon.js.org for production.
export function faviconUrl(url: string): string {
  const domain = extractDomain(url);
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`;
}

// ── Bookmark HTML Parsing ──────────────────────────────────────

export function parseBookmarks(html: string): TabSession[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const sessions: TabSession[] = [];
  let orphanSession: TabSession | null = null;

  function processNode(parentNode: Element, sessionStack: TabSession[]): void {
    const children = Array.from(parentNode.children);
    let currentStack = [...sessionStack];

    for (const child of children) {
      if (child.tagName === 'DL') {
        // Sibling <DL> — recurse into nested bookmark list, carrying current session stack
        processNode(child, currentStack);
      } else if (child.tagName === 'DT') {
        const h3 = child.querySelector('h3');
        const a = child.querySelector('a');

        if (h3) {
          const newSession = createSession(h3.textContent?.trim() || undefined);
          sessions.push(newSession);
          currentStack = [...currentStack, newSession];
        } else if (a) {
          const url = a.getAttribute('href');
          const title = a.textContent?.trim();

          if (url && isValidUrl(url)) {
            const item = createTabItem(url, title || undefined);

            if (currentStack.length > 0) {
              currentStack[currentStack.length - 1].items.push(item);
            } else {
              if (!orphanSession) {
                orphanSession = createSession('Imported');
                sessions.push(orphanSession);
              }
              orphanSession.items.push(item);
            }
          }
        }
      }
    }
  }

  // Find top-level DL elements
  const dlElements = doc.querySelectorAll('dl');
  const topLevelDls: Element[] = [];
  for (const dl of dlElements) {
    if (!dl.parentElement?.closest('dl')) {
      topLevelDls.push(dl);
    }
  }

  for (const dl of topLevelDls) {
    processNode(dl, []);
  }

  // Handle case where no sessions were found but there are links
  if (sessions.length === 0) {
    const allLinks = doc.querySelectorAll('a[href]');
    if (allLinks.length > 0) {
      const session = createSession('Imported');
      for (const a of Array.from(allLinks)) {
        const url = a.getAttribute('href');
        const title = a.textContent?.trim();
        if (url && isValidUrl(url)) {
          session.items.push(createTabItem(url, title || undefined));
        }
      }
      if (session.items.length > 0) {
        sessions.push(session);
      }
    }
  }

  return sessions;
}

// ── Bookmark HTML Export ───────────────────────────────────────

export function exportToBookmarksHtml(sessions: TabSession[]): string {
  const lines: string[] = [
    '<!DOCTYPE NETSCAPE-Bookmark-file-1>',
    '<!-- This is an automatically generated file.',
    '     It will be read and overwritten.',
    '     DO NOT EDIT! -->',
    '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">',
    '<TITLE>Bookmarks</TITLE>',
    '<H1>Bookmarks</H1>',
    '<DL><p>',
  ];

  for (const session of sessions) {
    const folderName = escapeHtml(session.name);
    lines.push(`    <DT><H3>${folderName}</H3>`);
    lines.push('    <DL><p>');

    for (const item of session.items) {
      const itemUrl = escapeAttr(item.url);
      const itemTitle = escapeHtml(item.title || extractDomain(item.url));
      lines.push(`        <DT><A HREF="${itemUrl}">${itemTitle}</A>`);
    }

    lines.push('    </DL><p>');
  }

  lines.push('</DL><p>');
  return lines.join('\n');
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ── JSON Export / Import ───────────────────────────────────────

export function exportToJson(state: TabsState): string {
  return JSON.stringify(state, null, 2);
}

// ── File Download Helper ───────────────────────────────────────

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Factory Functions ──────────────────────────────────────────

export function createSession(name?: string): TabSession {
  return {
    id: nanoid(8),
    name: name || 'New Session',
    createdAt: Date.now(),
    items: [],
  };
}

export function createTabItem(url: string, title?: string): TabItem {
  return {
    id: nanoid(8),
    url,
    title,
    favicon: faviconUrl(url),
    tags: [],
    order: 0,
  };
}

// ── JSON State Parsing ──────────────────────────────────────────

export function parseJsonState(json: string): TabSession[] {
  let state: any;
  try {
    state = JSON.parse(json);
  } catch (e) {
    console.error('Failed to parse JSON state:', e);
    return [];
  }

  // Validate required fields
  if (!state || !state.sessions || !Array.isArray(state.sessions)) {
    console.error('Invalid TabsState JSON: missing sessions array');
    return [];
  }

  // Convert to flat array of sessions (preserving existing format)
  return state.sessions.map((session: any) => ({
    id: session.id || nanoid(8),
    name: session.name || 'Imported Session',
    createdAt: session.createdAt || Date.now(),
    isWorkspace: session.isWorkspace || false,
    items: (session.items || []).map((item: any) => ({
      id: item.id || nanoid(8),
      url: item.url || '',
      title: item.title || undefined,
      tags: item.tags || [],
      order: item.order !== undefined ? item.order : 0,
      locked: item.locked !== undefined ? item.locked : false,
      starred: item.starred !== undefined ? item.starred : false,
    })),
  }));
}

