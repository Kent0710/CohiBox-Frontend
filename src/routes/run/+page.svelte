<script lang="ts">
	import { PUBLIC_BACKEND_WS } from '$env/static/public';

	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import type { PageData } from '../$types';

	let { data }: { data: PageData } = $props();

	// --- State ---
	let repoUrl = $state($page.url.searchParams.get('repo') ?? '');
	let status = $state<'idle' | 'starting' | 'running' | 'stopped' | 'error'>('idle');
	let statusMessage = $state('Ready.');
	let terminalOutput = $state('');
	let inputValue = $state('');
	let inputDisabled = $state(true);
	let socket: WebSocket | null = null;

	// --- Refs ---
	let terminalEl: HTMLDivElement;
	let terminalInputEl: HTMLInputElement;

	// --- Recents ---
	let recents = $state<string[]>(
		typeof localStorage !== 'undefined'
			? JSON.parse(localStorage.getItem('cohibox-recents') ?? '[]')
			: []
	);

	function addRecent(url: string) {
		recents = [url, ...recents.filter((r) => r !== url)].slice(0, 8);
		localStorage.setItem('cohibox-recents', JSON.stringify(recents));
	}

	function repoName(url: string) {
		try {
			const parts = new URL(url).pathname.split('/').filter(Boolean);
			return parts.slice(0, 2).join('/');
		} catch {
			return url;
		}
	}

	// --- Terminal helpers ---
	function appendTerminal(text: string) {
		terminalOutput += text;
		setTimeout(() => {
			if (terminalEl) terminalEl.scrollTop = terminalEl.scrollHeight;
		}, 0);
	}

	function clearTerminal() {
		terminalOutput = '';
	}

	// --- WebSocket ---
	function connectWebSocket(): Promise<void> {
		return new Promise((resolve, reject) => {
			socket = new WebSocket(`${PUBLIC_BACKEND_WS}/ws`);

			socket.addEventListener('open', () => resolve());
			socket.addEventListener('error', (e) => reject(e));

			socket.addEventListener('message', (event) => {
				const msg = JSON.parse(event.data);

				if (msg.type === 'status') {
					statusMessage = msg.message;
					status = 'running';
				}

				if (msg.type === 'output') {
					appendTerminal(msg.data);
				}

				if (msg.type === 'exit') {
					statusMessage = `Exited with code ${msg.code}`;
					status = 'stopped';
					inputDisabled = true;
				}

				if (msg.type === 'error') {
					statusMessage = 'Execution error.';
					status = 'error';
					appendTerminal(`\n[Error] ${msg.message}`);
					inputDisabled = true;
				}
			});

			socket.addEventListener('close', () => {
				inputDisabled = true;
			});
		});
	}

	// --- Run ---
	async function handleRun() {
		if (!repoUrl.trim()) return;
		if (!repoUrl.includes('github.com')) {
			statusMessage = "That doesn't look like a GitHub URL.";
			status = 'error';
			return;
		}

		clearTerminal();
		status = 'starting';
		statusMessage = 'Connecting...';
		inputDisabled = true;

		try {
			if (socket?.readyState === WebSocket.OPEN) socket.close();
			await connectWebSocket();

			socket!.send(JSON.stringify({ type: 'start', githubUrl: repoUrl.trim() }));

			addRecent(repoUrl.trim());
			inputDisabled = false;
			terminalInputEl?.focus();
		} catch {
			status = 'error';
			statusMessage = 'Could not connect to CohiBox.';
			appendTerminal('\n[Error] Could not connect to server.');
		}
	}

	// --- Stop ---
	function handleStop() {
		if (socket?.readyState !== WebSocket.OPEN) return;
		status = 'stopped';
		statusMessage = 'Stopping...';
		socket.send(JSON.stringify({ type: 'stop' }));
		inputDisabled = true;
	}

	// --- Input ---
	function handleTerminalInput(e: KeyboardEvent) {
		if (e.key !== 'Enter') return;
		if (socket?.readyState !== WebSocket.OPEN) return;

		const input = inputValue;
		appendTerminal(input + '\n');
		socket.send(JSON.stringify({ type: 'input', input: input + '\n' }));
		inputValue = '';
	}

	// Auto-run if repo passed via query param
	onMount(() => {
		if (repoUrl) handleRun();
	});

	const statusColors: Record<string, string> = {
		idle: '#888',
		starting: '#eab308',
		running: '#4ade80',
		stopped: '#a8a8e8',
		error: '#f87171'
	};

	const statusLabels: Record<string, string> = {
		idle: 'Ready',
		starting: 'Starting',
		running: 'Running',
		stopped: 'Stopped',
		error: 'Error'
	};
