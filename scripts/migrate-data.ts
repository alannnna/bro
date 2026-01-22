import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import postgres from 'postgres';

const DATA_DIR = process.env.DATA_DIR || process.cwd();
const DB_PATH = join(DATA_DIR, 'data.json');

interface OldUser {
	id: number;
	username: string;
	passwordHash: string;
	createdAt: string;
}

interface OldSession {
	token: string;
	userId: number;
	expiresAt: string;
}

interface OldContact {
	id: number;
	userId: number;
	name: string;
	createdAt: string;
}

interface OldInteraction {
	id: number;
	userId: number;
	contactId?: number;
	contactIds?: number[];
	rating: number | null;
	notes: string;
	createdAt: string;
	updatedAt: string;
}

interface OldDatabase {
	users: OldUser[];
	sessions: OldSession[];
	contacts: OldContact[];
	interactions: OldInteraction[];
}

async function migrate() {
	if (!process.env.DATABASE_URL) {
		console.error('DATABASE_URL environment variable is required');
		process.exit(1);
	}

	if (!existsSync(DB_PATH)) {
		console.log('No data.json found at', DB_PATH);
		console.log('Nothing to migrate.');
		process.exit(0);
	}

	console.log('Reading data from', DB_PATH);
	const data: OldDatabase = JSON.parse(readFileSync(DB_PATH, 'utf-8'));

	// Apply migrations for old format
	if (!data.users) data.users = [];
	if (!data.sessions) data.sessions = [];
	if (!data.contacts) data.contacts = [];
	if (!data.interactions) data.interactions = [];

	// Migrate contactId to contactIds
	for (const interaction of data.interactions) {
		if ('contactId' in interaction && !('contactIds' in interaction)) {
			interaction.contactIds = [interaction.contactId!];
			delete interaction.contactId;
		}
	}

	const sql = postgres(process.env.DATABASE_URL);

	console.log('Starting migration...');

	// Migrate users
	if (data.users.length > 0) {
		console.log(`Migrating ${data.users.length} users...`);
		for (const user of data.users) {
			if (!user.id || !user.username || !user.passwordHash) {
				console.log(`  Skipping user ${user.id} - missing required fields`);
				continue;
			}
			await sql`
				INSERT INTO users (id, username, password_hash, created_at)
				VALUES (${user.id}, ${user.username}, ${user.passwordHash}, ${user.createdAt || new Date().toISOString()})
				ON CONFLICT (id) DO NOTHING
			`;
		}
		const validUsers = data.users.filter(u => u.id);
		if (validUsers.length > 0) {
			const maxUserId = Math.max(...validUsers.map(u => u.id));
			await sql`SELECT setval('users_id_seq', ${maxUserId}, true)`;
		}
	}

	// Migrate sessions
	if (data.sessions.length > 0) {
		console.log(`Migrating ${data.sessions.length} sessions...`);
		for (const session of data.sessions) {
			if (!session.token || !session.userId || !session.expiresAt) {
				console.log(`  Skipping session - missing required fields`);
				continue;
			}
			await sql`
				INSERT INTO sessions (token, user_id, expires_at)
				VALUES (${session.token}, ${session.userId}, ${session.expiresAt})
				ON CONFLICT (token) DO NOTHING
			`;
		}
	}

	// Migrate contacts
	if (data.contacts.length > 0) {
		console.log(`Migrating ${data.contacts.length} contacts...`);
		for (const contact of data.contacts) {
			if (!contact.userId) {
				console.log(`  Skipping contact ${contact.id} (${contact.name}) - no userId`);
				continue;
			}
			await sql`
				INSERT INTO contacts (id, user_id, name, created_at)
				VALUES (${contact.id}, ${contact.userId}, ${contact.name}, ${contact.createdAt})
				ON CONFLICT (id) DO NOTHING
			`;
		}
		const maxContactId = Math.max(...data.contacts.map(c => c.id));
		await sql`SELECT setval('contacts_id_seq', ${maxContactId}, true)`;
	}

	// Migrate interactions
	if (data.interactions.length > 0) {
		console.log(`Migrating ${data.interactions.length} interactions...`);
		for (const interaction of data.interactions) {
			if (!interaction.id || !interaction.userId) {
				console.log(`  Skipping interaction ${interaction.id} - missing required fields`);
				continue;
			}
			const now = new Date().toISOString();
			await sql`
				INSERT INTO interactions (id, user_id, rating, notes, created_at, updated_at)
				VALUES (${interaction.id}, ${interaction.userId}, ${interaction.rating ?? null}, ${interaction.notes || ''}, ${interaction.createdAt || now}, ${interaction.updatedAt || now})
				ON CONFLICT (id) DO NOTHING
			`;

			// Insert junction table records
			const contactIds = interaction.contactIds || [];
			for (const contactId of contactIds) {
				if (!contactId) continue;
				await sql`
					INSERT INTO interaction_contacts (interaction_id, contact_id)
					VALUES (${interaction.id}, ${contactId})
					ON CONFLICT DO NOTHING
				`;
			}
		}
		const validInteractions = data.interactions.filter(i => i.id);
		if (validInteractions.length > 0) {
			const maxInteractionId = Math.max(...validInteractions.map(i => i.id));
			await sql`SELECT setval('interactions_id_seq', ${maxInteractionId}, true)`;
		}
	}

	console.log('Migration complete!');
	console.log(`  Users: ${data.users.length}`);
	console.log(`  Sessions: ${data.sessions.length}`);
	console.log(`  Contacts: ${data.contacts.length}`);
	console.log(`  Interactions: ${data.interactions.length}`);

	await sql.end();
}

migrate().catch((err) => {
	console.error('Migration failed:', err);
	process.exit(1);
});
