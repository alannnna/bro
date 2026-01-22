import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { eq, and, ilike, or, gte, inArray, desc } from 'drizzle-orm';
import * as schema from './schema';
import { DATABASE_URL } from '$env/static/private';

const client = postgres(DATABASE_URL);
export const db = drizzle(client, { schema });

// Name helpers
export function splitName(fullName: string): { firstName: string; lastName: string } {
	const trimmed = fullName.trim();
	const lastSpaceIndex = trimmed.lastIndexOf(' ');
	if (lastSpaceIndex === -1) {
		return { firstName: trimmed, lastName: '' };
	}
	return {
		firstName: trimmed.substring(0, lastSpaceIndex),
		lastName: trimmed.substring(lastSpaceIndex + 1)
	};
}

export function combineName(firstName: string, lastName: string): string {
	if (!lastName) return firstName;
	return `${firstName} ${lastName}`;
}

// Types
interface User {
	id: number;
	username: string;
	passwordHash: string;
	createdAt: string;
}

interface Session {
	token: string;
	userId: number;
	expiresAt: string;
}

interface Contact {
	id: number;
	userId: number;
	firstName: string;
	lastName: string;
	name: string; // computed: firstName + lastName
	location: string;
	notes: string;
	createdAt: string;
}

interface Interaction {
	id: number;
	userId: number;
	contactIds: number[];
	rating: number | null;
	notes: string;
	createdAt: string;
	updatedAt: string;
}

// Auth functions
export async function registerUser(username: string, password: string): Promise<{ user?: User; error?: string }> {
	const existing = await db.select().from(schema.users)
		.where(ilike(schema.users.username, username))
		.limit(1);

	if (existing.length > 0) {
		return { error: 'Username already exists' };
	}

	const passwordHash = await bcrypt.hash(password, 10);
	const [user] = await db.insert(schema.users).values({
		username,
		passwordHash
	}).returning();

	return {
		user: {
			id: user.id,
			username: user.username,
			passwordHash: user.passwordHash,
			createdAt: user.createdAt.toISOString()
		}
	};
}

export async function loginUser(username: string, password: string): Promise<{ session?: Session; error?: string }> {
	const [user] = await db.select().from(schema.users)
		.where(ilike(schema.users.username, username))
		.limit(1);

	if (!user) {
		return { error: 'Invalid username or password' };
	}

	const valid = await bcrypt.compare(password, user.passwordHash);
	if (!valid) {
		return { error: 'Invalid username or password' };
	}

	const token = randomBytes(32).toString('hex');
	const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

	await db.insert(schema.sessions).values({
		token,
		userId: user.id,
		expiresAt
	});

	return {
		session: {
			token,
			userId: user.id,
			expiresAt: expiresAt.toISOString()
		}
	};
}

export async function getSessionUser(token: string): Promise<User | null> {
	const [session] = await db.select().from(schema.sessions)
		.where(eq(schema.sessions.token, token))
		.limit(1);

	if (!session) return null;

	if (session.expiresAt < new Date()) {
		await db.delete(schema.sessions).where(eq(schema.sessions.token, token));
		return null;
	}

	const [user] = await db.select().from(schema.users)
		.where(eq(schema.users.id, session.userId))
		.limit(1);

	if (!user) return null;

	return {
		id: user.id,
		username: user.username,
		passwordHash: user.passwordHash,
		createdAt: user.createdAt.toISOString()
	};
}

export async function logout(token: string): Promise<void> {
	await db.delete(schema.sessions).where(eq(schema.sessions.token, token));
}

// Contact functions
export async function createContact(
	userId: number,
	data: { firstName: string; lastName: string; location?: string; notes?: string }
): Promise<Contact> {
	const [contact] = await db.insert(schema.contacts).values({
		userId,
		firstName: data.firstName,
		lastName: data.lastName,
		location: data.location || '',
		notes: data.notes || ''
	}).returning();

	return {
		id: contact.id,
		userId: contact.userId,
		firstName: contact.firstName,
		lastName: contact.lastName,
		name: combineName(contact.firstName, contact.lastName),
		location: contact.location,
		notes: contact.notes,
		createdAt: contact.createdAt.toISOString()
	};
}

