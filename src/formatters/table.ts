import { type ListViewColumnName, type PostRecord } from '../types/index.js';

const defaultListViewColumns: ListViewColumnName[] = ['title', 'slug', 'status', 'updatedAt'];

function pad(value: string, width: number): string {
  const safe = value ?? '';
  return safe.length >= width ? safe : `${safe}${' '.repeat(width - safe.length)}`;
}

export function formatPostsTable(
  posts: PostRecord[],
  columns: ListViewColumnName[] = [...defaultListViewColumns],
): string {
  const headers: Record<ListViewColumnName, string> = {
    title: 'Title',
    slug: 'Slug',
    status: 'Status',
    updatedAt: 'Updated At',
    publishedAt: 'Published At',
    excerpt: 'Excerpt',
    author: 'Author',
  };

  const rows = posts.map((post) => columns.map((column) => String(post[column] ?? '')));
  const renderedHeaders = columns.map((column) => headers[column]);
  const widths = renderedHeaders.map((header, index) =>
    Math.max(header.length, ...rows.map((row) => row[index]?.length ?? 0)),
  );

  const lines = [
    renderedHeaders.map((header, index) => pad(header, widths[index] ?? header.length)).join('  '),
    widths.map((width) => '-'.repeat(width)).join('  '),
    ...rows.map((row) =>
      row.map((cell, index) => pad(cell, widths[index] ?? cell.length)).join('  '),
    ),
  ];

  return lines.join('\n');
}
