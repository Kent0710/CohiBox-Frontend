<script lang="ts">
	import { getGoogleLoginUrl } from '$lib/cognito';

	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import Scene from '$lib/components/Scene.svelte';
	import GradientBackground from '$lib/components/GradientBackground.svelte';

	let { data }: { data: PageData } = $props();

	let repoUrl = $state('');
	let error = $state('');

	async function handleSignOut() {
		const response = await fetch('/auth/signout', {
			method: 'POST'
		});

		if (response.ok) {
			await goto('/', { invalidateAll: true });
		}
	}

	function handleRun() {
		error = '';

		if (!repoUrl.trim()) {
			error = 'Paste a GitHub repository URL to continue.';
			return;
		}

		if (!repoUrl.includes('github.com')) {
			error = "That doesn't look like a GitHub URL.";
			return;
		}

		goto('/run?repo=' + encodeURIComponent(repoUrl.trim()));
	}
</script>

<svelte:head>
	<title>CohiBox — Run Java from GitHub</title>
	<meta name="description" content="Run any Java application directly from a GitHub repository." />
</svelte:head>

<div class="page">
	<!-- Animated gradient background -->
	<GradientBackground />

	<!-- ========================================================= -->
	<!-- NAV -->
	<!-- ========================================================= -->

	<nav>
		<div class="nav-glass">
			<span class="logo">CohiBox</span>

			<div class="nav-right">
				<span class="user">{data.email}</span>

				{#if data.email}
					<button class="signout" onclick={handleSignOut}> Sign out </button>
				{:else}
					<a href={getGoogleLoginUrl()}>
						<button>Login with Google</button>
					</a>
				{/if}
			</div>
		</div>
	</nav>

	<!-- ========================================================= -->
	<!-- HERO -->
	<!-- ========================================================= -->

	<section class="hero">
		<!-- ABSOLUTE SCENE — KEPT EXACTLY AS REQUESTED -->
		<div class="scene-wrap">
			<Scene />
		</div>

		<!-- Subtle dark vignette so text remains readable -->
		<div class="hero-vignette"></div>

		<!-- Glass content -->
		<div class="hero-content">
			<!-- Top glass reflection -->
			<div class="glass-highlight"></div>

			<!-- Heading -->
			<h1>
				Run any Java app
				<br />
				<span>from a repo link.</span>
			</h1>

			<!-- Description -->
			<p class="sub">
				Paste a GitHub repository URL. CohiBox pulls the code, compiles it, and runs the console
				output —
				<span>no setup, no cloning.</span>
			</p>

			<!-- ===================================================== -->
			<!-- GLASS INPUT -->
			<!-- ===================================================== -->

			<div class="input-container">
				<!-- Input glass -->
				<div class="input-row">
					<!-- Inner highlight -->
					<div class="input-highlight"></div>

					<input
						type="url"
						placeholder="https://github.com/username/repo"
						bind:value={repoUrl}
						onkeydown={(e) => e.key === 'Enter' && handleRun()}
					/>

					<button class="run-btn" onclick={handleRun}>
						<span>Run</span>

						<svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
							<path
								d="M3 8h9M8.5 4.5L12 8l-3.5 3.5"
								stroke="currentColor"
								stroke-width="1.4"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</button>
				</div>

				{#if error}
					<p class="error">
						{error}
					</p>
				{/if}
			</div>

			<!-- Small status -->
			<div class="trust">
				<span class="trust-dot"></span>
				Not associated with the Java Programming Language, just a tool.
			</div>
		</div>
	</section>
</div>

<style>
	:global(html) {
		background: #050510;
	}

	:global(body) {
		margin: 0;
		background: #050510;
		color: #e8e8f0;
		font-family:
			'Manrope',
			system-ui,
			-apple-system,
			BlinkMacSystemFont,
			sans-serif;
	}

	:global(button),
	:global(input) {
		font-family: inherit;
	}

	:global(*) {
		box-sizing: border-box;
	}

	/* ========================================================= */
	/* PAGE */
	/* ========================================================= */

	.page {
		position: relative;
		min-height: 100vh;
		overflow-x: hidden;
		background: #050510;
	}

	/* ========================================================= */
	/* NAV */
	/* ========================================================= */

	nav {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;

		z-index: 50;

		padding: 1rem 1.25rem;
	}

	.nav-glass {
		position: relative;

		display: flex;
		align-items: center;
		justify-content: space-between;

		width: 100%;
		max-width: 1200px;

		margin: 0 auto;

		padding: 1.5rem 0.85rem 0.75rem 1rem;
	}

	/*
    Tiny glass reflection across the top.
  */
	.nav-glass::before {
		content: '';

		position: absolute;
		top: 0;
		left: 8%;
		right: 8%;

		pointer-events: none;
	}

	.logo {
		font-size: 1rem;
		font-weight: 600;
		letter-spacing: 0.04em;
		color: rgba(205, 205, 245, 0.9);
	}

	.nav-right {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.user {
		max-width: 220px;

		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;

		font-size: 0.75rem;
		color: rgba(232, 232, 240, 0.4);
	}

	.signout {
		padding: 0.4rem 0.8rem;

		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 8px;

		background: rgba(255, 255, 255, 0.025);

		color: rgba(232, 232, 240, 0.55);

		font-size: 0.75rem;

		cursor: pointer;

		transition:
			background 0.2s ease,
			border-color 0.2s ease,
			color 0.2s ease,
			transform 0.2s ease;
	}

	.signout:hover {
		border-color: rgba(168, 168, 232, 0.22);
		background: rgba(168, 168, 232, 0.07);
		color: rgba(232, 232, 240, 0.85);
	}

	.signout:active {
		transform: scale(0.97);
	}

	/* ========================================================= */
	/* HERO */
	/* ========================================================= */

	.hero {
		position: relative;

		height: 100vh;
		min-height: 650px;

		display: flex;
		align-items: center;
		justify-content: center;

		overflow: hidden;
	}

	/*
    YOUR 3D MODEL REMAINS ABSOLUTE.

    This fills the entire hero and sits behind
    the glass content.
  */
	.scene-wrap {
		position: absolute;

		inset: 0;

		z-index: 0;

		pointer-events: auto;
	}

	/*
    Subtle vignette.

    This doesn't block the model.
    It simply makes the center content easier to read.
  */
	.hero-vignette {
		position: absolute;

		inset: 0;

		z-index: 1;

		pointer-events: none;

		background: radial-gradient(
			ellipse at center,
			transparent 20%,
			rgba(5, 5, 16, 0.08) 55%,
			rgba(5, 5, 16, 0.55) 100%
		);
	}

	/* ========================================================= */
	/* HERO GLASS CONTENT */
	/* ========================================================= */

	.hero-content {
		position: relative;

		padding: 2.75rem 2.5rem 2.5rem;

		text-align: center;
	}

	/*
    Large soft reflection across the glass.
  */
	.glass-highlight {
		position: absolute;

		top: 0;
		left: 10%;
		right: 10%;

		height: 1px;

		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.22), transparent);

		pointer-events: none;
	}

	/*
    Very subtle glow around the glass edge.
  */
	.hero-content::before {
		content: '';

		position: absolute;

		inset: -1px;

		z-index: -1;

		border-radius: inherit;

		pointer-events: none;
	}
	/* ========================================================= */
	/* HEADING */
	/* ========================================================= */

	h1 {
		font-family:
			'Manrope',
			-apple-system,
			BlinkMacSystemFont,
			sans-serif;

		font-size: clamp(5rem, 6vw, 4.5rem);
		font-weight: 700;
		line-height: 1.05;
		letter-spacing: -0.045em;
		color: #f2f2ff;
		text-shadow:
			0 4px 12px rgba(0, 0, 0, 0.55),
			0 8px 30px rgba(0, 0, 0, 0.35);
	}

	/* ========================================================= */
	/* DESCRIPTION */
	/* ========================================================= */

	.sub {
		max-width: 540px;

		margin: 1.35rem auto 0;

		font-size: 0.95rem;
		line-height: 1.7;

		color: rgba(232, 232, 240, 0.68);

		text-shadow:
			0 4px 12px rgba(0, 0, 0, 0.55),
			0 8px 30px rgba(0, 0, 0, 0.35);
	}

	.sub span {
		color: rgba(232, 232, 240, 0.68);
	}

	/* ========================================================= */
	/* INPUT */
	/* ========================================================= */

	.input-container {
		width: 100%;

		margin-top: 2rem;
	}

	.input-row {
		position: relative;

		display: flex;
		align-items: stretch;

		width: 100%;

		min-height: 58px;

		overflow: hidden;

		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 500px;

		background: linear-gradient(180deg, rgba(5, 5, 16, 0.38), rgba(5, 5, 16, 0.25));

		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);

		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.055),
			0 10px 40px rgba(0, 0, 0, 0.12);

		transition:
			border-color 0.25s ease,
			box-shadow 0.25s ease,
			background 0.25s ease;
	}

	.input-row:focus-within {
		border-color: rgba(168, 168, 232, 0.32);

		background: linear-gradient(180deg, rgba(12, 12, 32, 0.48), rgba(5, 5, 16, 0.3));

		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.07),
			0 10px 50px rgba(110, 110, 220, 0.08);
	}

	.input-highlight {
		position: absolute;

		top: 0;
		left: 10%;
		right: 10%;

		height: 1px;

		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.12), transparent);

		pointer-events: none;
	}

	.input-row input {
		min-width: 0;

		flex: 1;

		padding: 0 1.1rem;

		border: none;
		outline: none;

		background: transparent;

		color: rgba(240, 240, 250, 0.9);

		font-family: 'JetBrains Mono', 'Fira Mono', ui-monospace, SFMono-Regular, Menlo, monospace;

		font-size: 0.78rem;
	}

	.input-row input::placeholder {
		color: rgba(232, 232, 240, 0.22);
	}

	/* ========================================================= */
	/* RUN BUTTON */
	/* ========================================================= */

	.run-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.35rem;

		min-width: 82px;

		margin: 5px;

		border: 1px solid rgba(255, 255, 255, 0.18);
		border-radius: 500px;

		background: linear-gradient(180deg, rgba(192, 192, 248, 1), rgba(168, 168, 232, 1));

		color: #050510;

		font-size: 0.8rem;
		font-weight: 650;

		letter-spacing: 0.02em;

		cursor: pointer;

		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.45),
			inset 0 -1px 0 rgba(80, 80, 140, 0.15),
			0 4px 15px rgba(168, 168, 232, 0.15);

		transition:
			transform 0.18s ease,
			background 0.18s ease,
			box-shadow 0.18s ease;
	}

	.run-btn svg {
		width: 15px;
		height: 15px;
	}

	.run-btn:hover {
		background: linear-gradient(180deg, rgba(208, 208, 255, 1), rgba(184, 184, 242, 1));

		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.55),
			0 5px 22px rgba(168, 168, 232, 0.24);
	}

	.run-btn:active {
		transform: scale(0.97);
	}

	/* ========================================================= */
	/* ERROR */
	/* ========================================================= */

	.error {
		margin: 0.65rem 0 0;

		padding-left: 0.25rem;

		font-size: 0.75rem;

		color: rgba(248, 128, 128, 0.85);

		text-align: left;
	}

	/* ========================================================= */
	/* TRUST */
	/* ========================================================= */

	.trust {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.45rem;

		margin-top: 1rem;

		font-size: 0.65rem;

		color: rgba(232, 232, 240, 0.25);
	}

	.trust-dot {
		width: 5px;
		height: 5px;

		border-radius: 50%;

		background: rgba(74, 222, 128, 0.65);

		box-shadow: 0 0 7px rgba(74, 222, 128, 0.35);
	}

	/* ========================================================= */
	/* MOBILE */
	/* ========================================================= */

	@media (max-width: 700px) {
		nav {
			padding: 0.75rem;
		}

		.user {
			display: none;
		}

		.hero {
			min-height: 700px;
		}

		.hero-content {
			width: calc(100% - 1.5rem);

			padding: 2rem 1.25rem;

			border-radius: 24px;
		}

		h1 {
			font-size: clamp(2.25rem, 11vw, 3.2rem);
		}

		.sub {
			font-size: 0.85rem;
			line-height: 1.65;
		}

		.input-row {
			min-height: 54px;
		}

		.input-row input {
			padding: 0 0.85rem;

			font-size: 0.7rem;
		}

		.run-btn {
			min-width: 68px;
		}
	}

	/* ========================================================= */
	/* REDUCED MOTION */
	/* ========================================================= */

	@media (prefers-reduced-motion: reduce) {
		.signout,
		.run-btn,
		.input-row {
			transition: none;
		}
	}
</style>
