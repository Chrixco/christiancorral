// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

// Configure GSAP for better performance
gsap.config({
  force3D: true,
  nullTargetWarn: false
});

// Global variables
let isLoaded = false;
let mouseX = 0;
let mouseY = 0;
// Matrix background (canvas-based)
let matrixCanvas = null;
let matrixCtx = null;
let matrixCols = 0;
let matrixRows = 0;
let matrixCellSize = 24; // px (will be responsive)
let matrixLetters = [];
let matrixAnimationId = null;
let mousePos = { x: -9999, y: -9999 };
let glowAlpha = 0; // 0..1, fades when mouse leaves
let hoverRadiusBase = 60; // will be set responsive in setup
let hoverRadius = 60;

// Wave effect system
let waves = [];
const MAX_WAVES = 5; // Limit concurrent waves for performance
let isDragging = false;
let lastWaveTime = 0;
const WAVE_INTERVAL = 100; // ms between waves when dragging

class Wave {
  constructor(x, y, isSecondary = false, delayFrames = 0) {
    this.x = x;
    this.y = y;
    this.radius = 0;
    this.isSecondary = isSecondary;
    this.delayFrames = delayFrames;
    this.currentDelay = delayFrames;

    if (isSecondary) {
      this.maxRadius = 200;
      this.speed = 2;
    } else {
      this.maxRadius = 300;
      this.speed = 3;
    }

    this.opacity = 1;
    this.lineWidth = 3;

    // Randomly choose wave color: blue, orange, yellow, or neon pink
    const colors = [
      { r: 0, g: 119, b: 255 },    // Blue #0077FF
      { r: 255, g: 122, b: 0 },    // Orange #FF7A00
      { r: 255, g: 193, b: 7 },    // Yellow #FFC107
      { r: 255, g: 20, b: 147 }    // Neon Pink #FF1493
    ];
    this.colorRGB = colors[Math.floor(Math.random() * colors.length)];
  }

  update() {
    // Handle delay for secondary waves
    if (this.currentDelay > 0) {
      this.currentDelay--;
      return true; // Keep wave alive during delay
    }

    this.radius += this.speed;
    this.opacity = 1 - (this.radius / this.maxRadius);
    this.lineWidth = 3 * this.opacity;
    return this.radius < this.maxRadius;
  }

  // Calculate color influence for a given point
  getColorInfluence(x, y) {
    // Don't apply influence during delay period
    if (this.currentDelay > 0) {
      return { influence: 0, color: null };
    }

    const dx = x - this.x;
    const dy = y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Wave has a thickness/width (smaller for secondary waves)
    const waveThickness = this.isSecondary ? 30 : 40;
    const distFromWave = Math.abs(dist - this.radius);

    if (distFromWave < waveThickness) {
      // Letter is within wave band
      const influence = (1 - distFromWave / waveThickness) * this.opacity;
      return { influence, color: this.colorRGB };
    }

    return { influence: 0, color: null };
  }
}

// DOM elements
const elements = {
  navbar: document.getElementById('navbar'),
  heroTitle: document.getElementById('hero-title'),
  heroSubtitle: document.getElementById('hero-subtitle'),
  heroSlogan: document.getElementById('hero-slogan'),
  heroContent: document.querySelector('.hero-content'),
  footer: document.getElementById('footer'),
  socialLinks: document.querySelectorAll('.social-link'),
  glassButtons: document.querySelectorAll('.glass-button'),
  letterBackground: document.getElementById('letter-background')
};

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initLetterBackground();
  initAnimations();
  initHoverEffects();
  initMouseTracking();
  initScrollEffects();
  
  // Mark as loaded after a short delay
  setTimeout(() => {
    isLoaded = true;
  }, 100);

  // About modal functionality
  const aboutBtn = document.getElementById('about-btn');
  const aboutOverlay = document.getElementById('about-overlay');
  const aboutClose = document.getElementById('about-close');
  const aboutModal = document.querySelector('.about-modal');
  const navbar = document.querySelector('.navbar');
  const footer = document.querySelector('.footer');
  const heroPhoto = document.getElementById('hero-photo');
  const heroTitle = document.getElementById('hero-title');

  function openAboutModal() {
    aboutOverlay.classList.add('visible');
    document.body.style.overflow = 'hidden';

    // Minimize navbar and footer
    if (navbar) navbar.classList.add('minimized');
    if (footer) footer.classList.add('minimized');
  }

  function closeAboutModal() {
    aboutOverlay.classList.remove('visible');
    document.body.style.overflow = '';

    // Restore navbar and footer
    if (navbar) navbar.classList.remove('minimized');
    if (footer) footer.classList.remove('minimized');
  }

  if (aboutBtn) {
    aboutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      openAboutModal();
    });
  }

  // Photo click to open About modal
  if (heroPhoto) {
    heroPhoto.addEventListener('click', (e) => {
      e.preventDefault();
      openAboutModal();
    });
  }

  // Name/Title click to open About modal
  if (heroTitle) {
    heroTitle.addEventListener('click', (e) => {
      e.preventDefault();
      openAboutModal();
    });
  }

  if (aboutClose) {
    aboutClose.addEventListener('click', closeAboutModal);
  }

  // Click outside modal to close
  if (aboutOverlay) {
    aboutOverlay.addEventListener('click', (e) => {
      if (e.target === aboutOverlay) {
        closeAboutModal();
      }
    });
  }

  // ESC key to close modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && aboutOverlay.classList.contains('visible')) {
      closeAboutModal();
    }
  });
});

