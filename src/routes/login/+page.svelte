<script lang="ts">
  import { getGoogleLoginUrl } from '$lib/cognito';
</script>

<h1>Log in to cohibox</h1>
<a href={getGoogleLoginUrl()}>
  <button>Continue with Google</button>
</a>