import confetti from 'canvas-confetti';

export function fireCopyConfetti(event?: React.MouseEvent) {
  let origin = { x: 0.5, y: 0.7 };
  if (event) {
    const x = event.clientX / window.innerWidth;
    const y = event.clientY / window.innerHeight;
    origin = { x, y };
  }

  confetti({
    particleCount: 40,
    spread: 60,
    origin,
    colors: ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'],
    ticks: 120,
    gravity: 1.2,
    scalar: 0.9,
    disableForReducedMotion: true,
  });
}
