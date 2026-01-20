import { fail, redirect } from '@sveltejs/kit';
import { loginUser } from '$lib/db';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const username = data.get('username')?.toString() || '';
		const password = data.get('password')?.toString() || '';

		if (!username || !password) {
			return fail(400, { error: 'Username and password are required', username });
		}

		const result = await loginUser(username, password);

		if (result.error) {
			return fail(400, { error: result.error, username });
		}

		cookies.set('session', result.session!.token, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			maxAge: 30 * 24 * 60 * 60 // 30 days
		});

		throw redirect(302, '/');
	}
};
