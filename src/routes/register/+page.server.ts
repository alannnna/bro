import { fail, redirect, error } from '@sveltejs/kit';
import { registerUser, loginUser } from '$lib/db';
import { REGISTRATION_SECRET } from '$env/static/private';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const secret = url.searchParams.get('secret');

	if (secret !== REGISTRATION_SECRET) {
		throw error(404, 'Not found');
	}

	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies, url }) => {
		const secret = url.searchParams.get('secret');

		if (secret !== REGISTRATION_SECRET) {
			throw error(404, 'Not found');
		}

		const data = await request.formData();
		const username = data.get('username')?.toString() || '';
		const password = data.get('password')?.toString() || '';
		const confirmPassword = data.get('confirmPassword')?.toString() || '';

		if (!username || !password) {
			return fail(400, { error: 'Username and password are required', username });
		}

		if (username.length < 3) {
			return fail(400, { error: 'Username must be at least 3 characters', username });
		}

		if (password.length < 6) {
			return fail(400, { error: 'Password must be at least 6 characters', username });
		}

		if (password !== confirmPassword) {
			return fail(400, { error: 'Passwords do not match', username });
		}

		const result = await registerUser(username, password);

		if (result.error) {
			return fail(400, { error: result.error, username });
		}

		// Auto-login after registration
		const loginResult = await loginUser(username, password);

		if (loginResult.session) {
			cookies.set('session', loginResult.session.token, {
				path: '/',
				httpOnly: true,
				sameSite: 'lax',
				maxAge: 30 * 24 * 60 * 60
			});
		}

		throw redirect(302, '/');
	}
};