export async function searchContacts(userId: number, query: string): Promise<Contact[]> {
	const contacts = await db.select().from(schema.contacts)
		.where(and(
			eq(schema.contacts.userId, userId),
			or(
				ilike(schema.contacts.firstName, `%${query}%`),
				ilike(schema.contacts.lastName, `%${query}%`)
			)
		))
		.limit(10);

	return contacts.map(c => ({
		id: c.id,
		userId: c.userId,
		firstName: c.firstName,
		lastName: c.lastName,
		name: combineName(c.firstName, c.lastName),
		location: c.location,
		notes: c.notes,
		createdAt: c.createdAt.toISOString()
	}));
}

export async function findOrCreateContact(userId: number, fullName: string): Promise<Contact> {
	const { firstName, lastName } = splitName(fullName);

	const [existing] = await db.select().from(schema.contacts)
		.where(and(
			eq(schema.contacts.userId, userId),
			ilike(schema.contacts.firstName, firstName),
			ilike(schema.contacts.lastName, lastName)
		))
		.limit(1);

	if (existing) {
		return {
			id: existing.id,
			userId: existing.userId,
			firstName: existing.firstName,
			lastName: existing.lastName,
			name: combineName(existing.firstName, existing.lastName),
			location: existing.location,
			notes: existing.notes,
			createdAt: existing.createdAt.toISOString()
		};
	}

	const [contact] = await db.insert(schema.contacts).values({
		userId,
		firstName,
		lastName
	}).returning();

	return {
		id: contact.id,
		userId: contact.userId,
		firstName: contact.firstName,
		lastName: contact.lastName,
		name: combineName(contact.firstName, contact.lastName),
		location: contact.location,
		notes: contact.notes,
		createdAt: contact.createdAt.toISOString()
	};
}

export async function createInteraction(
	userId: number,
	contactIds: number[],
	rating: number | null,
	notes: string = ''
): Promise<Interaction> {
	const [interaction] = await db.insert(schema.interactions).values({
		userId,
		rating,
		notes
	}).returning();

	// Insert junction table records
	if (contactIds.length > 0) {
		await db.insert(schema.interactionContacts).values(
			contactIds.map(contactId => ({
				interactionId: interaction.id,
				contactId
			}))
		);
	}

	return {
		id: interaction.id,
		userId: interaction.userId,
		contactIds,
		rating: interaction.rating,
		notes: interaction.notes,
		createdAt: interaction.createdAt.toISOString(),
		updatedAt: interaction.updatedAt.toISOString()
	};
}

export async function updateInteraction(
	userId: number,
	id: number,
	updates: { rating?: number; notes?: string; contactNames?: string[] }
): Promise<Interaction | null> {
	// Check ownership
	const [existing] = await db.select().from(schema.interactions)
		.where(and(
			eq(schema.interactions.id, id),
			eq(schema.interactions.userId, userId)
		))
		.limit(1);

	if (!existing) return null;

	// Update the interaction
	const updateData: { rating?: number; notes?: string; updatedAt: Date } = {
		updatedAt: new Date()
	};
	if (updates.rating !== undefined) updateData.rating = updates.rating;
	if (updates.notes !== undefined) updateData.notes = updates.notes;

	const [updated] = await db.update(schema.interactions)
		.set(updateData)
		.where(eq(schema.interactions.id, id))
		.returning();

	// Update contacts if provided
	let contactIds: number[] = [];
	if (updates.contactNames !== undefined) {
		// Delete existing junction records
		await db.delete(schema.interactionContacts)
			.where(eq(schema.interactionContacts.interactionId, id));

		// Create new contacts and junction records
		for (const name of updates.contactNames) {
			const contact = await findOrCreateContact(userId, name);
			contactIds.push(contact.id);
		}

		if (contactIds.length > 0) {
			await db.insert(schema.interactionContacts).values(
				contactIds.map(contactId => ({
					interactionId: id,
					contactId
				}))
			);
		}
	} else {
		// Get existing contact IDs
		const junctionRecords = await db.select().from(schema.interactionContacts)
			.where(eq(schema.interactionContacts.interactionId, id));
		contactIds = junctionRecords.map(r => r.contactId);
	}

	return {
		id: updated.id,
		userId: updated.userId,
		contactIds,
		rating: updated.rating,
		notes: updated.notes,
		createdAt: updated.createdAt.toISOString(),
		updatedAt: updated.updatedAt.toISOString()
	};
}

