<script lang="ts">
  import { goto } from '$app/navigation';

  let email = $state('');
  let password = $state('');
  let confirmCode = $state('');
  let step = $state<'register' | 'confirm'>('register');
  let error = $state('');
  let loading = $state(false);

  async function handleRegister() {
    error = '';
    loading = true;
    try {
      await signUp(email, password);
      step = 'confirm';
    } catch (e: any) {
      error = e.message;
    } finally {
      loading = false;
    }
  }

  async function handleConfirm() {
    error = '';
    loading = true;
    try {
      await confirmSignUp(email, confirmCode);
      goto('/login');
    } catch (e: any) {
      error = e.message;
    } finally {
      loading = false;
    }
  }
</script>

{#if step === 'register'}
  <h1>Create your cohibox account</h1>

  <input type="email" placeholder="Email" bind:value={email} />
  <input type="password" placeholder="Password" bind:value={password} />

  {#if error}<p class="error">{error}</p>{/if}

  <button onclick={handleRegister} disabled={loading}>
    {loading ? 'Creating account...' : 'Sign Up'}
  </button>

  <p>Already have an account? <a href="/login">Log in</a></p>

{:else}
  <h1>Check your email</h1>
  <p>We sent a confirmation code to <strong>{email}</strong></p>

  <input type="text" placeholder="Confirmation code" bind:value={confirmCode} />

  {#if error}<p class="error">{error}</p>{/if}

  <button onclick={handleConfirm} disabled={loading}>
    {loading ? 'Verifying...' : 'Confirm'}
  </button>
{/if}

<style>
  .error { color: red; font-size: 0.875rem; }
</style>