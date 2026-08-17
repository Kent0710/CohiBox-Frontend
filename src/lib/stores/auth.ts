import { writable } from 'svelte/store';

type AuthUser = {
  email: string;
  accessToken: string;
  idToken: string;
} | null;

export const authUser = writable<AuthUser>(null);