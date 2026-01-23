import { error } from '@sveltejs/kit';
import { getAllContacts, getAllInteractions } from '$lib/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const contacts = await getAllContacts(locals.user.id);
	const interactions = await getAllInteractions(locals.user.id);

	const exportData = {
		exportedAt: new Date().toISOString(),
		user: {
			username: locals.user.username
		},
		contacts: contacts.map(c => ({
			name: c.name,
			firstName: c.firstName,
			lastName: c.lastName,
			location: c.location,
			notes: c.notes,
			createdAt: c.createdAt,
			lastInteractionAt: c.lastInteractionAt
		})),
		interactions: interactions.map(i => ({
			contactNames: i.contactNames,
			notes: i.notes,
			rating: i.rating,
			createdAt: i.createdAt
		}))
	};

	const filename = `rolo-export-${new Date().toISOString().split('T')[0]}.json`;

	return new Response(JSON.stringify(exportData, null, 2), {
		headers: {
			'Content-Type': 'application/json',
			'Content-Disposition': `attachment; filename="${filename}"`
		}
	});
};
