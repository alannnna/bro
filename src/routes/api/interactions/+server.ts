import { json, error } from '@sveltejs/kit';
import { findOrCreateContact, createInteraction } from '$lib/db';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const { contactNames, rating, notes } = await request.json();

	if (!contactNames || !Array.isArray(contactNames) || contactNames.length === 0) {
		return json({ error: 'At least one contact name is required' }, { status: 400 });
	}

	const contacts = await Promise.all(
		contactNames.map((name: string) => findOrCreateContact(locals.user!.id, name))
	);
	const contactIds = contacts.map((c) => c.id);
	const interaction = await createInteraction(locals.user.id, contactIds, rating || null, notes || '');

	return json({
		id: interaction.id,
		contactIds,
		contactNames: contacts.map((c) => c.name),
		rating: interaction.rating,
		notes: interaction.notes
	}, { status: 201 });
};
