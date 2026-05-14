import { z } from 'zod';
import {
  listSearchFieldNames,
  listViewColumnNames,
  localFieldNames,
} from '../types/index.js';

export const LocalFieldNameSchema = z.enum(localFieldNames);
export const ListViewColumnNameSchema = z.enum(listViewColumnNames);
export const ListSearchFieldNameSchema = z.enum(listSearchFieldNames);

function uniqueEnumArraySchema(schema: z.ZodEnum<any>, label: string) {
  return z
    .array(schema)
    .min(1, `${label} must not be empty`)
    .superRefine((values, ctx) => {
      const seen = new Set<string>();
      for (const [index, value] of values.entries()) {
        if (seen.has(value)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${label} must not contain duplicates`,
            path: [index],
          });
          continue;
        }

        seen.add(value);
      }
    });
}

export const PayloadPostListViewConfigSchema = z.object({
  columns: uniqueEnumArraySchema(ListViewColumnNameSchema, 'list.columns').optional(),
  searchFields: uniqueEnumArraySchema(ListSearchFieldNameSchema, 'list.searchFields').optional(),
});

export const FieldsMappingSchema = z
  .record(LocalFieldNameSchema, z.string().min(1))
  .default({
    id: 'id',
    title: 'title',
    slug: 'slug',
    status: 'status',
    excerpt: 'excerpt',
    content: 'content',
    updatedAt: 'updatedAt',
    publishedAt: 'publishedAt',
    author: 'author',
  });

const ApiKeyAuthSchema = z.object({
  type: z.literal('apiKey'),
  key: z.string().min(1),
  collection: z.string().min(1).optional(),
});

const JwtAuthSchema = z.object({
  type: z.literal('jwt'),
  token: z.string().min(1),
});

const LoginAuthSchema = z
  .object({
    type: z.literal('login'),
    collection: z.string().min(1),
    email: z.string().email().optional(),
    username: z.string().min(1).optional(),
    password: z.string().min(1),
  });

export const PayloadPostConfigSchema = z.object({
  baseUrl: z.string().url(),
  collection: z.string().min(1).default('posts'),
  auth: z.discriminatedUnion('type', [ApiKeyAuthSchema, JwtAuthSchema, LoginAuthSchema]),
  fields: FieldsMappingSchema,
  list: PayloadPostListViewConfigSchema.optional(),
  pagination: z
    .object({
      limit: z.number().int().positive().default(10),
    })
    .optional(),
});

export const PayloadPostWorkspaceConfigSchema = z.object({
  defaultProfile: z.string().min(1).optional(),
  profiles: z
    .record(z.string().min(1), PayloadPostConfigSchema)
    .refine((profiles) => Object.keys(profiles).length > 0, 'At least one profile is required'),
});

export const PayloadPostConfigFileSchema = z.union([
  PayloadPostConfigSchema,
  PayloadPostWorkspaceConfigSchema,
]);

export type PayloadPostConfigInput = z.input<typeof PayloadPostConfigSchema>;
export type PayloadPostConfigOutput = z.output<typeof PayloadPostConfigSchema>;
export type PayloadPostWorkspaceConfigInput = z.input<typeof PayloadPostWorkspaceConfigSchema>;
export type PayloadPostWorkspaceConfigOutput = z.output<typeof PayloadPostWorkspaceConfigSchema>;
export type PayloadPostConfigFileInput = z.input<typeof PayloadPostConfigFileSchema>;
export type PayloadPostConfigFileOutput = z.output<typeof PayloadPostConfigFileSchema>;
