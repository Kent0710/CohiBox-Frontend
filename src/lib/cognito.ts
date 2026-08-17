import {
  PUBLIC_COGNITO_DOMAIN,
  PUBLIC_COGNITO_CLIENT_ID,
  PUBLIC_COGNITO_REDIRECT_URI
} from '$env/static/public';

const REDIRECT_URI = PUBLIC_COGNITO_REDIRECT_URI;

export function getGitHubLoginUrl(): string {
  const params = new URLSearchParams({
    client_id: PUBLIC_COGNITO_CLIENT_ID,
    response_type: 'code',
    scope: 'openid email profile',
    redirect_uri: REDIRECT_URI,
    identity_provider: 'Google'
  });
  return `${PUBLIC_COGNITO_DOMAIN}/oauth2/authorize?${params}`;
}

export async function exchangeCodeForTokens(code: string) {
  const res = await fetch(`${PUBLIC_COGNITO_DOMAIN}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: PUBLIC_COGNITO_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      code
    })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || 'Token exchange failed');
  return data;
}

export async function getUserInfo(accessToken: string) {
  const res = await fetch(`${PUBLIC_COGNITO_DOMAIN}/oauth2/userInfo`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  return res.json();
}