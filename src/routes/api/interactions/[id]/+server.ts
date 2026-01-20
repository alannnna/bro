import { json } from '@sveltejs/kit';
import { updateInteraction } from '$lib/db';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ params, request }) => {
	const id = parseInt(params.id);
	const updates = await request.json();

	const interaction = updateInteraction(id, updates);

	if (!interaction) {
		return json({ error: 'Interaction not found' }, { status: 404 });
	}

	return json(interaction);
};