export async function deleteInteraction(userId: number, id: number): Promise<boolean> {
	const result = await db.delete(schema.interactions)
		.where(and(
			eq(schema.interactions.id, id),
			eq(schema.interactions.userId, userId)
		))
		.returning();

	return result.length > 0;
}

export interface ContactWithLastInteraction {
	id: number;
	userId: number;
	firstName: string;
	lastName: string;
	name: string;
	location: string;
	notes: string;
	createdAt: string;
	lastInteractionAt: string | null;
}

export async function getAllContacts(userId: number): Promise<ContactWithLastInteraction[]> {
	const contacts = await db.select().from(schema.contacts)
		.where(eq(schema.contacts.userId, userId));

	const result: ContactWithLastInteraction[] = [];

	for (const contact of contacts) {
		// Get the most recent interaction for this contact
		const junctionRecords = await db.select().from(schema.interactionContacts)
			.where(eq(schema.interactionContacts.contactId, contact.id));

		let lastInteractionAt: string | null = null;

		if (junctionRecords.length > 0) {
			const interactionIds = junctionRecords.map(r => r.interactionId);
			const [lastInteraction] = await db.select().from(schema.interactions)
				.where(inArray(schema.interactions.id, interactionIds))
				.orderBy(desc(schema.interactions.createdAt))
				.limit(1);

			if (lastInteraction) {
				lastInteractionAt = lastInteraction.createdAt.toISOString();
			}
		}

		result.push({
			id: contact.id,
			userId: contact.userId,
			firstName: contact.firstName,
			lastName: contact.lastName,
			name: combineName(contact.firstName, contact.lastName),
			location: contact.location,
			notes: contact.notes,
			createdAt: contact.createdAt.toISOString(),
			lastInteractionAt
		});
	}

	return result;
}

export async function getContactById(userId: number, id: number): Promise<Contact | null> {
	const [contact] = await db.select().from(schema.contacts)
		.where(and(
			eq(schema.contacts.id, id),
			eq(schema.contacts.userId, userId)
		))
		.limit(1);

	if (!contact) return null;

	return {
		id: contact.id,
		userId: contact.userId,
		firstName: contact.firstName,
		lastName: contact.lastName,
		name: combineName(contact.firstName, contact.lastName),
		location: contact.location,
		notes: contact.notes,
		createdAt: contact.createdAt.toISOString()
	};
}

export async function updateContact(
	userId: number,
	id: number,
	updates: { firstName?: string; lastName?: string; location?: string; notes?: string }
): Promise<Contact | null> {
	const [existing] = await db.select().from(schema.contacts)
		.where(and(
			eq(schema.contacts.id, id),
			eq(schema.contacts.userId, userId)
		))
		.limit(1);

	if (!existing) return null;

	const updateData: { firstName?: string; lastName?: string; location?: string; notes?: string } = {};
	if (updates.firstName !== undefined) updateData.firstName = updates.firstName;
	if (updates.lastName !== undefined) updateData.lastName = updates.lastName;
	if (updates.location !== undefined) updateData.location = updates.location;
	if (updates.notes !== undefined) updateData.notes = updates.notes;

	const [updated] = await db.update(schema.contacts)
		.set(updateData)
		.where(eq(schema.contacts.id, id))
		.returning();

	return {
		id: updated.id,
		userId: updated.userId,
		firstName: updated.firstName,
		lastName: updated.lastName,
		name: combineName(updated.firstName, updated.lastName),
		location: updated.location,
		notes: updated.notes,
		createdAt: updated.createdAt.toISOString()
	};
}