// Initialize animated letter background (Matrix grid style)
function initLetterBackground() {
  if (!elements.letterBackground) return;

  // Clear previous
  if (matrixAnimationId) cancelAnimationFrame(matrixAnimationId);
  elements.letterBackground.innerHTML = '';

  // Create canvas
  matrixCanvas = document.createElement('canvas');
  matrixCtx = matrixCanvas.getContext('2d');
  matrixCanvas.style.position = 'absolute';
  matrixCanvas.style.top = '0';
  matrixCanvas.style.left = '0';
  matrixCanvas.style.width = '100%';
  matrixCanvas.style.height = '100%';
  elements.letterBackground.appendChild(matrixCanvas);

  const setup = () => {
    const dpr = window.devicePixelRatio || 1;
    const width = elements.letterBackground.clientWidth;
    const height = elements.letterBackground.clientHeight;
    matrixCanvas.width = Math.floor(width * dpr);
    matrixCanvas.height = Math.floor(height * dpr);
    matrixCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Responsive cell size
    if (width < 480) matrixCellSize = 18;
    else if (width < 768) matrixCellSize = 20;
    else matrixCellSize = 24;

    matrixCols = Math.ceil(width / matrixCellSize);
    matrixRows = Math.ceil(height / matrixCellSize);
    hoverRadiusBase = matrixCellSize * 5.4; // 50% larger circle
    hoverRadius = hoverRadiusBase;

    // Build grid letters
    const pool = ['C', 'C', 'B'];
    matrixLetters = new Array(matrixRows * matrixCols).fill(null).map(() => ({
      ch: pool[Math.floor(Math.random() * pool.length)],
      shade: 190 + Math.floor(Math.random() * 45) // lighter grey 190-235
    }));
  };

  setup();

  // Render loop
  const render = (t) => {
    const { width, height } = elements.letterBackground.getBoundingClientRect();
    matrixCtx.clearRect(0, 0, width, height);

    // Randomly flicker a small subset
    for (let i = 0; i < Math.floor((matrixRows * matrixCols) * 0.01); i++) {
      const idx = Math.floor(Math.random() * matrixLetters.length);
      const cell = matrixLetters[idx];
      cell.shade = 140 + Math.floor(Math.random() * 80);
      // Occasionally change character
      if (Math.random() < 0.02) {
        cell.ch = Math.random() < 0.66 ? 'C' : 'B';
      }
    }

    matrixCtx.textBaseline = 'middle';
    matrixCtx.textAlign = 'center';
    matrixCtx.font = `600 ${Math.floor(matrixCellSize * 0.8)}px Inter, system-ui, -apple-system, sans-serif`;

    for (let row = 0; row < matrixRows; row++) {
      for (let col = 0; col < matrixCols; col++) {
        const idx = row * matrixCols + col;
        const cell = matrixLetters[idx];
        const x = col * matrixCellSize + matrixCellSize / 2;
        const y = row * matrixCellSize + matrixCellSize / 2;

        // Hover highlight to light blue within radius
        const dx = mousePos.x - x;
        const dy = mousePos.y - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const radius = hoverRadius;
        // Smooth blend factor 0..1
        // Sharpened eased falloff for clearer ring
        let f = 0;
        if (radius > 0) {
          const d = Math.min(dist / radius, 1);
          f = Math.pow(1 - d, 2.2);
        }

        // Calculate wave influence - find the strongest wave
        let maxWaveInfluence = 0;
        let waveColor = null;
        for (const wave of waves) {
          const waveData = wave.getColorInfluence(x, y);
          if (waveData.influence > maxWaveInfluence) {
            maxWaveInfluence = waveData.influence;
            waveColor = waveData.color;
          }
        }

        // Determine which effect is stronger: hover or wave
        const hoverInfluence = f * glowAlpha;
        let finalInfluence, rAccent, gAccent, bAccent;

        if (maxWaveInfluence > hoverInfluence) {
          // Wave effect is dominant - use wave color
          finalInfluence = maxWaveInfluence;
          rAccent = waveColor.r;
          gAccent = waveColor.g;
          bAccent = waveColor.b;
        } else {
          // Hover effect is dominant - use orange
          finalInfluence = hoverInfluence;
          rAccent = 255;
          gAccent = 122;
          bAccent = 0;
        }

        const g = cell.shade;
        const rGrey = g, gGrey = g, bGrey = g, aGrey = 0.35;
        const aAccent = 1.0;
        const r = Math.round(rGrey + (rAccent - rGrey) * finalInfluence);
        const gCh = Math.round(gGrey + (gAccent - gGrey) * finalInfluence);
        const b = Math.round(bGrey + (bAccent - bGrey) * finalInfluence);
        const a = aGrey + (aAccent - aGrey) * finalInfluence;
        matrixCtx.fillStyle = `rgba(${r}, ${gCh}, ${b}, ${a})`;
        matrixCtx.fillText(cell.ch, x, y);
      }
    }

    // Note: no canvas glow fill — the circular shape is revealed only by letter colors

    // Update waves (no drawing - effect applied through letter colors)
    waves = waves.filter(wave => wave.update());

    // Ease hover radius and glow alpha
    hoverRadius += (hoverRadiusBase - hoverRadius) * 0.08;
    glowAlpha *= 0.96; // fade trail

    matrixAnimationId = requestAnimationFrame(render);
  };

  matrixAnimationId = requestAnimationFrame(render);

  // Mouse move to update hover color
  const updateMouse = (clientX, clientY) => {
    const rect = elements.letterBackground.getBoundingClientRect();
    mousePos.x = clientX - rect.left;
    mousePos.y = clientY - rect.top;
    glowAlpha = 1; // refresh glow
    hoverRadius = hoverRadiusBase * 1.2;
  };
  window.addEventListener('mousemove', (e) => updateMouse(e.clientX, e.clientY));
  window.addEventListener('touchmove', (e) => {
    if (e.touches && e.touches[0]) updateMouse(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });
  window.addEventListener('mouseleave', () => { mousePos.x = -9999; mousePos.y = -9999; });

  // Handle resize
  window.addEventListener('resize', () => {
    setup();
  });

  // Helper function to create waves at a position
  const createWavesAt = (x, y) => {
    // Create primary wave
    waves.push(new Wave(x, y));

    // Create 2 smaller secondary waves with delays
    waves.push(new Wave(x, y, true, 10));  // Delayed by 10 frames
    waves.push(new Wave(x, y, true, 20));  // Delayed by 20 frames

    // Remove oldest waves if too many (keep within performance limits)
    while (waves.length > MAX_WAVES * 3) {
      waves.shift();
    }
  };

  // Mouse down event to start dragging
  window.addEventListener('mousedown', (e) => {
    const rect = elements.letterBackground.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Check if click is within the background canvas
    if (clickX >= 0 && clickX <= rect.width && clickY >= 0 && clickY <= rect.height) {
      isDragging = true;
      lastWaveTime = Date.now();
      createWavesAt(clickX, clickY);
      // Prevent text selection when dragging
      document.body.style.userSelect = 'none';
      e.preventDefault();
    }
  });

  // Mouse move event to create waves while dragging
  window.addEventListener('mousemove', (e) => {
    if (isDragging) {
      const now = Date.now();
      if (now - lastWaveTime >= WAVE_INTERVAL) {
        const rect = elements.letterBackground.getBoundingClientRect();
        const dragX = e.clientX - rect.left;
        const dragY = e.clientY - rect.top;

        // Only create waves if within bounds
        if (dragX >= 0 && dragX <= rect.width && dragY >= 0 && dragY <= rect.height) {
          createWavesAt(dragX, dragY);
          lastWaveTime = now;
        }
      }
    }
  });

  // Mouse up event to stop dragging
  window.addEventListener('mouseup', () => {
    isDragging = false;
    // Re-enable text selection
    document.body.style.userSelect = '';
  });

  // Mouse leave event to stop dragging if mouse leaves window
  window.addEventListener('mouseleave', () => {
    isDragging = false;
    // Re-enable text selection
    document.body.style.userSelect = '';
  });

  // Touch events for mobile drag
  window.addEventListener('touchstart', (e) => {
    if (e.touches && e.touches[0]) {
      const rect = elements.letterBackground.getBoundingClientRect();
      const touchX = e.touches[0].clientX - rect.left;
      const touchY = e.touches[0].clientY - rect.top;

      isDragging = true;
      lastWaveTime = Date.now();
      createWavesAt(touchX, touchY);
    }
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (isDragging && e.touches && e.touches[0]) {
      const now = Date.now();
      if (now - lastWaveTime >= WAVE_INTERVAL) {
        const rect = elements.letterBackground.getBoundingClientRect();
        const touchX = e.touches[0].clientX - rect.left;
        const touchY = e.touches[0].clientY - rect.top;

        createWavesAt(touchX, touchY);
        lastWaveTime = now;
      }
    }
  }, { passive: true });

  window.addEventListener('touchend', () => {
    isDragging = false;
  }, { passive: true });
}

// Main entrance animation sequence
function initAnimations() {
  // Set initial states
  gsap.set([elements.navbar, elements.heroTitle, elements.heroSubtitle, elements.heroSlogan, elements.footer], {
    opacity: 0,
    y: 50
  });

  gsap.set(elements.heroContent, {
    opacity: 0,
    y: 50
  });

  // Create master timeline
  const tl = gsap.timeline({ delay: 0.2 });

  // Navbar entrance
  tl.to(elements.navbar, {
    opacity: 1,
    y: 0,
    duration: 0.8,
    ease: 'power2.out'
  });

  // Hero title entrance with split text effect
  tl.to(elements.heroTitle, {
    opacity: 1,
    y: 0,
    duration: 1,
    ease: 'power2.out'
  }, '-=0.4');

  // Subtitle entrance
  tl.to(elements.heroSubtitle, {
    opacity: 1,
    y: 0,
    duration: 0.8,
    ease: 'power2.out'
  }, '-=0.6');

  // Slogan entrance with slight delay
  tl.to(elements.heroSlogan, {
    opacity: 1,
    y: 0,
    duration: 0.8,
    ease: 'power2.out'
  }, '-=0.4');

  // Buttons and photo entrance together
  tl.to(elements.heroContent, {
    opacity: 1,
    y: 0,
    duration: 0.8,
    ease: 'power2.out'
  }, '-=0.6');

  // Footer entrance (last)
  tl.to(elements.footer, {
    opacity: 1,
    y: 0,
    duration: 0.6,
    ease: 'power2.out'
  }, '-=0.4');

  // Background blur animation
  gsap.fromTo('body',
    { filter: 'blur(10px)' },
    {
      filter: 'blur(0px)',
      duration: 1.5,
      ease: 'power2.out',
      delay: 0.1
    }
  );
}

// Hover effects for interactive elements
function initHoverEffects() {
  // Social links hover effects
  elements.socialLinks.forEach(link => {
    const icon = link.querySelector('.social-icon');
    
    link.addEventListener('mouseenter', () => {
      gsap.to(link, {
        scale: 1.1,
        rotationY: 5,
        duration: 0.3,
        ease: 'power2.out'
      });
      
      gsap.to(icon, {
        rotation: 360,
        duration: 0.6,
        ease: 'power2.out'
      });
    });
    
    link.addEventListener('mouseleave', () => {
      gsap.to(link, {
        scale: 1,
        rotationY: 0,
        duration: 0.3,
        ease: 'power2.out'
      });
      
      gsap.to(icon, {
        rotation: 0,
        duration: 0.3,
        ease: 'power2.out'
      });
    });
  });

  // Glass buttons hover effects
  elements.glassButtons.forEach(button => {
    const glow = button.querySelector('.button-glow');
    const text = button.querySelector('.button-text');
    
    button.addEventListener('mouseenter', () => {
      gsap.to(button, {
        scale: 1.05,
        rotationY: 2,
        duration: 0.3,
        ease: 'power2.out'
      });
      
      gsap.to(glow, {
        scale: 1,
        opacity: 0.2,
        duration: 0.4,
        ease: 'power2.out'
      });
      
      gsap.to(text, {
        y: -2,
        duration: 0.3,
        ease: 'power2.out'
      });
    });
    
    button.addEventListener('mouseleave', () => {
      gsap.to(button, {
        scale: 1,
        rotationY: 0,
        duration: 0.3,
        ease: 'power2.out'
      });
      
      gsap.to(glow, {
        scale: 0,
        opacity: 0,
        duration: 0.4,
        ease: 'power2.out'
      });
      
      gsap.to(text, {
        y: 0,
        duration: 0.3,
        ease: 'power2.out'
      });
    });
  });

  // Hero title hover effect
  elements.heroTitle.addEventListener('mouseenter', () => {
    gsap.to(elements.heroTitle, {
      scale: 1.02,
      rotationX: 2,
      duration: 0.4,
      ease: 'power2.out'
    });
  });
  
  elements.heroTitle.addEventListener('mouseleave', () => {
    gsap.to(elements.heroTitle, {
      scale: 1,
      rotationX: 0,
      duration: 0.4,
      ease: 'power2.out'
    });
  });
}

// Mouse tracking for subtle parallax effects
function initMouseTracking() {
  document.addEventListener('mousemove', (e) => {
    if (!isLoaded) return;
    
    mouseX = (e.clientX / window.innerWidth) - 0.5;
    mouseY = (e.clientY / window.innerHeight) - 0.5;
    
    // Subtle parallax on hero elements
    gsap.to(elements.heroTitle, {
      x: mouseX * 10,
      y: mouseY * 10,
      duration: 0.8,
      ease: 'power2.out'
    });
    
    gsap.to(elements.heroSubtitle, {
      x: mouseX * 5,
      y: mouseY * 5,
      duration: 0.8,
      ease: 'power2.out'
    });
    
    gsap.to(elements.heroButtons, {
      x: mouseX * 3,
      y: mouseY * 3,
      duration: 0.8,
      ease: 'power2.out'
    });
  });
}

// Scroll effects using ScrollTrigger
function initScrollEffects() {
  // Navbar scroll effect
  ScrollTrigger.create({
    trigger: 'body',
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: (self) => {
      const progress = self.progress;

      gsap.to(elements.navbar, {
        backgroundColor: `rgba(255, 255, 255, ${0.8 + progress * 0.2})`,
        backdropFilter: `blur(${20 + progress * 10}px)`,
        duration: 0.3
      });
    }
  });

  // Hero elements scroll parallax
  gsap.to(elements.heroTitle, {
    yPercent: -50,
    ease: 'none',
    scrollTrigger: {
      trigger: '.hero',
      start: 'top bottom',
      end: 'bottom top',
      scrub: true
    }
  });

}

// Button click animations
elements.glassButtons.forEach(button => {
  button.addEventListener('click', (e) => {
    // Create ripple effect
    const ripple = document.createElement('div');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      background: radial-gradient(circle, rgba(0, 119, 255, 0.3) 0%, transparent 70%);
      border-radius: 50%;
      transform: scale(0);
      pointer-events: none;
      z-index: 1;
    `;
    
    button.appendChild(ripple);
    
    gsap.to(ripple, {
      scale: 1,
      opacity: 0,
      duration: 0.6,
      ease: 'power2.out',
      onComplete: () => ripple.remove()
    });
    
    // Button click animation
    gsap.to(button, {
      scale: 0.95,
      duration: 0.1,
      ease: 'power2.out',
      yoyo: true,
      repeat: 1
    });
  });
});

// Page visibility API for performance optimization
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    gsap.globalTimeline.pause();
  } else {
    gsap.globalTimeline.resume();
  }
});

// Resize handler for responsive adjustments
window.addEventListener('resize', () => {
  ScrollTrigger.refresh();
});

// Preload critical animations
window.addEventListener('load', () => {
  // Ensure all animations are ready
  gsap.set('body', { visibility: 'visible' });
  
  // Add a subtle entrance glow to the entire page
  gsap.fromTo('body',
    { boxShadow: 'inset 0 0 100px rgba(0, 119, 255, 0.1)' },
    { boxShadow: 'inset 0 0 0px rgba(0, 119, 255, 0)', duration: 2, ease: 'power2.out' }
  );
});

// Keyboard navigation support
document.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    // Add focus styles for accessibility
    document.body.classList.add('keyboard-navigation');
  }
});

document.addEventListener('mousedown', () => {
  document.body.classList.remove('keyboard-navigation');
});

// Add CSS for keyboard navigation
const style = document.createElement('style');
style.textContent = `
  .keyboard-navigation *:focus {
    outline: 2px solid #0077FF !important;
    outline-offset: 2px !important;
  }
`;
document.head.appendChild(style);

// Performance monitoring
if ('performance' in window) {
  window.addEventListener('load', () => {
    setTimeout(() => {
      const perfData = performance.getEntriesByType('navigation')[0];
      console.log(`Page loaded in ${perfData.loadEventEnd - perfData.loadEventStart}ms`);
    }, 0);
  });
}
