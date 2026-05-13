import { z } from 'zod';
import { localFieldNames } from '../types/index.js';

export const LocalFieldNameSchema = z.enum(localFieldNames);

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
  pagination: z
    .object({
      limit: z.number().int().positive().default(10),
    })
    .optional(),
});

export type PayloadPostConfigInput = z.input<typeof PayloadPostConfigSchema>;
export type PayloadPostConfigOutput = z.output<typeof PayloadPostConfigSchema>;
