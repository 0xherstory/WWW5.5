'use client'

import React, { useRef, useEffect } from 'react';

/**
 * Ultra-High-Density Glowing Particle Sphere with Solid Rim
 * Renders a nearly solid-looking sphere with intense core glow and a dense, solid golden rim.
 */
const ParticleSphere: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    // Configuration for Ultra High Density & Glow
    const particleCount = 4500;
    const rimParticleCount = 1500;
    const sphereRadius = 180;
    const particles: Array<{
      x: number;
      y: number;
      z: number;
      color: string;
      baseSize: number;
      isRim: boolean;
    }> = [];
    const perspective = 1000;

    // Interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationY = 0;

    // Richer, deeper gold palette
    const colors = [
      '#ebc160', // Custom Luxury Gold (User Request)
      '#FDB931', // Bright Gold
      '#D4AF37', // Metallic Gold
      '#C5A059', // Muted Gold
      '#996515', // Deep Golden Brown
      '#FFFACD', // Lemon Chiffon (Highlights)
    ];

    // Palette for the solid rim
    const rimColors = [
      '#ebc160', // Custom Luxury Gold (User Request)
      '#FDB931', // Bright Gold
      '#FFFACD', // Lemon Chiffon (Highlights)
      '#FFD700', // Gold
    ];

    const goldenRatio = (1 + Math.sqrt(5)) / 2;

    // Initialize core particles using Fibonacci Sphere
    for (let i = 0; i < particleCount; i++) {
      const theta = 2 * Math.PI * i / goldenRatio;
      const phi = Math.acos(1 - 2 * (i + 0.5) / particleCount);

      const x = sphereRadius * Math.sin(phi) * Math.cos(theta);
      const y = sphereRadius * Math.sin(phi) * Math.sin(theta);
      const z = sphereRadius * Math.cos(phi);

      particles.push({
        x, y, z,
        color: colors[Math.floor(Math.random() * colors.length)],
        baseSize: Math.random() * 0.6 + 0.3,
        isRim: false,
      });
    }

    // Initialize rim particles
    for (let i = 0; i < rimParticleCount; i++) {
      const theta = 2 * Math.PI * i / goldenRatio;
      const phi = Math.acos(1 - 2 * (i + 0.5) / rimParticleCount);

      const x = sphereRadius * Math.sin(phi) * Math.cos(theta);
      const y = sphereRadius * Math.sin(phi) * Math.sin(theta);
      const z = sphereRadius * Math.cos(phi);

      particles.push({
        x, y, z,
        color: rimColors[Math.floor(Math.random() * rimColors.length)],
        baseSize: Math.random() * 0.5 + 0.5,
        isRim: true,
      });
    }

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = (e.clientX - rect.left - rect.width / 2) * 0.00015;
      mouseY = (e.clientY - rect.top - rect.height / 2) * 0.00015;
    };

    window.addEventListener('mousemove', handleMouseMove);

    let rotationX = 0;
    let rotationY = 0;

    const render = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'lighter';

      targetRotationY += 0.0015;
      rotationX += (mouseY - rotationX) * 0.05;
      rotationY += (targetRotationY + mouseX - rotationY) * 0.05;

      const cosX = Math.cos(rotationX);
      const sinX = Math.sin(rotationX);
      const cosY = Math.cos(rotationY);
      const sinY = Math.sin(rotationY);

      // Sort by Z-depth
      particles.sort((a, b) => {
        const getZ = (p: typeof particles[0]) => {
          const y1 = p.y * cosX - p.z * sinX;
          const z1 = p.z * cosX + p.y * sinX;
          return z1 * cosY + p.x * sinY;
        };
        return getZ(b) - getZ(a);
      });

      particles.forEach(p => {
        const y1 = p.y * cosX - p.z * sinX;
        const z1 = p.z * cosX + p.y * sinX;
        const x2 = p.x * cosY - z1 * sinY;
        const z2 = z1 * cosY + p.x * sinY;

        const scale = perspective / (perspective + z2);
        const x2d = x2 * scale + cx;
        const y2d = y1 * scale + cy;

        if (scale > 0) {
          let opacity = Math.max(0.1, Math.min(1, Math.pow(scale, 3)));
          if (p.isRim) {
            opacity = Math.max(0.6, opacity);
          }

          ctx.beginPath();
          ctx.arc(x2d, y2d, p.baseSize * scale, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.globalAlpha = opacity;
          ctx.fill();
        }
      });

      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="w-full h-full flex items-center justify-center relative bg-transparent">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing z-0 relative pointer-events-none"
      />
      {/* Enhanced Core Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-amber-400/30 rounded-full blur-[120px] z-10 mix-blend-overlay"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] bg-orange-300/40 rounded-full blur-[80px] z-10"></div>
    </div>
  );
};

export default ParticleSphere;
