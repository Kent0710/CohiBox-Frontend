// Users won't be able to access this page if they are not logged in

import type { PageServerLoad } from '../$types';
import { PUBLIC_COGNITO_DOMAIN } from '$env/static/public';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ cookies }) => {
    const accessToken = cookies.get('access_token');

    if (!accessToken) {
        redirect(302, '/')
    }

    const res = await fetch(`${PUBLIC_COGNITO_DOMAIN}/oauth2/userInfo`, {
        headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!res.ok) {
        redirect(302, '/')
    }

    const user = await res.json();

    return {
        loggedIn: true,
        email: user.email
    }
}

    