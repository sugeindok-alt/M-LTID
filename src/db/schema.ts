import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  bigint,
  jsonb,
  numeric,
  uniqueIndex,
  index,
  primaryKey,
} from 'drizzle-orm/pg-core';
import type { Recipe } from '@/lib/recipes';
const created = () => timestamp('created_at', { withTimezone: true }).defaultNow().notNull();
const updated = () => timestamp('updated_at', { withTimezone: true }).defaultNow().notNull();
export const user = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  createdAt: created(),
  updatedAt: updated(),
});
export const session = pgTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    token: text('token').notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: created(),
    updatedAt: updated(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (t) => [index('sessions_user_idx').on(t.userId)],
);
export const account = pgTable(
  'accounts',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
    scope: text('scope'),
    password: text('password'),
    createdAt: created(),
    updatedAt: updated(),
  },
  (t) => [
    uniqueIndex('accounts_provider_account_idx').on(t.providerId, t.accountId),
    index('accounts_user_idx').on(t.userId),
  ],
);
export const verification = pgTable(
  'verifications',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: created(),
    updatedAt: updated(),
  },
  (t) => [index('verification_identifier_idx').on(t.identifier)],
);
export const rateLimit = pgTable('auth_rate_limits', {
  id: text('id').primaryKey(),
  key: text('key').notNull().unique(),
  count: integer('count').notNull(),
  lastRequest: bigint('last_request', { mode: 'number' }).notNull(),
});
export const requestLimits = pgTable('request_limits', {
  key: text('key').primaryKey(),
  count: integer('count').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
});
export const recipeCache = pgTable('recipe_cache', {
  id: text('id').primaryKey(),
  data: jsonb('data').$type<Recipe>().notNull(),
  fetchedAt: created(),
});
// A saved recipe is a user's favourite. One association, no conflicting duplicate lists.
export const favorites = pgTable(
  'favorites',
  {
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    recipeId: text('recipe_id')
      .notNull()
      .references(() => recipeCache.id),
    createdAt: created(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.recipeId] }),
    index('favorites_recipe_idx').on(t.recipeId),
  ],
);
export const shoppingItems = pgTable(
  'shopping_items',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    nameKey: text('name_key').notNull(),
    mergeKey: text('merge_key').notNull(),
    amount: numeric('amount', { precision: 12, scale: 3, mode: 'number' }),
    unit: text('unit'),
    measure: text('measure').notNull(),
    purchased: boolean('purchased').default(false).notNull(),
    recipeId: text('recipe_id'),
    createdAt: created(),
    updatedAt: updated(),
  },
  (t) => [
    uniqueIndex('shopping_merge_idx').on(t.userId, t.nameKey, t.mergeKey),
    index('shopping_user_idx').on(t.userId),
  ],
);
export const shoppingImports = pgTable(
  'shopping_imports',
  {
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    requestId: text('request_id').notNull(),
    createdAt: created(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.requestId] })],
);
export const preferences = pgTable('user_preferences', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  theme: text('theme').default('olive').notNull(),
  favoriteCategory: text('favorite_category').default('').notNull(),
  updatedAt: updated(),
});
// Open Food Facts-derived records are isolated from the proprietary recipe/account records.
export const productCache = pgTable('off_product_cache', {
  key: text('key').primaryKey(),
  data: jsonb('data').notNull(),
  source: text('source').default('Open Food Facts').notNull(),
  license: text('license').default('ODbL-1.0').notNull(),
  fetchedAt: created(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
});
export const productReferences = pgTable(
  'user_product_references',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    recipeId: text('recipe_id').notNull(),
    ingredient: text('ingredient').notNull(),
    barcode: text('barcode').notNull(),
    createdAt: created(),
  },
  (t) => [uniqueIndex('product_reference_idx').on(t.userId, t.recipeId, t.ingredient)],
);
export const emailRecords = pgTable('email_send_records', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  kind: text('kind').notNull(),
  idempotencyKey: text('idempotency_key').notNull().unique(),
  status: text('status').notNull(),
  providerId: text('provider_id'),
  createdAt: created(),
  updatedAt: updated(),
});
