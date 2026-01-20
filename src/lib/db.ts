import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const DB_PATH = join(process.cwd(), 'data.json');

interface Contact {
	id: number;
	name: string;
	createdAt: string;
}

interface Interaction {
	id: number;
	contactId: number;
	rating: number;
	notes: string;
	createdAt: string;
	updatedAt: string;
}

interface Database {
	contacts: Contact[];
	interactions: Interaction[];
}

function loadDb(): Database {
	if (!existsSync(DB_PATH)) {
		return { contacts: [], interactions: [] };
	}
	return JSON.parse(readFileSync(DB_PATH, 'utf-8'));
}

function saveDb(db: Database): void {
	writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

export function searchContacts(query: string): Contact[] {
	const db = loadDb();
	const lower = query.toLowerCase();
	return db.contacts
		.filter((c) => c.name.toLowerCase().includes(lower))
		.slice(0, 10);
}

export function findOrCreateContact(name: string): Contact {
	const db = loadDb();
	const existing = db.contacts.find(
		(c) => c.name.toLowerCase() === name.toLowerCase()
	);
	if (existing) return existing;

	const contact: Contact = {
		id: db.contacts.length + 1,
		name,
		createdAt: new Date().toISOString()
	};
	db.contacts.push(contact);
	saveDb(db);
	return contact;
}

export function createInteraction(
	contactId: number,
	rating: number,
	notes: string = ''
): Interaction {
	const db = loadDb();
	const interaction: Interaction = {
		id: db.interactions.length + 1,
		contactId,
		rating,
		notes,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString()
	};
	db.interactions.push(interaction);
	saveDb(db);
	return interaction;
}

export function updateInteraction(
	id: number,
	updates: { rating?: number; notes?: string }
): Interaction | null {
	const db = loadDb();
	const interaction = db.interactions.find((i) => i.id === id);
	if (!interaction) return null;

	if (updates.rating !== undefined) interaction.rating = updates.rating;
	if (updates.notes !== undefined) interaction.notes = updates.notes;
	interaction.updatedAt = new Date().toISOString();

	saveDb(db);
	return interaction;
}

export function getAllContacts(): Contact[] {
	const db = loadDb();
	return db.contacts.sort((a, b) => a.name.localeCompare(b.name));
}

export function getContactById(id: number): Contact | null {
	const db = loadDb();
	return db.contacts.find((c) => c.id === id) || null;
}

export function getInteractionsForContact(contactId: number): Interaction[] {
	const db = loadDb();
	return db.interactions
		.filter((i) => i.contactId === contactId)
		.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
