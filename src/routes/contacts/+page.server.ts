import { getAllContacts } from '$lib/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const contacts = getAllContacts();
	return { contacts };
};
