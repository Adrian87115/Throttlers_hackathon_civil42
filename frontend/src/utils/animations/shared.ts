import { Transition, Variant, Variants } from 'framer-motion';

export namespace GeneralAnimations {
	const baseTransition: Transition = {
		duration: 0.75,
		ease: 'easeOut'
	};

	const baseDistance = 24;

	export const hiddenFieldName = 'hidden';
	export const showFieldName = 'show';

	export const delayedListShowHolder: Variants = {
		hidden: {
			opacity: 0
		},
		show: {
			opacity: 1,
			transition: {
				staggerChildren: 0.2
			}
		}
	};

	const withTransition = (transition?: Transition): Transition =>
		transition ? { ...baseTransition, ...transition } : baseTransition;

	/* ---------- FADE IN ---------- */

	export const fadeInTop = (
		transition?: Transition,
		hiddenOverrides: Variant = {},
		showOverrides: Variant = {}
	): Variants => ({
		hidden: {
			opacity: 0,
			y: -baseDistance,
			...hiddenOverrides
		},
		show: {
			opacity: 1,
			y: 0,
			transition: withTransition(transition),
			...showOverrides
		}
	});

	export const fadeInBottom = (
		transition?: Transition,
		hiddenOverrides: Variant = {},
		showOverrides: Variant = {}
	): Variants => ({
		hidden: {
			opacity: 0,
			y: baseDistance,
			...hiddenOverrides
		},
		show: {
			opacity: 1,
			y: 0,
			transition: withTransition(transition),
			...showOverrides
		}
	});

	export const fadeInLeft = (
		transition?: Transition,
		hiddenOverrides: Variant = {},
		showOverrides: Variant = {}
	): Variants => ({
		hidden: {
			opacity: 0,
			x: -baseDistance,
			...hiddenOverrides
		},
		show: {
			opacity: 1,
			x: 0,
			transition: withTransition(transition),
			...showOverrides
		}
	});

	export const fadeInRight = (
		transition?: Transition,
		hiddenOverrides: Variant = {},
		showOverrides: Variant = {}
	): Variants => ({
		hidden: {
			opacity: 0,
			x: baseDistance,
			...hiddenOverrides
		},
		show: {
			opacity: 1,
			x: 0,
			transition: withTransition(transition),
			...showOverrides
		}
	});

	/* ---------- FADE OUT ---------- */
	export const fadeOutTop = (
		transition?: Transition,
		showOverrides: Variant = {},
		exitOverrides: Variant = {}
	): Variants => ({
		show: {
			opacity: 1,
			y: 0,
			...showOverrides
		},
		exit: {
			opacity: 0,
			y: -baseDistance,
			transition: withTransition(transition),
			...exitOverrides
		}
	});

	export const fadeOutBottom = (
		transition?: Transition,
		showOverrides: Variant = {},
		exitOverrides: Variant = {}
	): Variants => ({
		show: {
			opacity: 1,
			y: 0,
			...showOverrides
		},
		exit: {
			opacity: 0,
			y: baseDistance,
			transition: withTransition(transition),
			...exitOverrides
		}
	});

	export const fadeOutLeft = (
		transition?: Transition,
		showOverrides: Variant = {},
		exitOverrides: Variant = {}
	): Variants => ({
		show: {
			opacity: 1,
			x: 0,
			...showOverrides
		},
		exit: {
			opacity: 0,
			x: -baseDistance,
			transition: withTransition(transition),
			...exitOverrides
		}
	});

	export const fadeOutRight = (
		transition?: Transition,
		showOverrides: Variant = {},
		exitOverrides: Variant = {}
	): Variants => ({
		show: {
			opacity: 1,
			x: 0,
			...showOverrides
		},
		exit: {
			opacity: 0,
			x: baseDistance,
			transition: withTransition(transition),
			...exitOverrides
		}
	});
}

// FIRE ANIMATION

export class FireAnimation {
	particles: {
		x: number;
		y: number;
		size: number;
		opacity: number;
		speedX: number;
		speedY: number;
		colorIndex: number;
		rotation: number;
		rotationSpeed: number;
		sway: number;
		swaySpeed: number;
		swayOffset: number;
		lifespan: number;
	}[];
	paletteBase: { r: number; g: number; b: number }[];
	palette: {
		r: number;
		g: number;
		b: number;
	}[];
	time: number;
	lastUpdateTime: number;
	canvas: HTMLCanvasElement;
	ctx: CanvasRenderingContext2D;

