import { json, error } from '@sveltejs/kit';
import { searchContacts } from '$lib/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const query = url.searchParams.get('q') || '';
	const contacts = searchContacts(locals.user.id, query);
	return json(contacts);
};
