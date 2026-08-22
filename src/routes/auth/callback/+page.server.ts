import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
	PUBLIC_COGNITO_CLIENT_ID,
	PUBLIC_COGNITO_DOMAIN,
	PUBLIC_COGNITO_REDIRECT_URI
} from '$env/static/public';

export const load: PageServerLoad = async ({ url, cookies, fetch }) => {
	const code = url.searchParams.get('code');

	if (!code) throw redirect(303, '/');

	const res = await fetch(`${PUBLIC_COGNITO_DOMAIN}/oauth2/token`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			grant_type: 'authorization_code',
			client_id: PUBLIC_COGNITO_CLIENT_ID,
			redirect_uri: PUBLIC_COGNITO_REDIRECT_URI,
			code
		})
	});

	const tokens = await res.json();

	if (!tokens.access_token) throw redirect(303, '/');

	cookies.set('access_token', tokens.access_token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		maxAge: 60 * 60
	});

	cookies.set('id_token', tokens.id_token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		maxAge: 60 * 60
	});

	// If there's a pending repo URL, redirect to run it
	const pendingRepo = cookies.get('pending_repo');
	if (pendingRepo) {
		cookies.delete('pending_repo', { path: '/' });
		throw redirect(303, '/run?repo=' + encodeURIComponent(pendingRepo));
	}

	throw redirect(303, '/');
};
