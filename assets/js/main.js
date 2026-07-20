/* ═══════════════════════════════════════════════════════════
   NATACHA LAURE — main.js
   ═══════════════════════════════════════════════════════════ */

(() => {
  'use strict';

  // ─── CANVAS ÉTOILES ─────────────────────────────────
  const canvas = document.getElementById('stars-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let stars = [];
    let mouseX = 0, mouseY = 0;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      canvas.width  = window.innerWidth  * DPR;
      canvas.height = window.innerHeight * DPR;
      canvas.style.width  = window.innerWidth  + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.scale(DPR, DPR);
      createStars();
    }

    function createStars() {
      const count = Math.floor((window.innerWidth * window.innerHeight) / 9000);
      stars = [];
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          r: Math.random() * 1.2 + 0.3,
          baseAlpha: Math.random() * 0.5 + 0.2,
          alpha: 0,
          twinkleSpeed: Math.random() * 0.02 + 0.005,
          twinklePhase: Math.random() * Math.PI * 2,
          drift: Math.random() * 0.05 - 0.025
        });
      }
    }

    function render() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const t = performance.now() / 1000;

      stars.forEach(s => {
        // Twinkle
        s.alpha = s.baseAlpha + Math.sin(t * s.twinkleSpeed * 60 + s.twinklePhase) * 0.3;

        // Slow drift down
        s.y += s.drift;
        if (s.y > window.innerHeight) s.y = 0;

        // Distance to mouse for soft glow
        const dx = s.x - mouseX, dy = s.y - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const glow = Math.max(0, 1 - dist / 150);

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r + glow * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(224, 192, 136, ${Math.max(0, s.alpha + glow * 0.5)})`;
        ctx.fill();

        if (glow > 0.3) {
          ctx.beginPath();
          ctx.arc(s.x, s.y, (s.r + 1) * 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(204, 158, 88, ${glow * 0.08})`;
          ctx.fill();
        }
      });

      requestAnimationFrame(render);
    }

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', e => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }, { passive: true });

    resize();
    render();
  }

  // ─── CURSEUR PERSONNALISÉ (désactivé pour fluidité) ─
  // Le curseur custom créait du lag. Restauration du curseur natif.

  // ─── PROGRESS BAR ───────────────────────────────────
  const progress = document.querySelector('.progress-bar');
  if (progress) {
    window.addEventListener('scroll', () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
      progress.style.width = pct + '%';
    }, { passive: true });
  }

  // ─── HEADER SCROLLED ────────────────────────────────
  const header = document.querySelector('.site-header');
  if (header) {
    window.addEventListener('scroll', () => {
      header.classList.toggle('scrolled', window.scrollY > 50);
    }, { passive: true });
  }

  // ─── MENU MOBILE ─────────────────────────────────────
  const burger = document.getElementById('nav-burger');
  const nav    = document.querySelector('.main-nav');
  if (burger && nav) {
    burger.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        nav.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ─── ONGLETS MODE (Domicile / Téléphone) ───────────
  const modeTabs = document.querySelectorAll('.mode-tab');
  const modePanels = document.querySelectorAll('.mode-panel');
  const modePrecisions = document.querySelectorAll('.mode-precision-panel');
  if (modeTabs.length) {
    modeTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const mode = tab.dataset.mode;
        modeTabs.forEach(t => {
          const active = t.dataset.mode === mode;
          t.classList.toggle('is-active', active);
          t.setAttribute('aria-selected', active);
        });
        modePanels.forEach(p => p.classList.toggle('is-active', p.dataset.mode === mode));
        modePrecisions.forEach(p => p.classList.toggle('is-active', p.dataset.mode === mode));
      });
    });
  }

  // ─── MODALES DÉTAILS PRESTATIONS ───────────────────
  const prestationDetails = {
    'generale-domicile': {
      eyebrow: 'Formule 1 · 1 heure',
      title: 'Voyance Générale',
      subtitle: 'Lecture personnelle approfondie · 1 heure',
      items: [
        '30 min d\'analyse de votre chemin de vie et situation actuelle (désirs profonds, conseils de vos guides, axes majeurs de votre avenir)',
        '30 min de questions libres, 3 questions ou plus selon le temps disponible',
        'Domaines abordés : sentimental, professionnel, proches'
      ],
      price: '80 €',
      modeLabel: 'À domicile · Nice'
    },
    'approfondie-domicile': {
      eyebrow: 'Formule 2 · 1h30',
      title: 'Voyance Approfondie',
      subtitle: 'Exploration détaillée de plusieurs domaines · 1h30',
      items: [
        '45 min d\'analyse complète : chemin de vie, blocages actuels, opportunités à venir',
        '45 min de questions libres en profondeur : sentimental, professionnel, évolution personnelle',
        'Idéale pour les situations complexes nécessitant plus de précision'
      ],
      price: '105 €',
      modeLabel: 'À domicile · Nice'
    },
    'complete-domicile': {
      eyebrow: 'Formule 3 · 2 heures',
      title: 'Guidance Complète',
      subtitle: 'Séance immersive et exhaustive · 2 heures',
      items: [
        '1h d\'analyse approfondie : chemin de vie, cycles actuels, influences à venir',
        '1h de questions libres : toutes vos interrogations, situations concernant vos proches',
        'Format complet pour une compréhension fine de votre situation globale'
      ],
      price: '145 €',
      modeLabel: 'À domicile · Nice'
    },
    'libre-domicile': {
      eyebrow: 'Formule 4 · 1h30',
      title: 'Voyance Libre',
      subtitle: 'Séance entièrement personnalisée · 1h30',
      items: [
        'Contenu 100% libre et défini selon vos souhaits du moment',
        'Réponses à vos questions, analyse d\'une situation précise, guidance générale',
        'Exploration sentimentale, professionnelle ou toute autre demande',
        'Idéale pour les consultants réguliers'
      ],
      price: '105 €',
      modeLabel: 'À domicile · Nice'
    },
    'generale-telephone': {
      eyebrow: 'Formule 1 · 1 heure',
      title: 'Voyance Générale',
      subtitle: 'Lecture personnelle approfondie · 1 heure',
      items: [
        '30 min d\'analyse de votre chemin de vie et de votre situation actuelle',
        '30 min de questions libres, 3 questions ou plus selon le temps disponible',
        'Accessible depuis toute la France'
      ],
      price: '70 €',
      modeLabel: 'Par téléphone · France entière'
    },
    'approfondie-telephone': {
      eyebrow: 'Formule 2 · 1h30',
      title: 'Voyance Approfondie',
      subtitle: 'Exploration détaillée · 1h30',
      items: [
        '45 min d\'analyse complète : chemin de vie, blocages, opportunités',
        '45 min de questions libres en profondeur',
        'Même qualité d\'écoute et de précision qu\'une séance en présentiel'
      ],
      price: '95 €',
      modeLabel: 'Par téléphone · France entière'
    },
    'complete-telephone': {
      eyebrow: 'Formule 3 · 2 heures',
      title: 'Guidance Complète',
      subtitle: 'Séance immersive · 2 heures',
      items: [
        '1h d\'analyse approfondie du chemin de vie et des cycles en cours',
        '1h de questions libres : toutes vos interrogations',
        'La formule la plus exhaustive accessible partout en France'
      ],
      price: '135 €',
      modeLabel: 'Par téléphone · France entière'
    },
    'libre-telephone': {
      eyebrow: 'Formule 4 · 1h30',
      title: 'Voyance Libre',
      subtitle: 'Séance 100% personnalisée · 1h30',
      items: [
        'Contenu entièrement libre selon vos besoins du moment',
        'Réponses à vos questions, analyse d\'une situation précise ou guidance générale',
        'Souplesse maximale pour les consultants réguliers'
      ],
      price: '95 €',
      modeLabel: 'Par téléphone · France entière'
    },
   'flash-telephone': {
       eyebrow: 'Formule Express · 30 min',
       title: 'Le Tirage Flash',
       subtitle: 'Une réponse claire · 30 minutes chrono',
       items: [
         'Une question brûlante ou deux sujets précis',
         'Tirage Tarot de Marseille ciblé et lecture directe',
         'Réponse sans détour, sans superflu',
         'Règlement par virement avant la séance'
       ],
       price: '40 €',
       modeLabel: 'Par téléphone · France entière'
  },
   'evenements-domicile': {
    eyebrow: 'Sur devis · Déplacement inclus',
    title: 'Voyance & Événements',
    subtitle: 'Côte d\'Azur · Nice & environs · 15 km',
    items: [
      'Tirages individuels ou animation de groupe',
      'EVJF, anniversaires, soirées privées, mariages',
      'Séminaires, team building, événements corporate',
      'Déplacement inclus dans un rayon de 15 km',
      'Tarif sur devis selon durée et nombre de participants'
    ],
    price: 'Sur devis',
    modeLabel: 'À domicile · Nice, Monaco, Antibes, Cannes et environs'
  }
  };

  const modal = document.getElementById('prestation-modal');
  const modalEyebrow = document.getElementById('modal-eyebrow');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');
  const modalPrice = document.getElementById('modal-price');

  function openModal(key) {
    const data = prestationDetails[key];
    if (!data || !modal) return;
    modalEyebrow.textContent = data.eyebrow;
    modalTitle.textContent = data.title;
    modalBody.innerHTML =
      `<span class="modal-subtitle">${data.subtitle}</span>` +
      '<ul>' + data.items.map(i => `<li>${i}</li>`).join('') + '</ul>';
    modalPrice.innerHTML = `${data.price}<small>${data.modeLabel}</small>`;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  }

  document.querySelectorAll('.btn-details').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      openModal(btn.dataset.prestation);
    });
  });

  document.querySelectorAll('[data-close-modal]').forEach(el => {
    el.addEventListener('click', closeModal);
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal?.classList.contains('is-open')) closeModal();
  });

  // ─── FORMULAIRE DE CONTACT (Formspree) ───────────────
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', async e => {
      e.preventDefault();

      const nom = document.getElementById('form-nom').value.trim();
      const email = document.getElementById('form-email').value.trim();
      const message = document.getElementById('form-message').value.trim();

      if (!nom || !email || !message) {
        alert('Merci de remplir au moins votre nom, votre email et votre message.');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        alert('Votre adresse email ne semble pas valide.');
        return;
      }

      const btn = contactForm.querySelector('button[type="submit"]');
      const btnText = btn.querySelector('span');
      const originalText = btnText.textContent;
      btnText.textContent = 'Envoi en cours…';
      btn.disabled = true;

      try {
        const response = await fetch(contactForm.action, {
          method: 'POST',
          body: new FormData(contactForm),
          headers: { 'Accept': 'application/json' }
        });

        if (response.ok) {
          contactForm.reset();
          btnText.textContent = '✓ Message envoyé !';
          setTimeout(() => {
            btnText.textContent = originalText;
            btn.disabled = false;
          }, 4000);
        } else {
          throw new Error('Erreur envoi');
        }
      } catch (err) {
        alert('Une erreur est survenue. Merci de réessayer ou de me contacter directement par téléphone.');
        btnText.textContent = originalText;
        btn.disabled = false;
      }
    });
  }

  // ─── SCROLL REVEAL ───────────────────────────────────
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const delay = parseInt(entry.target.dataset.delay || '0', 10);
          setTimeout(() => entry.target.classList.add('is-visible'), delay);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-visible'));
  }

  // ─── COMPTEURS ANIMÉS ───────────────────────────────
  const counters = document.querySelectorAll('.trust-num[data-count]');
  if (counters.length && 'IntersectionObserver' in window) {
    const co = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.dataset.count, 10);
          const suffix = el.dataset.suffix || '';
          const duration = 1800;
          const start = performance.now();
          function tick(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            // easeOutCubic
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.floor(target * eased) + suffix;
            if (progress < 1) requestAnimationFrame(tick);
            else el.textContent = target + suffix;
          }
          requestAnimationFrame(tick);
          co.unobserve(el);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(c => co.observe(c));
  }

  // ─── SCROLL DOUX POUR ANCRES ────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const href = a.getAttribute('href');
      if (href === '#' || href.length <= 1) return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const headerH = document.querySelector('.site-header')?.offsetHeight || 0;
        const y = target.getBoundingClientRect().top + window.scrollY - headerH + 1;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    });
  });

})();
