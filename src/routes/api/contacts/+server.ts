import { json, error } from '@sveltejs/kit';
import { searchContacts, createContact } from '$lib/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const query = url.searchParams.get('q') || '';
	const contacts = await searchContacts(locals.user.id, query);
	return json(contacts);
};

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const data = await request.json();

	if (!data.firstName) {
		return json({ error: 'First name is required' }, { status: 400 });
	}

	const contact = await createContact(locals.user.id, {
		firstName: data.firstName,
		lastName: data.lastName || '',
		location: data.location || '',
		notes: data.notes || ''
	});

	return json(contact, { status: 201 });
};
