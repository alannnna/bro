import { json } from '@sveltejs/kit';
import { searchContacts } from '$lib/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const query = url.searchParams.get('q') || '';
	const contacts = searchContacts(query);
	return json(contacts);
};
