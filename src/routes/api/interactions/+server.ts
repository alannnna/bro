import { json, error } from '@sveltejs/kit';
import { findOrCreateContact, createInteraction } from '$lib/db';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const { contactName, rating, notes } = await request.json();

	if (!contactName || !rating) {
		return json({ error: 'Contact name and rating are required' }, { status: 400 });
	}

	const contact = findOrCreateContact(locals.user.id, contactName);
	const interaction = createInteraction(locals.user.id, contact.id, rating, notes || '');

	return json({
		id: interaction.id,
		contactId: contact.id,
		contactName: contact.name,
		rating: interaction.rating,
		notes: interaction.notes
	}, { status: 201 });
};
