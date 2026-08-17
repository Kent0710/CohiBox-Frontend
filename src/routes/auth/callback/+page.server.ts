import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
	PUBLIC_COGNITO_CLIENT_ID,
	PUBLIC_COGNITO_DOMAIN,
	PUBLIC_COGNITO_REDIRECT_URI
} from '$env/static/public';

export const load: PageServerLoad = async ({ url, cookies, fetch }) => {
	const code = url.searchParams.get('code');
	console.log('SERVER CODE:', code);

	if (!code) throw redirect(303, '/login');

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
	console.log('SERVER TOKENS:', tokens);

	if (!tokens.access_token) throw redirect(303, '/login');

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

	throw redirect(303, '/');
};
