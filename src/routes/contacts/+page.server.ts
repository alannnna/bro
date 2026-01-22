import { getAllContacts } from '$lib/db';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	const contacts = await getAllContacts(locals.user.id);
	return { contacts, user: locals.user };
};
