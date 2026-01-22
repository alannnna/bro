import { json, error } from '@sveltejs/kit';
import { updateInteraction, deleteInteraction } from '$lib/db';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const id = parseInt(params.id);
	const updates = await request.json();

	const interaction = await updateInteraction(locals.user.id, id, updates);

	if (!interaction) {
		return json({ error: 'Interaction not found' }, { status: 404 });
	}

	return json(interaction);
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const id = parseInt(params.id);
	const deleted = await deleteInteraction(locals.user.id, id);

	if (!deleted) {
		return json({ error: 'Interaction not found' }, { status: 404 });
	}

	return json({ success: true });
};
