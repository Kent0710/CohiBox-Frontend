<script lang="ts">
	let canvas: HTMLCanvasElement;
	import { onMount } from 'svelte';

	onMount(() => {
		const ctx = canvas.getContext('2d')!;
		let width = (canvas.width = window.innerWidth);
		let height = (canvas.height = window.innerHeight);
		let frame: number;
		let time = 0;

		const onResize = () => {
			width = canvas.width = window.innerWidth;
			height = canvas.height = window.innerHeight;
		};
		window.addEventListener('resize', onResize);

		function draw() {
			time += 0.003;
			ctx.clearRect(0, 0, width, height);

			// --- Orb 1: purple — sweeps left to right slowly ---
			const x1 = width * (0.1 + 0.6 * (Math.sin(time * 0.7) * 0.5 + 0.5));
			const y1 = height * (0.3 + 0.2 * Math.sin(time * 0.5));
			const g1 = ctx.createRadialGradient(x1, y1, 0, x1, y1, width * 0.5);
			g1.addColorStop(0, 'rgba(100, 80, 220, 0.18)');
			g1.addColorStop(1, 'rgba(100, 80, 220, 0)');
			ctx.fillStyle = g1;
			ctx.fillRect(0, 0, width, height);

			// --- Orb 2: blue-violet — counter sweeps right to left ---
			const x2 = width * (0.9 - 0.55 * (Math.sin(time * 0.5 + 1.2) * 0.5 + 0.5));
			const y2 = height * (0.6 + 0.25 * Math.sin(time * 0.4 + 0.8));
			const g2 = ctx.createRadialGradient(x2, y2, 0, x2, y2, width * 0.45);
			g2.addColorStop(0, 'rgba(60, 40, 180, 0.14)');
			g2.addColorStop(1, 'rgba(60, 40, 180, 0)');
			ctx.fillStyle = g2;
			ctx.fillRect(0, 0, width, height);

			// --- Orb 3: pink accent — subtle, drifts vertically ---
			const x3 = width * (0.5 + 0.3 * Math.sin(time * 0.3 + 2.1));
			const y3 = height * (0.15 + 0.4 * (Math.sin(time * 0.6 + 1.5) * 0.5 + 0.5));
			const g3 = ctx.createRadialGradient(x3, y3, 0, x3, y3, width * 0.35);
			g3.addColorStop(0, 'rgba(140, 60, 200, 0.1)');
			g3.addColorStop(1, 'rgba(140, 60, 200, 0)');
			ctx.fillStyle = g3;
			ctx.fillRect(0, 0, width, height);

			frame = requestAnimationFrame(draw);
		}

		draw();

		return () => {
			cancelAnimationFrame(frame);
			window.removeEventListener('resize', onResize);
		};
	});
</script>

<canvas bind:this={canvas}></canvas>

<style>
	canvas {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		z-index: 0;
		pointer-events: none;

		animation: gradientFade 6s ease-in-out infinite;
	}

	@keyframes gradientFade {
		0%,
		100% {
			opacity: 0.35;
		}

		50% {
			opacity: 1;
		}
	}
</style>
