import { getAllInteractions, getInteractionStats } from '$lib/db';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	const interactions = getAllInteractions(locals.user.id);
	const stats = getInteractionStats(locals.user.id);

	return { interactions, stats, user: locals.user };
};
