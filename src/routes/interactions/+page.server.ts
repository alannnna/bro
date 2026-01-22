import { getAllInteractions, getInteractionStats } from '$lib/db';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	const interactions = await getAllInteractions(locals.user.id);
	const stats = await getInteractionStats(locals.user.id);

	return { interactions, stats, user: locals.user };
};
