import { redirect, type Handle } from '@sveltejs/kit';
import { getSessionUser } from '$lib/db';

export const handle: Handle = async ({ event, resolve }) => {
	const sessionToken = event.cookies.get('session');

	if (sessionToken) {
		const user = await getSessionUser(sessionToken);
		if (user) {
			event.locals.user = { id: user.id, username: user.username };
		}
	}

	// Protected routes
	const protectedPaths = ['/', '/contacts'];
	const isProtected = protectedPaths.some(
		(path) => event.url.pathname === path || event.url.pathname.startsWith('/contacts/')
	);

	if (isProtected && !event.locals.user) {
		throw redirect(302, '/login');
	}

	// Redirect logged-in users away from login page
	if (event.url.pathname === '/login' && event.locals.user) {
		throw redirect(302, '/');
	}

	return resolve(event);
};
