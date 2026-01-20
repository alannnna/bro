import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

const DATA_DIR = process.env.DATA_DIR || process.cwd();
const DB_PATH = join(DATA_DIR, 'data.json');

// Ensure directory exists
if (!existsSync(dirname(DB_PATH))) {
	mkdirSync(dirname(DB_PATH), { recursive: true });
}

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
	name: string;
	createdAt: string;
}

interface Interaction {
	id: number;
	userId: number;
	contactId: number;
	rating: number | null;
	notes: string;
	createdAt: string;
	updatedAt: string;
}

interface Database {
	users: User[];
	sessions: Session[];
	contacts: Contact[];
	interactions: Interaction[];
}

function loadDb(): Database {
	if (!existsSync(DB_PATH)) {
		return { users: [], sessions: [], contacts: [], interactions: [] };
	}
	const data = JSON.parse(readFileSync(DB_PATH, 'utf-8'));
	// Migration: add users and sessions if missing
	if (!data.users) data.users = [];
	if (!data.sessions) data.sessions = [];
	return data;
}

function saveDb(db: Database): void {
	writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

// Auth functions
export async function registerUser(username: string, password: string): Promise<{ user?: User; error?: string }> {
	const db = loadDb();

	if (db.users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
		return { error: 'Username already exists' };
	}

	const passwordHash = await bcrypt.hash(password, 10);
	const user: User = {
		id: db.users.length + 1,
		username,
		passwordHash,
		createdAt: new Date().toISOString()
	};

	db.users.push(user);
	saveDb(db);

	return { user };
}

export async function loginUser(username: string, password: string): Promise<{ session?: Session; error?: string }> {
	const db = loadDb();

	const user = db.users.find(u => u.username.toLowerCase() === username.toLowerCase());
	if (!user) {
		return { error: 'Invalid username or password' };
	}

	const valid = await bcrypt.compare(password, user.passwordHash);
	if (!valid) {
		return { error: 'Invalid username or password' };
	}

	// Create session
	const session: Session = {
		token: randomBytes(32).toString('hex'),
		userId: user.id,
		expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
	};

	db.sessions.push(session);
	saveDb(db);

	return { session };
}

export function getSessionUser(token: string): User | null {
	const db = loadDb();

	const session = db.sessions.find(s => s.token === token);
	if (!session) return null;

	if (new Date(session.expiresAt) < new Date()) {
		// Session expired, remove it
		db.sessions = db.sessions.filter(s => s.token !== token);
		saveDb(db);
		return null;
	}

	const user = db.users.find(u => u.id === session.userId);
	return user || null;
}

export function logout(token: string): void {
	const db = loadDb();
	db.sessions = db.sessions.filter(s => s.token !== token);
	saveDb(db);
}

// Contact functions (now user-scoped)
export function searchContacts(userId: number, query: string): Contact[] {
	const db = loadDb();
	const lower = query.toLowerCase();
	return db.contacts
		.filter((c) => c.userId === userId && c.name.toLowerCase().includes(lower))
		.slice(0, 10);
}

export function findOrCreateContact(userId: number, name: string): Contact {
	const db = loadDb();
	const existing = db.contacts.find(
		(c) => c.userId === userId && c.name.toLowerCase() === name.toLowerCase()
	);
	if (existing) return existing;

	const contact: Contact = {
		id: db.contacts.length + 1,
		userId,
		name,
		createdAt: new Date().toISOString()
	};
	db.contacts.push(contact);
	saveDb(db);
	return contact;
}

export function createInteraction(
	userId: number,
	contactId: number,
	rating: number | null,
	notes: string = ''
): Interaction {
	const db = loadDb();
	const interaction: Interaction = {
		id: db.interactions.length + 1,
		userId,
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
	userId: number,
	id: number,
	updates: { rating?: number; notes?: string }
): Interaction | null {
	const db = loadDb();
	const interaction = db.interactions.find((i) => i.id === id && i.userId === userId);
	if (!interaction) return null;

	if (updates.rating !== undefined) interaction.rating = updates.rating;
	if (updates.notes !== undefined) interaction.notes = updates.notes;
	interaction.updatedAt = new Date().toISOString();

	saveDb(db);
	return interaction;
}

export interface ContactWithLastInteraction {
	id: number;
	userId: number;
	name: string;
	createdAt: string;
	lastInteractionAt: string | null;
}

export function getAllContacts(userId: number): ContactWithLastInteraction[] {
	const db = loadDb();
	return db.contacts
		.filter((c) => c.userId === userId)
		.map((contact) => {
			const interactions = db.interactions.filter((i) => i.contactId === contact.id);
			const lastInteraction = interactions.sort(
				(a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
			)[0];
			return {
				...contact,
				lastInteractionAt: lastInteraction?.createdAt || null
			};
		});
}

export function getContactById(userId: number, id: number): Contact | null {
	const db = loadDb();
	return db.contacts.find((c) => c.id === id && c.userId === userId) || null;
}

export function getInteractionsForContact(userId: number, contactId: number): Interaction[] {
	const db = loadDb();
	return db.interactions
		.filter((i) => i.contactId === contactId && i.userId === userId)
		.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export interface InteractionWithContact extends Interaction {
	contactName: string;
}

export function getAllInteractions(userId: number): InteractionWithContact[] {
	const db = loadDb();
	const userContacts = db.contacts.filter((c) => c.userId === userId);
	const contactMap = new Map(userContacts.map((c) => [c.id, c.name]));

	return db.interactions
		.filter((i) => i.userId === userId)
		.map((i) => ({
			...i,
			contactName: contactMap.get(i.contactId) || 'Unknown'
		}))
		.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export interface InteractionStats {
	positiveToday: number;
	positiveThisWeek: number;
	positiveThisMonth: number;
}

export function getInteractionStats(userId: number): InteractionStats {
	const db = loadDb();
	const now = new Date();
	const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const startOfWeek = new Date(startOfToday);
	startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
	const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

	const userInteractions = db.interactions.filter((i) => i.userId === userId);

	const isPositive = (rating: number | null) => rating === null || rating === 0 || rating >= 3;

	return {
		positiveToday: userInteractions.filter(
			(i) => isPositive(i.rating) && new Date(i.createdAt) >= startOfToday
		).length,
		positiveThisWeek: userInteractions.filter(
			(i) => isPositive(i.rating) && new Date(i.createdAt) >= startOfWeek
		).length,
		positiveThisMonth: userInteractions.filter(
			(i) => isPositive(i.rating) && new Date(i.createdAt) >= startOfMonth
		).length
	};
}