</script>

<div class="layout">
	<!-- ============================================================ -->
	<!-- SIDEBAR -->
	<!-- ============================================================ -->
	<aside class="sidebar">
		<a href="/" class="sidebar-logo">CohiBox</a>

		<div class="sidebar-section">
			<p class="sidebar-label">Recents</p>

			{#if recents.length === 0}
				<p class="sidebar-empty">No runs yet.</p>
			{:else}
				<ul class="recent-list">
					{#each recents as r}
						<li>
							<button
								class="recent-item"
								onclick={() => {
									repoUrl = r;
									handleRun();
								}}
							>
								<svg viewBox="0 0 24 24" aria-hidden="true" class="gh-icon">
									<path
										d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
									/>
								</svg>
								<span class="recent-name">{repoName(r)}</span>
							</button>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</aside>

	<!-- ============================================================ -->
	<!-- MAIN -->
	<!-- ============================================================ -->
	<main class="main">
		<!-- Top bar -->
		<div class="topbar">
			<div class="url-row">
				<input
					class="url-input"
					type="url"
					placeholder="https://github.com/username/repo"
					bind:value={repoUrl}
					onkeydown={(e) => e.key === 'Enter' && handleRun()}
					disabled={status === 'starting' || status === 'running'}
				/>

				{#if status === 'running' || status === 'starting'}
					<button class="stop-btn" onclick={handleStop}>
						<svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
							<rect x="4" y="4" width="8" height="8" rx="1.5" fill="currentColor" />
						</svg>
						Stop
					</button>
				{:else}
					<button class="run-btn" onclick={handleRun} disabled={!repoUrl.trim()}>
						<svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
							<path d="M5 3.5l8 4.5-8 4.5V3.5z" fill="currentColor" />
						</svg>
						Run
					</button>
				{/if}
			</div>

			<div class="status-row">
				<span
					class="status-dot"
					style="background: {statusColors[status]}; box-shadow: 0 0 6px {statusColors[status]}55;"
				></span>
				<span class="status-label" style="color: {statusColors[status]}">
					{statusLabels[status]}
				</span>
				<span class="status-message">{statusMessage}</span>
			</div>
		</div>

		<!-- ============================================================ -->
		<!-- TERMINAL WINDOW -->
		<!-- ============================================================ -->
		<div class="terminal-window">
			<!-- macOS-style traffic lights -->
			<div class="terminal-titlebar">
				<div class="traffic-lights">
					<span class="tl tl-red"></span>
					<span class="tl tl-yellow"></span>
					<span class="tl tl-green"></span>
				</div>
				<span class="terminal-title">
					{repoUrl ? repoName(repoUrl) : 'cohibox — terminal'}
				</span>
				<button class="clear-btn" onclick={clearTerminal} title="Clear terminal"> Clear </button>
			</div>

			<!-- Output -->
			<div class="terminal-body" bind:this={terminalEl}>
				{#if terminalOutput === ''}
					<span class="terminal-placeholder">
						{status === 'idle' ? 'Paste a GitHub repo URL and press Run.' : 'Starting...'}
					</span>
				{:else}
					<pre class="terminal-pre">{terminalOutput}</pre>
				{/if}
			</div>

			<!-- Input row -->
			<div class="terminal-input-row">
				<span class="prompt">❯</span>
				<input
					bind:this={terminalInputEl}
					class="terminal-input"
					type="text"
					placeholder={inputDisabled ? 'Waiting for process...' : 'Send input to program...'}
					bind:value={inputValue}
					onkeydown={handleTerminalInput}
					disabled={inputDisabled}
					autocomplete="off"
					spellcheck="false"
				/>
			</div>
		</div>
	</main>
</div>

<style>
	:global(html, body) {
		margin: 0;
		padding: 0;
		height: 100%;
		background: #0a0a12;
		color: #e8e8f0;
		font-family:
			system-ui,
			-apple-system,
			BlinkMacSystemFont,
			sans-serif;
	}

	:global(*) {
		box-sizing: border-box;
	}

	/* ============================================================ */
	/* LAYOUT */
	/* ============================================================ */

	.layout {
		display: flex;
		height: 100dvh;
		overflow: hidden;
	}

	/* ============================================================ */
	/* SIDEBAR */
	/* ============================================================ */

	.sidebar {
		width: 220px;
		min-width: 220px;
		height: 100%;
		background: #0d0d18;
		border-right: 0.5px solid rgba(255, 255, 255, 0.06);
		display: flex;
		flex-direction: column;
		padding: 1.25rem 0.85rem;
		gap: 1.5rem;
		overflow-y: auto;
	}

	.sidebar-logo {
		font-size: 0.9rem;
		font-weight: 650;
		letter-spacing: 0.04em;
		color: rgba(168, 168, 232, 0.9);
		text-decoration: none;
		padding: 0 0.4rem;
	}

	.sidebar-section {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.sidebar-label {
		font-size: 0.65rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: rgba(232, 232, 240, 0.28);
		margin: 0 0 0.25rem;
		padding: 0 0.4rem;
	}

	.sidebar-empty {
		font-size: 0.78rem;
		color: rgba(232, 232, 240, 0.22);
		margin: 0;
		padding: 0 0.4rem;
	}

	.recent-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.recent-item {
		display: flex;
		align-items: center;
		gap: 0.55rem;
		width: 100%;
		padding: 0.45rem 0.55rem;
		border-radius: 7px;
		border: none;
		background: none;
		color: rgba(232, 232, 240, 0.55);
		font-size: 0.78rem;
		cursor: pointer;
		text-align: left;
		transition:
			background 0.15s,
			color 0.15s;
	}

	.recent-item:hover {
		background: rgba(168, 168, 232, 0.08);
		color: rgba(232, 232, 240, 0.9);
	}

	.gh-icon {
		width: 13px;
		height: 13px;
		fill: currentColor;
		flex-shrink: 0;
		opacity: 0.6;
	}

	.recent-name {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* ============================================================ */
	/* MAIN */
	/* ============================================================ */

	.main {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		padding: 1.5rem;
		gap: 1rem;
		overflow: hidden;
	}

	/* ============================================================ */
	/* TOPBAR */
	/* ============================================================ */

	.topbar {
		display: flex;
		flex-direction: column;
		gap: 0.55rem;
	}

	.url-row {
		display: flex;
		gap: 0.6rem;
		align-items: center;
	}

	.url-input {
		flex: 1;
		min-width: 0;
		height: 40px;
		padding: 0 1rem;
		border-radius: 9px;
		border: 0.5px solid rgba(255, 255, 255, 0.1);
		background: rgba(255, 255, 255, 0.04);
		color: rgba(240, 240, 250, 0.9);
		font-family: 'JetBrains Mono', 'Fira Mono', ui-monospace, monospace;
		font-size: 0.8rem;
		outline: none;
		transition: border-color 0.2s;
	}

	.url-input::placeholder {
		color: rgba(232, 232, 240, 0.2);
	}

	.url-input:focus {
		border-color: rgba(168, 168, 232, 0.35);
	}

	.url-input:disabled {
		opacity: 0.5;
	}

	.run-btn,
	.stop-btn {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		height: 40px;
		padding: 0 1.1rem;
		border-radius: 9px;
		border: none;
		font-size: 0.82rem;
		font-weight: 600;
		cursor: pointer;
		transition:
			opacity 0.15s,
			transform 0.15s;
		white-space: nowrap;
	}

	.run-btn svg,
	.stop-btn svg {
		width: 14px;
		height: 14px;
	}

	.run-btn {
		background: #a8a8e8;
		color: #050510;
	}

	.run-btn:hover:not(:disabled) {
		opacity: 0.88;
	}

	.run-btn:active:not(:disabled) {
		transform: scale(0.97);
	}

	.run-btn:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}

	.stop-btn {
		background: rgba(248, 113, 113, 0.15);
		color: #f87171;
		border: 0.5px solid rgba(248, 113, 113, 0.25);
	}

	.stop-btn:hover {
		background: rgba(248, 113, 113, 0.22);
	}

	.stop-btn:active {
		transform: scale(0.97);
	}

	/* ============================================================ */
	/* STATUS ROW */
	/* ============================================================ */

	.status-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding-left: 0.2rem;
	}

	.status-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		flex-shrink: 0;
		transition:
			background 0.3s,
			box-shadow 0.3s;
	}

	.status-label {
		font-size: 0.72rem;
		font-weight: 600;
		letter-spacing: 0.04em;
	}

	.status-message {
		font-size: 0.72rem;
		color: rgba(232, 232, 240, 0.35);
	}

	/* ============================================================ */
	/* TERMINAL WINDOW */
	/* ============================================================ */

	.terminal-window {
		flex: 1;
		min-height: 0;
		display: flex;
		flex-direction: column;
		border-radius: 12px;
		border: 0.5px solid rgba(255, 255, 255, 0.08);
		overflow: hidden;
		background: #0d0d18;
	}

	/* Title bar */
	.terminal-titlebar {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.7rem 1rem;
		background: #111120;
		border-bottom: 0.5px solid rgba(255, 255, 255, 0.06);
		flex-shrink: 0;
	}

	.traffic-lights {
		display: flex;
		gap: 6px;
		align-items: center;
	}

	.tl {
		width: 12px;
		height: 12px;
		border-radius: 50%;
	}

	.tl-red {
		background: #ff5f57;
	}
	.tl-yellow {
		background: #febc2e;
	}
	.tl-green {
		background: #28c840;
	}

	.terminal-title {
		flex: 1;
		font-size: 0.72rem;
		color: rgba(232, 232, 240, 0.3);
		text-align: center;
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		letter-spacing: 0.02em;
	}

	.clear-btn {
		font-size: 0.68rem;
		color: rgba(232, 232, 240, 0.25);
		background: none;
		border: 0.5px solid rgba(255, 255, 255, 0.07);
		border-radius: 5px;
		padding: 0.2rem 0.55rem;
		cursor: pointer;
		transition:
			color 0.15s,
			border-color 0.15s;
	}

	.clear-btn:hover {
		color: rgba(232, 232, 240, 0.7);
		border-color: rgba(255, 255, 255, 0.15);
	}

	/* Output area */
	.terminal-body {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		overflow-x: auto;
		padding: 1.1rem 1.25rem;
		scrollbar-width: thin;
		scrollbar-color: rgba(168, 168, 232, 0.15) transparent;
	}

	.terminal-pre {
		margin: 0;
		padding: 0;
		font-family: 'JetBrains Mono', 'Fira Mono', ui-monospace, Menlo, monospace;
		font-size: 0.82rem;
		line-height: 1.65;
		color: #d4d4e8;
		white-space: pre;
		word-break: normal;
	}

	.terminal-placeholder {
		color: rgba(232, 232, 240, 0.18);
		font-style: italic;
	}

	/* Input row */
	.terminal-input-row {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		padding: 0.7rem 1.25rem;
		border-top: 0.5px solid rgba(255, 255, 255, 0.06);
		background: #0d0d18;
		flex-shrink: 0;
	}

	.prompt {
		color: #a8a8e8;
		font-family: 'JetBrains Mono', ui-monospace, monospace;
		font-size: 0.82rem;
		opacity: 0.7;
		flex-shrink: 0;
	}

	.terminal-input {
		flex: 1;
		background: none;
		border: none;
		outline: none;
		color: #e8e8f0;
		font-family: 'JetBrains Mono', 'Fira Mono', ui-monospace, monospace;
		font-size: 0.82rem;
		caret-color: #a8a8e8;
	}

	.terminal-input::placeholder {
		color: rgba(232, 232, 240, 0.18);
	}

	.terminal-input:disabled {
		cursor: not-allowed;
	}

	/* ============================================================ */
	/* MOBILE */
	/* ============================================================ */

	@media (max-width: 640px) {
		.sidebar {
			display: none;
		}

		.main {
			padding: 1rem;
		}
	}
</style>