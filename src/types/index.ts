export const localFieldNames = [
  'id',
  'title',
  'slug',
  'status',
  'excerpt',
  'content',
  'updatedAt',
  'publishedAt',
  'author',
] as const;

export type LocalFieldName = (typeof localFieldNames)[number];

export const listViewColumnNames = [
  'title',
  'slug',
  'status',
  'updatedAt',
  'publishedAt',
  'excerpt',
  'author',
] as const;

export type ListViewColumnName = (typeof listViewColumnNames)[number];

export const listSearchFieldNames = ['title', 'slug', 'excerpt', 'content'] as const;

export type ListSearchFieldName = (typeof listSearchFieldNames)[number];

export type AuthConfig =
  | {
      type: 'apiKey';
      key: string;
      collection?: string | undefined;
    }
  | {
      type: 'jwt';
      token: string;
    }
  | {
      type: 'login';
      collection: string;
      email?: string | undefined;
      username?: string | undefined;
      password: string;
    };

export type FieldMapping = Partial<Record<LocalFieldName, string>>;

export interface PayloadPostListViewConfig {
  columns?: ListViewColumnName[] | undefined;
  searchFields?: ListSearchFieldName[] | undefined;
}

export interface PayloadPostConfig {
  baseUrl: string;
  collection: string;
  auth: AuthConfig;
  fields: FieldMapping;
  list?: PayloadPostListViewConfig | undefined;
  pagination?: {
    limit: number;
  } | undefined;
}

export interface PayloadPostWorkspaceConfig {
  defaultProfile?: string | undefined;
  profiles: Record<string, PayloadPostConfig>;
}

export interface PostRecord {
  id?: string;
  title?: string;
  slug?: string;
  status?: string;
  excerpt?: string | null;
  content?: string;
  updatedAt?: string;
  publishedAt?: string | null;
  author?: string | null;
  [key: string]: unknown;
}

export interface ListPostsArgs {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
}

export interface CreatePostArgs {
  title?: string;
  slug?: string;
  status?: string;
  excerpt?: string;
  content?: unknown;
  author?: unknown;
  [key: string]: unknown;
}

export interface UpdatePostArgs {
  title?: string;
  slug?: string;
  status?: string;
  excerpt?: string;
  content?: unknown;
  author?: unknown;
  [key: string]: unknown;
}

export interface QueryResult<T> {
  docs: T[];
  totalDocs?: number;
  limit?: number;
  totalPages?: number;
  page?: number;
  pagingCounter?: number;
  hasPrevPage?: boolean;
  hasNextPage?: boolean;
  prevPage?: number | null;
  nextPage?: number | null;
}
