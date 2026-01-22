import { getContactById, getInteractionsForContactWithNames } from '$lib/db';
import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	const id = parseInt(params.id);
	const contact = await getContactById(locals.user.id, id);

	if (!contact) {
		throw error(404, 'Contact not found');
	}

	const interactions = await getInteractionsForContactWithNames(locals.user.id, id);

	return { contact, interactions, user: locals.user };
};
