import { json } from '@sveltejs/kit';
import { findOrCreateContact, createInteraction } from '$lib/db';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	const { contactName, rating, notes } = await request.json();

	if (!contactName || !rating) {
		return json({ error: 'Contact name and rating are required' }, { status: 400 });
	}

	const contact = findOrCreateContact(contactName);
	const interaction = createInteraction(contact.id, rating, notes || '');

	return json({
		id: interaction.id,
		contactId: contact.id,
		contactName: contact.name,
		rating: interaction.rating,
		notes: interaction.notes
	}, { status: 201 });
};
