import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { PUBLIC_COGNITO_DOMAIN } from '$env/static/public';

export const load: PageServerLoad = async ({ cookies, fetch }) => {
  const accessToken = cookies.get('access_token');
  if (!accessToken) throw redirect(303, '/login');

  const res = await fetch(`${PUBLIC_COGNITO_DOMAIN}/oauth2/userInfo`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  const user = await res.json();
  return { email: user.email };
};