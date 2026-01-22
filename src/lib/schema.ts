import { pgTable, serial, text, integer, timestamp, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
	id: serial('id').primaryKey(),
	username: text('username').notNull().unique(),
	passwordHash: text('password_hash').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

export const sessions = pgTable('sessions', {
	token: text('token').primaryKey(),
	userId: integer('user_id')
		.references(() => users.id)
		.notNull(),
	expiresAt: timestamp('expires_at').notNull()
});

export const contacts = pgTable('contacts', {
	id: serial('id').primaryKey(),
	userId: integer('user_id')
		.references(() => users.id)
		.notNull(),
	name: text('name').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

export const interactions = pgTable('interactions', {
	id: serial('id').primaryKey(),
	userId: integer('user_id')
		.references(() => users.id)
		.notNull(),
	rating: integer('rating'),
	notes: text('notes').default('').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Junction table for many-to-many relationship between interactions and contacts
export const interactionContacts = pgTable(
	'interaction_contacts',
	{
		interactionId: integer('interaction_id')
			.references(() => interactions.id, { onDelete: 'cascade' })
			.notNull(),
		contactId: integer('contact_id')
			.references(() => contacts.id, { onDelete: 'cascade' })
			.notNull()
	},
	(table) => ({
		pk: primaryKey({ columns: [table.interactionId, table.contactId] })
	})
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
	sessions: many(sessions),
	contacts: many(contacts),
	interactions: many(interactions)
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id]
	})
}));

export const contactsRelations = relations(contacts, ({ one, many }) => ({
	user: one(users, {
		fields: [contacts.userId],
		references: [users.id]
	}),
	interactionContacts: many(interactionContacts)
}));

export const interactionsRelations = relations(interactions, ({ one, many }) => ({
	user: one(users, {
		fields: [interactions.userId],
		references: [users.id]
	}),
	interactionContacts: many(interactionContacts)
}));

export const interactionContactsRelations = relations(interactionContacts, ({ one }) => ({
	interaction: one(interactions, {
		fields: [interactionContacts.interactionId],
		references: [interactions.id]
	}),
	contact: one(contacts, {
		fields: [interactionContacts.contactId],
		references: [contacts.id]
	})
}));
