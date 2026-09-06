(() => {
  if (window.__maltezosMotionLoaded) return;
  window.__maltezosMotionLoaded = true;

  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  root.classList.add('mz-motion-ready');

  const progress = document.createElement('div');
  progress.className = 'mz-progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.appendChild(progress);

  const revealSelectors = [
    '.section-title',
    '.shop-head',
    '.card',
    '.reason',
    '.contact-box',
    '.contact-image-box',
    '.product',
    '.product-page',
    '.legal-card',
    '.shop-note',
    '.tradein-box'
  ];

  const revealSelector = revealSelectors.join(',');
  const revealItems = [...document.querySelectorAll(revealSelector)];

  revealItems.forEach((item, index) => {
    item.classList.add('mz-reveal');
    const parent = item.parentElement;
    const siblings = parent ? [...parent.children].filter((child) => child.matches?.(revealSelector)) : [];
    const siblingIndex = Math.max(0, siblings.indexOf(item));
    const delay = Math.min(siblingIndex * 70, 280);
    item.style.setProperty('--mz-delay', `${delay}ms`);
    item.dataset.mzRevealIndex = String(index);
  });

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach((item) => item.classList.add('mz-in'));
  } else {
    const observer = new IntersectionObserver((entries, io) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('mz-in');
        io.unobserve(entry.target);
      });
    }, {
      threshold: 0.11,
      rootMargin: '0px 0px -6% 0px'
    });

    revealItems.forEach((item) => observer.observe(item));
  }

  const nav = document.querySelector('nav, .toolbar');
  let ticking = false;

  const updateScrollState = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
    const scrollHeight = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const ratio = Math.max(0, Math.min(1, scrollTop / scrollHeight));
    root.style.setProperty('--mz-progress', ratio.toFixed(4));

    if (nav) nav.classList.toggle('mz-scrolled', scrollTop > 42);
    ticking = false;
  };

  const requestScrollUpdate = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(updateScrollState);
  };

  updateScrollState();
  window.addEventListener('scroll', requestScrollUpdate, { passive: true });
  window.addEventListener('resize', requestScrollUpdate, { passive: true });

  const hero = document.querySelector('.hero');

  if (hero && finePointer && !reduceMotion) {
    let heroFrame = 0;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const animateHero = () => {
      currentX += (targetX - currentX) * 0.085;
      currentY += (targetY - currentY) * 0.085;
      hero.style.setProperty('--mz-hero-x', `${currentX.toFixed(2)}px`);
      hero.style.setProperty('--mz-hero-y', `${currentY.toFixed(2)}px`);

      if (Math.abs(targetX - currentX) > 0.05 || Math.abs(targetY - currentY) > 0.05) {
        heroFrame = window.requestAnimationFrame(animateHero);
      } else {
        heroFrame = 0;
      }
    };

    const kickHeroFrame = () => {
      if (!heroFrame) heroFrame = window.requestAnimationFrame(animateHero);
    };

    hero.addEventListener('pointermove', (event) => {
      const rect = hero.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      targetX = x * 22;
      targetY = y * 14;
      kickHeroFrame();
    }, { passive: true });

    hero.addEventListener('pointerleave', () => {
      targetX = 0;
      targetY = 0;
      kickHeroFrame();
    }, { passive: true });
  }

  const spotlightTargets = document.querySelectorAll(
    '.card, .reason, .product, .contact-box, .contact-image-box, .product-page, .legal-card'
  );

  spotlightTargets.forEach((target) => {
    if (window.getComputedStyle(target).position === 'static') {
      target.style.position = 'relative';
    }
  });

  if (finePointer && !reduceMotion) {
    spotlightTargets.forEach((target) => {
      target.addEventListener('pointermove', (event) => {
        const rect = target.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        target.style.setProperty('--mz-x', `${x.toFixed(1)}%`);
        target.style.setProperty('--mz-y', `${y.toFixed(1)}%`);
      }, { passive: true });

      target.addEventListener('pointerleave', () => {
        target.style.setProperty('--mz-x', '50%');
        target.style.setProperty('--mz-y', '50%');
      }, { passive: true });
    });
  }

  const heroPanel = document.querySelector('.hero-panel');
  if (heroPanel && finePointer && !reduceMotion) {
    heroPanel.querySelectorAll('li').forEach((item, index) => {
      item.style.transition = `transform .4s ${index * 45}ms cubic-bezier(.16,1,.3,1), color .25s ease, padding-left .4s cubic-bezier(.16,1,.3,1)`;
    });

    heroPanel.addEventListener('mouseenter', () => {
      heroPanel.querySelectorAll('li').forEach((item) => {
        item.style.transform = 'translateX(4px)';
        item.style.paddingLeft = '4px';
      });
    });

    heroPanel.addEventListener('mouseleave', () => {
      heroPanel.querySelectorAll('li').forEach((item) => {
        item.style.transform = '';
        item.style.paddingLeft = '';
      });
    });
  }
})();