export async function getInteractionsForContact(userId: number, contactId: number): Promise<Interaction[]> {
	// Get interaction IDs for this contact
	const junctionRecords = await db.select().from(schema.interactionContacts)
		.where(eq(schema.interactionContacts.contactId, contactId));

	if (junctionRecords.length === 0) return [];

	const interactionIds = junctionRecords.map(r => r.interactionId);

	const interactions = await db.select().from(schema.interactions)
		.where(and(
			inArray(schema.interactions.id, interactionIds),
			eq(schema.interactions.userId, userId)
		))
		.orderBy(desc(schema.interactions.createdAt));

	const result: Interaction[] = [];

	for (const interaction of interactions) {
		const contactJunctions = await db.select().from(schema.interactionContacts)
			.where(eq(schema.interactionContacts.interactionId, interaction.id));

		result.push({
			id: interaction.id,
			userId: interaction.userId,
			contactIds: contactJunctions.map(j => j.contactId),
			rating: interaction.rating,
			notes: interaction.notes,
			createdAt: interaction.createdAt.toISOString(),
			updatedAt: interaction.updatedAt.toISOString()
		});
	}

	return result;
}

export interface InteractionWithContacts extends Interaction {
	contactNames: string[];
}

export async function getInteractionsForContactWithNames(
	userId: number,
	contactId: number
): Promise<InteractionWithContacts[]> {
	const interactions = await getInteractionsForContact(userId, contactId);

	// Get all contacts for this user
	const userContacts = await db.select().from(schema.contacts)
		.where(eq(schema.contacts.userId, userId));
	const contactMap = new Map(userContacts.map(c => [c.id, combineName(c.firstName, c.lastName)]));

	return interactions.map(i => ({
		...i,
		contactNames: i.contactIds.map(id => contactMap.get(id) || 'Unknown')
	}));
}

export async function getAllInteractions(userId: number): Promise<InteractionWithContacts[]> {
	const interactions = await db.select().from(schema.interactions)
		.where(eq(schema.interactions.userId, userId))
		.orderBy(desc(schema.interactions.createdAt));

	// Get all contacts for this user
	const userContacts = await db.select().from(schema.contacts)
		.where(eq(schema.contacts.userId, userId));
	const contactMap = new Map(userContacts.map(c => [c.id, combineName(c.firstName, c.lastName)]));

	const result: InteractionWithContacts[] = [];

	for (const interaction of interactions) {
		const junctionRecords = await db.select().from(schema.interactionContacts)
			.where(eq(schema.interactionContacts.interactionId, interaction.id));

		const contactIds = junctionRecords.map(r => r.contactId);

		result.push({
			id: interaction.id,
			userId: interaction.userId,
			contactIds,
			rating: interaction.rating,
			notes: interaction.notes,
			createdAt: interaction.createdAt.toISOString(),
			updatedAt: interaction.updatedAt.toISOString(),
			contactNames: contactIds.map(id => contactMap.get(id) || 'Unknown')
		});
	}

	return result;
}

export interface InteractionStats {
	positiveToday: number;
	positiveThisWeek: number;
	positiveThisMonth: number;
}

export async function getInteractionStats(userId: number): Promise<InteractionStats> {
	const now = new Date();
	const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const startOfWeek = new Date(startOfToday);
	startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
	const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

	const interactions = await db.select().from(schema.interactions)
		.where(eq(schema.interactions.userId, userId));

	const isPositive = (rating: number | null) => rating === null || rating === 0 || rating >= 3;

	return {
		positiveToday: interactions.filter(
			(i) => isPositive(i.rating) && i.createdAt >= startOfToday
		).length,
		positiveThisWeek: interactions.filter(
			(i) => isPositive(i.rating) && i.createdAt >= startOfWeek
		).length,
		positiveThisMonth: interactions.filter(
			(i) => isPositive(i.rating) && i.createdAt >= startOfMonth
		).length
	};
}
