import { getContactById, getInteractionsForContact } from '$lib/db';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const id = parseInt(params.id);
	const contact = getContactById(id);

	if (!contact) {
		throw error(404, 'Contact not found');
	}

	const interactions = getInteractionsForContact(id);

	return { contact, interactions };
};
