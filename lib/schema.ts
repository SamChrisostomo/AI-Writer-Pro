import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  preferences: text('preferences'), // JSON string for theme, default agent, etc.
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const agents = pgTable('agents', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  name: text('name').notNull(),
  prompt: text('prompt').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const chats = pgTable('chats', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  topic: text('topic').notNull(),
  textType: text('text_type').notNull(),
  content: text('content').notNull(),
  agentId: uuid('agent_id').references(() => agents.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
