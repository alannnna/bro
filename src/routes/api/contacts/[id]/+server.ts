import { json, error } from '@sveltejs/kit';
import { updateContact } from '$lib/db';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const id = parseInt(params.id);
	const updates = await request.json();

	const contact = await updateContact(locals.user.id, id, updates);

	if (!contact) {
		return json({ error: 'Contact not found' }, { status: 404 });
	}

	return json(contact);
};
