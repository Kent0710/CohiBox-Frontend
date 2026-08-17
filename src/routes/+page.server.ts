import type { PageServerLoad } from './$types';
import { PUBLIC_COGNITO_DOMAIN } from '$env/static/public';

export const load: PageServerLoad = async ({ cookies, fetch }) => {
	const accessToken = cookies.get('access_token');

	if (!accessToken) {
		return {
			loggedIn: false,
			email: null
		};
	}

	const res = await fetch(`${PUBLIC_COGNITO_DOMAIN}/oauth2/userInfo`, {
		headers: {
			Authorization: `Bearer ${accessToken}`
		}
	});

	if (!res.ok) {
		return {
			loggedIn: false,
			email: null
		};
	}

	const user = await res.json();

	return {
		loggedIn: true,
		email: user.email
	};
};