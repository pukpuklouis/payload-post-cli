import type { PostRecord } from '../types/index.js';

function pad(value: string, width: number): string {
  const safe = value ?? '';
  return safe.length >= width ? safe : `${safe}${' '.repeat(width - safe.length)}`;
}

export function formatPostsTable(posts: PostRecord[]): string {
  const rows = posts.map((post) => [
    String(post.title ?? ''),
    String(post.slug ?? ''),
    String(post.status ?? ''),
    String(post.updatedAt ?? ''),
  ]);
  const headers = ['Title', 'Slug', 'Status', 'Updated At'];
  const widths = headers.map((header, index) =>
    Math.max(header.length, ...rows.map((row) => row[index]?.length ?? 0)),
  );

  const lines = [
    headers.map((header, index) => pad(header, widths[index] ?? header.length)).join('  '),
    widths.map((width) => '-'.repeat(width)).join('  '),
    ...rows.map((row) =>
      row.map((cell, index) => pad(cell, widths[index] ?? cell.length)).join('  '),
    ),
  ];

  return lines.join('\n');
}