	private rafId: number | null = null;
	private targetFPS = 30;
	private FRAME_TIME = 1000 / this.targetFPS;

	constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
		this.particles = [];
		this.paletteBase = [
			{ r: 245, g: 167, b: 66 }, // Gold
			{ r: 232, g: 90, b: 25 }, // Orange
			{ r: 255, g: 62, b: 0 }, // Bright red-orange
			{ r: 191, g: 34, b: 34 }, // Deep red
			{ r: 80, g: 20, b: 70 } // Purple shadow
		];

		this.palette = [...this.paletteBase];
		this.time = 0;
		this.lastUpdateTime = 0;
		this.canvas = canvas;
		this.ctx = ctx;

		// Initialize particles
		this.createParticles();

		// Start the animation
		this.animate();

		// // Add interactivity
		// canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
	}

	destroy() {
		if (this.rafId) cancelAnimationFrame(this.rafId);
	}

	createParticles() {
		if (!this.canvas) return;

		const particleCount = Math.floor(
			(this.canvas.width * this.canvas.height) / 3000
		);

		for (let i = 0; i < particleCount; i++) {
			this.particles.push({
				x: Math.random() * this.canvas.width,
				y: this.canvas.height + Math.random() * 100,
				size: 5 + Math.random() * 25,
				opacity: 0.1 + Math.random() * 0.5,
				speedX: (Math.random() - 0.5) * 1.5,
				speedY: -1.5 - Math.random() * 3,
				colorIndex: Math.floor(Math.random() * this.palette.length),
				rotation: Math.random() * Math.PI * 2,
				rotationSpeed: (Math.random() - 0.5) * 0.02,
				sway: 0.3 + Math.random() * 0.5,
				swaySpeed: 0.005 + Math.random() * 0.01,
				swayOffset: Math.random() * Math.PI * 2,
				lifespan: 100 + Math.random() * 200
			});
		}
	}

	animate(currentTime = 0) {
		if (!this.canvas || !this.ctx) return;

		console.log('animating fire');

		// first frame init
		if (this.lastUpdateTime === 0) {
			this.lastUpdateTime = currentTime;
		}

		const delta = currentTime - this.lastUpdateTime;

		// skip frame if we're too early
		if (delta < this.FRAME_TIME) {
			this.rafId = requestAnimationFrame(this.animate.bind(this));
			return;
		}

		this.lastUpdateTime = currentTime - (delta % this.FRAME_TIME);

		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

		this.time += 0.01;

		this.updatePalette();
		this.updateParticles();

		if (this.particles.length < 100) {
			this.createParticles();
		}

		this.rafId = requestAnimationFrame(this.animate.bind(this));
	}

	updatePalette() {
		// Subtly shift colors over time for a dynamic effect
		this.palette = this.paletteBase.map((color, index) => {
			const t = this.time + index * 0.5;
			const variation = 20;

			return {
				r: Math.min(255, Math.max(0, color.r + Math.sin(t) * variation)),
				g: Math.min(255, Math.max(0, color.g + Math.sin(t + 1) * variation)),
				b: Math.min(255, Math.max(0, color.b + Math.sin(t + 2) * variation))
			};
		});
	}

	updateParticles() {
		if (!this.canvas) return;

		for (let i = 0; i < this.particles.length; i++) {
			const p = this.particles[i];

			// Apply movement
			p.x +=
				p.speedX + Math.sin(this.time * p.swaySpeed + p.swayOffset) * p.sway;
			p.y += p.speedY;
			p.rotation += p.rotationSpeed;
			p.lifespan -= 1;

			// Gradually reduce size and opacity as particle rises
			const lifeFactor = p.lifespan / 300;
			const currentSize = p.size * lifeFactor;
			const currentOpacity = p.opacity * lifeFactor;

			// Draw particle as a brushstroke-like shape
			if (p.lifespan > 0) {
				this.drawBrushstroke(
					p.x,
					p.y,
					currentSize,
					p.rotation,
					this.palette[p.colorIndex],
					currentOpacity
				);
			}

			// Reset particles that have faded out
			if (p.lifespan <= 0 || p.y < -100) {
				this.particles[i] = {
					x: Math.random() * this.canvas.width,
					y: this.canvas.height + Math.random() * 50,
					size: 5 + Math.random() * 25,
					opacity: 0.1 + Math.random() * 0.5,
					speedX: (Math.random() - 0.5) * 1.5,
					speedY: -1.5 - Math.random() * 3,
					colorIndex: Math.floor(Math.random() * this.palette.length),
					rotation: Math.random() * Math.PI * 2,
					rotationSpeed: (Math.random() - 0.5) * 0.02,
					sway: 0.3 + Math.random() * 0.5,
					swaySpeed: 0.005 + Math.random() * 0.01,
					swayOffset: Math.random() * Math.PI * 2,
					lifespan: 100 + Math.random() * 200
				};
			}
		}
	}

	drawBrushstroke(
		x: number,
		y: number,
		size: number,
		rotation: number,
		color: { r: number; g: number; b: number },
		opacity: number
	) {
		if (!this.ctx) return;

		this.ctx.save();
		this.ctx.translate(x, y);
		this.ctx.rotate(rotation);

		// // Create a gradient for more realistic looking flame
		// const gradient = this.ctx.createLinearGradient(0, -size, 0, size);
		// gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
		// gradient.addColorStop(
		// 	0.5,
		// 	`rgba(${color.r}, ${color.g}, ${color.b}, ${opacity})`
		// );
		// gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);

		this.ctx.globalAlpha = opacity;

		// Use integer values for RGB to ensure string consistency (minor opt)
		const r = Math.floor(color.r);
		const g = Math.floor(color.g);
		const b = Math.floor(color.b);

		this.ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
		// this.ctx.fillStyle = gradient;

		// Draw a curved brushstroke shape
		this.ctx.beginPath();
		this.ctx.moveTo(-size / 3, -size);
		this.ctx.quadraticCurveTo(size / 2, 0, -size / 3, size);
		this.ctx.quadraticCurveTo(size / 2, 0, size / 3, -size / 2);
		this.ctx.closePath();
		this.ctx.fill();

		// Add some smaller accent strokes for texture
		this.ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${
			opacity * 0.7
		})`;
		this.ctx.beginPath();
		this.ctx.ellipse(size / 6, 0, size / 4, size / 2, 0, 0, Math.PI * 2);
		this.ctx.fill();

		this.ctx.restore();
	}

	handleMouseMove(e: MouseEvent) {
		if (!this.canvas) return;

		const rect = this.canvas.getBoundingClientRect();
		const mouseX = e.clientX - rect.left;
		const mouseY = e.clientY - rect.top;

		// Add some particles near the mouse position
		for (let i = 0; i < 3; i++) {
			const offsetX = (Math.random() - 0.5) * 50;
			const offsetY = (Math.random() - 0.5) * 50;

			this.particles.push({
				x: mouseX + offsetX,
				y: mouseY + offsetY,
				size: 10 + Math.random() * 20,
				opacity: 0.2 + Math.random() * 0.4,
				speedX: (Math.random() - 0.5) * 2,
				speedY: -2 - Math.random() * 2,
				colorIndex: Math.floor(Math.random() * this.palette.length),
				rotation: Math.random() * Math.PI * 2,
				rotationSpeed: (Math.random() - 0.5) * 0.03,
				sway: 0.3 + Math.random() * 0.5,
				swaySpeed: 0.005 + Math.random() * 0.01,
				swayOffset: Math.random() * Math.PI * 2,
				lifespan: 50 + Math.random() * 100
			});
		}
	}
}

// // Add interaction for the button
// const exploreButton = document.getElementById('explore-button');
// exploreButton.addEventListener('mouseenter', () => {
// 	// Add more particles when hovering over the button
// 	for (let i = 0; i < 20; i++) {
// 		const rect = exploreButton.getBoundingClientRect();
// 		const centerX = rect.left + rect.width / 2;
// 		const centerY = rect.top + rect.height / 2;

// 		const offsetX = (Math.random() - 0.5) * rect.width * 1.5;
// 		const offsetY = (Math.random() - 0.5) * rect.height * 1.5;

// 		fireAnimation.particles.push({
// 			x: centerX + offsetX,
// 			y: centerY + offsetY,
// 			size: 10 + Math.random() * 15,
// 			opacity: 0.2 + Math.random() * 0.4,
// 			speedX: (Math.random() - 0.5) * 2,
// 			speedY: -2 - Math.random() * 2,
// 			colorIndex: Math.floor(Math.random() * fireAnimation.palette.length),
// 			rotation: Math.random() * Math.PI * 2,
// 			rotationSpeed: (Math.random() - 0.5) * 0.03,
// 			sway: 0.3 + Math.random() * 0.5,
// 			swaySpeed: 0.005 + Math.random() * 0.01,
// 			swayOffset: Math.random() * Math.PI * 2,
// 			lifespan: 50 + Math.random() * 100
// 		});
// 	}
// });

// // Toggle portfolio view on button click
// exploreButton.addEventListener('click', () => {
// 	// This would typically navigate to the portfolio section
// 	// For the embed case, we'll add an animation effect instead
// 	document.querySelectorAll('.nav-item').forEach((item, index) => {
// 		item.style.animation = `fadeUp 0.5s ease forwards ${index * 0.1}s`;
// 		item.style.opacity = '0';
// 		setTimeout(() => {
// 			item.style.opacity = '1';
// 		}, 100);
// 	});

// 	// Create a burst of particles
// 	for (let i = 0; i < 50; i++) {
// 		const rect = exploreButton.getBoundingClientRect();
// 		const centerX = rect.left + rect.width / 2;
// 		const centerY = rect.top + rect.height / 2;

// 		const angle = Math.random() * Math.PI * 2;
// 		const distance = 10 + Math.random() * 50;

// 		fireAnimation.particles.push({
// 			x: centerX + Math.cos(angle) * distance,
// 			y: centerY + Math.sin(angle) * distance,
// 			size: 5 + Math.random() * 25,
// 			opacity: 0.2 + Math.random() * 0.6,
// 			speedX: Math.cos(angle) * (1 + Math.random() * 3),
// 			speedY: Math.sin(angle) * (1 + Math.random() * 3),
// 			colorIndex: Math.floor(Math.random() * fireAnimation.palette.length),
// 			rotation: Math.random() * Math.PI * 2,
// 			rotationSpeed: (Math.random() - 0.5) * 0.05,
// 			sway: 0.3 + Math.random() * 0.5,
// 			swaySpeed: 0.005 + Math.random() * 0.01,
// 			swayOffset: Math.random() * Math.PI * 2,
// 			lifespan: 50 + Math.random() * 100
// 		});
// 	}
// });

// // Add interaction for navigation items
// document.querySelectorAll('.nav-item').forEach((item) => {
// 	item.addEventListener('mouseenter', () => {
// 		const rect = item.getBoundingClientRect();
// 		const centerX = rect.left + rect.width / 2;
// 		const centerY = rect.top + rect.height / 2;

// 		// Add a few particles near the nav item
// 		for (let i = 0; i < 10; i++) {
// 			const offsetX = (Math.random() - 0.5) * rect.width;
// 			const offsetY = (Math.random() - 0.5) * rect.height;

// 			fireAnimation.particles.push({
// 				x: centerX + offsetX,
// 				y: centerY + offsetY,
// 				size: 5 + Math.random() * 10,
// 				opacity: 0.1 + Math.random() * 0.3,
// 				speedX: (Math.random() - 0.5) * 1,
// 				speedY: -1 - Math.random() * 1,
// 				colorIndex: Math.floor(
// 					Math.random() * fireAnimation.palette.length
// 				),
// 				rotation: Math.random() * Math.PI * 2,
// 				rotationSpeed: (Math.random() - 0.5) * 0.02,
// 				sway: 0.2 + Math.random() * 0.3,
// 				swaySpeed: 0.005 + Math.random() * 0.01,
// 				swayOffset: Math.random() * Math.PI * 2,
// 				lifespan: 30 + Math.random() * 50
// 			});
// 		}
// 	});
// });
