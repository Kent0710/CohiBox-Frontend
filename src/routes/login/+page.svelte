<script lang="ts">
  import { getGitHubLoginUrl } from '$lib/cognito';
</script>

<h1>Log in to cohibox</h1>
<a href={getGitHubLoginUrl()}>
  <button>Continue with Google</button>
</a>