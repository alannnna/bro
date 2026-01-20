import { redirect } from '@sveltejs/kit';
import { logout } from '$lib/db';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ cookies }) => {
		const token = cookies.get('session');
		if (token) {
			logout(token);
		}
		cookies.delete('session', { path: '/' });
		throw redirect(302, '/login');
	}
};
