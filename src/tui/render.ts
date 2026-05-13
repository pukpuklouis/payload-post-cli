import type { TuiPost, TuiState } from './types.js';

function columnPad(text: string, width: number): string {
  const normalized = text.replace(/\n/g, ' ');
  return normalized.length >= width ? normalized.slice(0, width) : normalized.padEnd(width, ' ');
}

export function renderDashboard(state: TuiState, posts: TuiPost[]): string {
  const leftWidth = 28;
  const middleWidth = 38;
  const rightWidth = 38;

  const filters = [
    'Filters',
    `Search: ${state.search || '(none)'}`,
    `Screen: ${state.screen}`,
    '',
    'j/k navigate',
    '/ search',
    'c create',
    'e edit',
    'd delete',
    'p publish',
  ];

  const list = [
    'Posts',
    ...posts.map((post, index) => {
      const marker = index === state.selectedIndex ? '>' : ' ';
      return `${marker} ${post.title} (${post.status})`;
    }),
  ];

  const selected = posts[state.selectedIndex];
  const details = [
    'Details',
    selected ? `Title: ${selected.title}` : 'Title: (none)',
    selected ? `Slug: ${selected.slug}` : 'Slug: (none)',
    selected ? `Status: ${selected.status}` : 'Status: (none)',
    selected ? `Updated: ${selected.updatedAt}` : 'Updated: (none)',
    '',
    state.message,
  ];

  const height = Math.max(filters.length, list.length, details.length);
  const lines: string[] = [];

  for (let row = 0; row < height; row += 1) {
    lines.push(
      [
        columnPad(filters[row] ?? '', leftWidth),
        columnPad(list[row] ?? '', middleWidth),
        columnPad(details[row] ?? '', rightWidth),
      ].join(' | '),
    );
  }

  return lines.join('\n');
}

