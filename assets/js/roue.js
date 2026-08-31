/* ═══════════════════════════════════════════════════════════
   NATACHA LAURE VOYANCE — ROUE DES CADEAUX
   Widget autonome : il fabrique lui-même tout son HTML.
   Pour l'activer sur une page, UNE SEULE LIGNE suffit :
     <script src="/assets/js/roue.js" defer></script>

   ⚠️  UN SEUL RÉGLAGE À FAIRE : la ligne API ci-dessous.
       - Laissée vide  → MODE DÉMONSTRATION (la roue tourne, aucun
         email n'est envoyé, aucune adresse n'est enregistrée).
       - Remplie       → mode réel.
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var CONFIG = {
    /* ══ RÉGLAGE 1 — QUI VOIT LA ROUE ? ═════════════════════
       PRIVE: true   → PERSONNE ne la voit, SAUF toi en ajoutant
                       ?roue=1 à la fin de l'adresse. Par exemple :
                       https://natachalaurevoyance.fr/?roue=1
                       C'est la valeur livrée : tu peux uploader sans
                       aucun risque, tes visiteurs ne verront rien.
       PRIVE: false  → la roue est visible par tout le monde.
                       ⚠️ À ne passer à false QU'UNE FOIS le serveur
                       branché (réglage 2), sinon tes visiteurs
                       gagnent des lots qu'ils ne reçoivent jamais. */
    PRIVE: true,

    /* ══ RÉGLAGE 2 — LE SERVEUR ═════════════════════════════
       Vide          → mode démonstration : la roue tourne, mais aucun
                       email n'est envoyé et aucune adresse enregistrée.
       Rempli        → en service : une adresse = un tour, email envoyé. */
    API: 'https://aurea.natachalaurevoyance.fr/api/roue',

    CSS: '/assets/css/roue.css',
    DELAI_BUREAU: 5000,      // ms avant l'ouverture automatique sur ordinateur
    DELAI_MOBILE: 3500,      // ms avant l'apparition du bandeau sur téléphone
    DUREE_SPIN: 5400,        // ms de rotation
    LIEN_AUREA: 'https://aurea.natachalaurevoyance.fr/?jeu=roue',
    LIEN_RDV: '/#contact',
    LIEN_REGLEMENT: '/reglement-jeu/',
    LIEN_CONFIDENTIALITE: '/confidentialite/',
    CLE_VUE: 'nlv_roue_vue_v1',
    // Le pop-up automatique peut être désactivé page par page, en ajoutant
    // data-popup="non" sur la balise <script>. Le bouton 🎁 reste, lui.
    POPUP_AUTO: (function () {
      var b = document.currentScript;
      return !(b && b.getAttribute('data-popup') === 'non');
    })(),
    CLE_GAIN: 'nlv_roue_gain_v1'
  };

  /* ─── LES 6 LOTS ─────────────────────────────────────────
     L'ordre du tableau = l'ordre des parts SUR la roue
     (part 0 en haut, puis dans le sens des aiguilles).
     "poids" = fréquence relative. Total = 100.
     Du plus courant au plus rare :
       5 crédits 34 · tirage+2 crédits 26 · bon 10 € 18
       · question 12 · −20 % 8 · 30 min offertes 2
  ─────────────────────────────────────────────────────────*/
  var LOTS = [
    {
      cle: 'bon10',
      image: '/assets/images/roue/bon10.webp',
      poids: 18,
      lignes: [['BON DE', 17], ['10 €', 23]],
      fond: 'sombre',
      emoji: '🎟️',
      nom: 'Un bon de 10 €',
      desc: 'Un bon de 10 € à faire valoir sur votre prochaine réservation de consultation, quelle que soit la formule choisie.',
      cta: 'Réserver ma consultation',
      lien: CONFIG.LIEN_RDV
    },
    {
      cle: 'credits5',
      image: '/assets/images/roue/credits5.webp',
      poids: 34,
      lignes: [['5 CRÉDITS', 16], ['AURÉA', 19]],
      fond: 'clair',
      emoji: '🔮',
      nom: '5 crédits sur Auréa',
      desc: 'Cinq lectures personnalisées offertes dans Auréa, mon application de tirage de tarot. De quoi explorer plusieurs questions en profondeur.',
      cta: 'Découvrir Auréa',
      lien: CONFIG.LIEN_AUREA
    },
    {
      cle: 'question',
      image: '/assets/images/roue/question.webp',
      poids: 12,
      lignes: [['1 QUESTION', 15], ['OFFERTE', 18]],
      fond: 'sombre',
      emoji: '✦',
      nom: 'Une question offerte',
      desc: 'Une question supplémentaire offerte lors de votre prochaine consultation de voyance avec moi, en plus du temps prévu par votre formule.',
      cta: 'Prendre rendez-vous',
      lien: CONFIG.LIEN_RDV
    },
    {
      cle: 'tirage2c',
      image: '/assets/images/roue/tirage2c.webp',
      poids: 26,
      lignes: [['TIRAGE', 18], ['+ 2 CRÉDITS', 14]],
      fond: 'clair',
      emoji: '🃏',
      nom: 'Le Tirage en Croix affinée + 2 crédits',
      desc: 'Le tirage en Croix affinée (9 cartes) débloqué à vie dans Auréa, accompagné de 2 crédits pour vos premières lectures personnalisées.',
      cta: "Entrer dans l'univers Auréa",
      lien: CONFIG.LIEN_AUREA
    },
    {
      cle: 'remise20',
      image: '/assets/images/roue/remise20.webp',
      poids: 8,
      lignes: [['−20 %', 22], ['CONSULTATION', 11]],
      fond: 'sombre',
      emoji: '💫',
      nom: '20 % sur votre prochaine consultation',
      desc: 'Une remise de 20 % sur la consultation de votre choix, à domicile sur Nice et Saint-Laurent-du-Var ou par téléphone partout en France.',
      cta: 'Choisir ma formule',
      lien: CONFIG.LIEN_RDV
    },
    {
      cle: 'jackpot',
      image: '/assets/images/roue/jackpot.webp',
      poids: 2,
      lignes: [['★', 17], ['30 MIN', 18], ['OFFERTES', 13]],
      fond: 'jackpot',
      emoji: '👑',
      nom: 'Une demi-heure de voyance OFFERTE',
      desc: "Le plus beau lot de la roue. Trente minutes de consultation par téléphone entièrement offertes — un vrai Tirage Flash, rien qu'à vous, sans rien à payer.",
      cta: 'Réserver ma demi-heure offerte',
      lien: CONFIG.LIEN_RDV,
      jackpot: true
    }
  ];

  var NB = LOTS.length;
  var PART = 360 / NB;

  /* ─── Petits utilitaires ─────────────────────────────── */
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function lire(cle) { try { return localStorage.getItem(cle); } catch (e) { return null; } }
  function ecrire(cle, val) { try { localStorage.setItem(cle, val); } catch (e) {} }
  function estMobile() { return window.matchMedia('(max-width: 900px)').matches; }
  function emailValide(v) { return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(String(v).trim()); }
  function lotParCle(cle) {
    for (var i = 0; i < NB; i++) if (LOTS[i].cle === cle) return { lot: LOTS[i], index: i };
    return null;
  }

  /* ─── Son (généré, aucun fichier à téléverser) ───────── */
  var actx = null;
  function audio() {
    if (actx === null) {
      try { actx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { actx = false; }
    }
    return actx;
  }
  function bip(freq, duree, volume, type) {
    var a = audio(); if (!a) return;
    try {
      var o = a.createOscillator(), g = a.createGain();
      o.type = type || 'triangle';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, a.currentTime);
      g.gain.exponentialRampToValueAtTime(volume, a.currentTime + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + duree);
      o.connect(g); g.connect(a.destination);
      o.start(); o.stop(a.currentTime + duree + 0.02);
    } catch (e) {}
  }
  function sonTic() { bip(1180, 0.045, 0.055, 'square'); }
  function sonGain(jackpot) {
    var notes = jackpot ? [523, 659, 784, 1047, 1319, 1568] : [523, 659, 784, 1047];
    notes.forEach(function (f, i) {
      setTimeout(function () { bip(f, jackpot ? 0.5 : 0.38, 0.10, 'triangle'); }, i * (jackpot ? 115 : 130));
    });
    if (jackpot) setTimeout(function () { bip(2093, 1.1, 0.07, 'sine'); }, 780);
  }

  /* ─── Construction de la roue en SVG ─────────────────── */
  function pointXY(angle, r) {
    var rad = (angle - 90) * Math.PI / 180;
    return [(200 + r * Math.cos(rad)).toFixed(2), (200 + r * Math.sin(rad)).toFixed(2)];
  }

  function svgRoue() {
    var R = 186, parts = '', textes = '';
    for (var i = 0; i < NB; i++) {
      var a0 = i * PART, a1 = a0 + PART;
      var p0 = pointXY(a0, R), p1 = pointXY(a1, R);
      var fill = LOTS[i].fond === 'jackpot' ? 'url(#rdJack)'
               : LOTS[i].fond === 'clair' ? 'url(#rdClair)' : 'url(#rdSombre)';
      parts += '<path d="M200 200 L' + p0[0] + ' ' + p0[1] +
               ' A' + R + ' ' + R + ' 0 0 1 ' + p1[0] + ' ' + p1[1] + ' Z" fill="' + fill +
               '" stroke="#e0c088" stroke-width="1.6" stroke-opacity="0.55"/>';

      // Libellé : on tourne le texte pour qu'il soit lisible dans sa part
      var mid = a0 + PART / 2;
      var lignes = LOTS[i].lignes;
      var couleur = LOTS[i].fond === 'sombre' ? '#e8d3ab' : '#2a1c08';
      var y = 66;
      var bloc = '';
      for (var j = 0; j < lignes.length; j++) {
        bloc += '<text x="200" y="' + y + '" text-anchor="middle" fill="' + couleur +
                '" font-family="Cinzel, Georgia, serif" font-weight="700" font-size="' +
                lignes[j][1] + '" letter-spacing="0.5">' + lignes[j][0] + '</text>';
        y += lignes[j][1] + 7;
      }
      textes += '<g transform="rotate(' + mid + ' 200 200)">' + bloc + '</g>';
    }

    return '' +
      '<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<defs>' +
          '<linearGradient id="rdSombre" x1="0" y1="0" x2="0" y2="1">' +
            '<stop offset="0%" stop-color="#2b2117"/><stop offset="100%" stop-color="#150f0a"/>' +
          '</linearGradient>' +
          '<linearGradient id="rdClair" x1="0" y1="0" x2="0" y2="1">' +
            '<stop offset="0%" stop-color="#dcb26b"/><stop offset="100%" stop-color="#a9782f"/>' +
          '</linearGradient>' +
          '<radialGradient id="rdJack" cx="50%" cy="25%">' +
            '<stop offset="0%" stop-color="#fbe6b6"/><stop offset="60%" stop-color="#e6bd72"/>' +
            '<stop offset="100%" stop-color="#b07f2c"/>' +
          '</radialGradient>' +
          '<radialGradient id="rdCentre" cx="40%" cy="35%">' +
            '<stop offset="0%" stop-color="#3a2c1d"/><stop offset="100%" stop-color="#120d08"/>' +
          '</radialGradient>' +
        '</defs>' +
        '<circle cx="200" cy="200" r="196" fill="none" stroke="#b8843a" stroke-width="5" stroke-opacity="0.9"/>' +
        '<circle cx="200" cy="200" r="191" fill="none" stroke="#0e0b08" stroke-width="4"/>' +
        parts +
        textes +
        '<circle cx="200" cy="200" r="58" fill="url(#rdCentre)" stroke="#e0c088" stroke-width="2"/>' +
      '</svg>';
  }

  function svgAiguille() {
    return '<svg viewBox="0 0 34 46" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      '<defs><linearGradient id="rdNeedle" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="#f6e2b4"/><stop offset="100%" stop-color="#a9782f"/>' +
      '</linearGradient></defs>' +
      '<path d="M17 46 L2 12 A15 15 0 1 1 32 12 Z" fill="url(#rdNeedle)" stroke="#0e0b08" stroke-width="2"/>' +
      '<circle cx="17" cy="13" r="5" fill="#0e0b08"/></svg>';
  }

  /* ─── Le widget ──────────────────────────────────────── */
  var W = {
    monte: false,
    rotation: 0,
    enCours: false,
    joue: false,
    racine: null
  };

  function chargerCss() {
    if (document.querySelector('link[data-roue-css]')) return;
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = CONFIG.CSS;
    l.setAttribute('data-roue-css', '1');
    document.head.appendChild(l);
  }

  function construire() {
    if (W.monte) return;
    W.monte = true;
    chargerCss();

    var racine = el('div', 'rd-root');
    racine.innerHTML =
      '<div class="rd-overlay" role="dialog" aria-modal="true" aria-labelledby="rd-title">' +
        '<div class="rd-panel">' +
          '<button class="rd-close" type="button" aria-label="Fermer">✕</button>' +

          '<div class="rd-jeu">' +
            '<span class="rd-eyebrow">Cadeau de bienvenue</span>' +
            '<h2 class="rd-title" id="rd-title">La Roue des <em>Cadeaux</em></h2>' +
            '<p class="rd-sub">Six lots, <strong>aucune case perdante</strong>. Tentez votre chance :' +
              ' il y a forcément quelque chose pour vous à la clé.</p>' +
            '<div class="rd-divider"></div>' +

            '<div class="rd-stage">' +
              '<div class="rd-halo"></div>' +
              '<div class="rd-spinner">' + svgRoue() + '</div>' +
              '<div class="rd-needle">' + svgAiguille() + '</div>' +
              '<button class="rd-hub" type="button" aria-label="Faire tourner la roue">' +
                '<span>CLIQUEZ</span><span class="rd-hub-2">ICI</span>' +
              '</button>' +
            '</div>' +

            '<div class="rd-form">' +
              '<div class="rd-field">' +
                '<input type="email" class="rd-email" placeholder="Votre adresse email" ' +
                  'autocomplete="email" inputmode="email" aria-label="Votre adresse email">' +
                '<button class="rd-go" type="button">Je tente ma chance</button>' +
              '</div>' +
              '<label class="rd-consent">' +
                '<input type="checkbox" class="rd-optin">' +
                '<span>Je souhaite aussi recevoir occasionnellement les actualités et offres de ' +
                  'Natacha Laure Voyance. (facultatif)</span>' +
              '</label>' +
              '<div class="rd-error" role="alert"></div>' +
              '<p class="rd-legal">Votre email sert uniquement à vous envoyer votre lot. ' +
                'Une seule participation par adresse. ' +
                '<a href="' + CONFIG.LIEN_REGLEMENT + '">Règlement du jeu</a> · ' +
                '<a href="' + CONFIG.LIEN_CONFIDENTIALITE + '">Confidentialité</a></p>' +
              (CONFIG.API ? '' : '<p class="rd-demo">Mode démonstration — aucun email envoyé</p>') +
            '</div>' +
          '</div>' +

          '<div class="rd-prize">' +
            '<div class="rd-rays"></div>' +
            '<div class="rd-visuel"><img alt=""></div>' +
            '<div class="rd-medal"></div>' +
            '<p class="rd-won">Vous avez gagné</p>' +
            '<h3 class="rd-prize-name"></h3>' +
            '<p class="rd-prize-desc"></p>' +
            '<div class="rd-code-wrap"></div>' +
            '<a class="rd-cta" href="#"></a>' +
            '<div class="rd-spam">' +
              '<span class="rd-spam-ico">📬</span>' +
              '<span>Votre email arrive dans l’instant. S’il n’est pas dans votre ' +
              'boîte de réception, regardez dans les <strong>indésirables</strong> ' +
              'ou l’onglet <strong>Promotions</strong> — c’est souvent là qu’atterrit ' +
              'un premier message.</span>' +
            '</div>' +
            '<p class="rd-mailnote"></p>' +
          '</div>' +

        '</div>' +
      '</div>';

    document.body.appendChild(racine);
    W.racine = racine;

    var q = function (s) { return racine.querySelector(s); };
    W.overlay = q('.rd-overlay');
    W.spinner = q('.rd-spinner');
    W.needle = q('.rd-needle');
    W.hub = q('.rd-hub');
    W.email = q('.rd-email');
    W.optin = q('.rd-optin');
    W.go = q('.rd-go');
    W.field = q('.rd-field');
    W.erreur = q('.rd-error');
    W.jeu = q('.rd-jeu');
    W.prize = q('.rd-prize');

    q('.rd-close').addEventListener('click', fermer);
    W.overlay.addEventListener('click', function (e) { if (e.target === W.overlay) fermer(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && W.overlay.classList.contains('rd-open')) fermer();
    });
    W.go.addEventListener('click', lancer);
    W.hub.addEventListener('click', lancer);
    W.email.addEventListener('keydown', function (e) { if (e.key === 'Enter') lancer(); });
    W.email.addEventListener('input', function () { W.erreur.classList.remove('rd-on'); });
  }

  function ouvrir() {
    construire();
    document.body.classList.add('rd-lock');
    requestAnimationFrame(function () {
      W.overlay.classList.add('rd-open');
      var gain = lire(CONFIG.CLE_GAIN);
      if (gain) { afficherGainEnregistre(gain); }
      else { setTimeout(function () { try { W.email.focus({ preventScroll: true }); } catch (e) {} }, 550); }
    });
    ecrire(CONFIG.CLE_VUE, '1');
  }

  function fermer() {
    if (W.enCours) return;
    W.overlay.classList.remove('rd-open');
    document.body.classList.remove('rd-lock');
  }

  function erreur(msg) {
    W.erreur.innerHTML = msg;
    W.erreur.classList.add('rd-on');
  }

  function secouer() {
    W.field.classList.remove('rd-shake');
    void W.field.offsetWidth;
    W.field.classList.add('rd-shake');
  }

  /* ─── Tirage local (mode démonstration uniquement) ───── */
  function tirageLocal() {
    var total = 0, i;
    for (i = 0; i < NB; i++) total += LOTS[i].poids;
    var r = Math.random() * total, c = 0;
    for (i = 0; i < NB; i++) { c += LOTS[i].poids; if (r < c) return i; }
    return NB - 1;
  }

  /* ─── Lancement ──────────────────────────────────────── */
  function lancer() {
    if (W.enCours || W.joue) return;
    audio(); // autorise le son : on est dans un clic utilisateur

    var mail = (W.email.value || '').trim();
    if (!emailValide(mail)) {
      secouer();
      erreur('Merci d’indiquer une adresse email valide — c’est là que votre lot sera envoyé.');
      try { W.email.focus(); } catch (e) {}
      return;
    }

    W.erreur.classList.remove('rd-on');
    W.enCours = true;
    W.go.disabled = true;
    W.hub.disabled = true;
    W.go.textContent = 'Un instant…';

    if (!CONFIG.API) {
      // MODE DÉMONSTRATION
      setTimeout(function () {
        tourner(tirageLocal(), { code: 'DEMO-000000', demo: true });
      }, 450);
      return;
    }

    fetch(CONFIG.API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: mail, optin: !!W.optin.checked, source: 'site' })
    })
      .then(function (r) { return r.json().then(function (d) { return { statut: r.status, data: d }; }); })
      .then(function (res) {
        var d = res.data || {};
        if (res.statut === 200 && d.ok && d.lot) {
          var t = lotParCle(d.lot);
          if (!t) throw new Error('lot inconnu');
          tourner(t.index, { code: d.code || '', email: mail });
          return;
        }
        rendreLaMain();
        if (d.raison === 'deja_joue') {
          erreur('Cette adresse a déjà fait tourner la roue. Un seul tour par adresse — ' +
            'mais votre lot reste valable&nbsp;: il vous a été envoyé par email. ' +
            'S’il est introuvable, cherchez dans vos <strong>indésirables</strong> et ' +
            'dans l’onglet <strong>Promotions</strong>.');
        } else if (d.raison === 'trop_de_tentatives') {
          erreur('Trop de participations depuis cet appareil aujourd’hui. Réessayez demain.');
        } else if (d.raison === 'email_invalide') {
          erreur('Cette adresse email ne semble pas valide. Vérifiez la saisie.');
          secouer();
        } else {
          erreur('La roue n’a pas répondu. Réessayez dans un instant — si cela persiste, ' +
            'écrivez-moi et je vous attribue votre lot à la main.');
        }
      })
      .catch(function () {
        rendreLaMain();
        erreur('Connexion impossible. Vérifiez votre réseau et réessayez.');
      });
  }

  function rendreLaMain() {
    W.enCours = false;
    W.go.disabled = false;
    W.hub.disabled = false;
    W.go.textContent = 'Je tente ma chance';
  }

  function precharger(src) {
    if (!src) return;
    var i = new Image();
    i.src = src;
  }

  /* ─── L'animation de rotation ────────────────────────── */
  function tourner(index, extra) {
    // Le visuel du lot est chargé MAINTENANT, pendant les 5 s de rotation :
    // il est prêt au moment de la révélation, sans temps de chargement visible.
    precharger(LOTS[index].image);
    W.hub.innerHTML = '<span class="rd-hub-2">✦</span>';
    W.go.textContent = 'La roue tourne…';

    var mid = index * PART + PART / 2;
    var jitter = (Math.random() * 2 - 1) * (PART / 2 - 11); // ne sort jamais de la part
    var base = W.rotation;
    var reste = ((-mid - base) % 360 + 360) % 360;
    var cible = base + 360 * 6 + reste + jitter;

    var t0 = null, duree = CONFIG.DUREE_SPIN, dernierTic = Math.floor(base / PART);
    var recul = 14; // léger élan en arrière avant le départ

    function frame(t) {
      if (t0 === null) t0 = t;
      var e = t - t0, val;

      if (e < 420) {
        // élan : on recule doucement
        var p0 = e / 420;
        val = base - recul * Math.sin(p0 * Math.PI / 2);
      } else {
        var p = Math.min(1, (e - 420) / duree);
        var ease = 1 - Math.pow(1 - p, 4.2);
        val = (base - recul) + ((cible - (base - recul)) * ease);
        if (p >= 1) { finir(index, cible, extra); return; }
      }

      W.rotation = val;
      W.spinner.style.transform = 'rotate(' + val + 'deg)';

      var tic = Math.floor(val / PART);
      if (tic !== dernierTic) {
        dernierTic = tic;
        sonTic();
        W.needle.classList.remove('rd-tick');
        void W.needle.offsetWidth;
        W.needle.classList.add('rd-tick');
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function finir(index, cible, extra) {
    W.rotation = cible;
    W.spinner.style.transform = 'rotate(' + cible + 'deg)';
    W.enCours = false;
    W.joue = true;

    var lot = LOTS[index];
    setTimeout(function () {
      sonGain(!!lot.jackpot);
      confettis(lot.jackpot ? 140 : 70, !!lot.jackpot);
      afficherGain(lot, extra || {});
      if (!extra || !extra.demo) {
        ecrire(CONFIG.CLE_GAIN, JSON.stringify({
          cle: lot.cle, code: (extra && extra.code) || '', email: (extra && extra.email) || ''
        }));
      }
    }, 520);
  }

  /* ─── Écran de gain ──────────────────────────────────── */
  function afficherGain(lot, extra) {
    var q = function (s) { return W.racine.querySelector(s); };
    W.jeu.style.display = 'none';
    W.prize.classList.add('rd-on');
    if (lot.jackpot) W.prize.classList.add('rd-jackpot');

    q('.rd-medal').textContent = lot.emoji;
    q('.rd-won').textContent = lot.jackpot ? '✦ Le plus beau lot de la roue ✦' : 'Vous avez gagné';
    q('.rd-prize-name').textContent = lot.nom;
    q('.rd-prize-desc').textContent = lot.desc;

    // Le visuel remplace la médaille et le titre — l'affiche les porte déjà.
    // Si l'image ne se charge pas, on repasse automatiquement sur la médaille :
    // un lot doit toujours s'afficher, même sans image.
    var visuel = q('.rd-visuel'), img = visuel.querySelector('img');
    var medaille = q('.rd-medal'), titre = q('.rd-prize-name');
    function replierSurMedaille() {
      visuel.style.display = 'none';
      medaille.style.display = '';
      titre.style.display = '';
    }
    if (lot.image) {
      img.onload = function () {
        visuel.style.display = '';
        medaille.style.display = 'none';
        titre.style.display = 'none';
      };
      img.onerror = replierSurMedaille;
      img.alt = lot.nom;
      visuel.style.display = 'none';   // masqué tant que l'image n'est pas prête
      medaille.style.display = '';
      titre.style.display = '';
      img.src = lot.image;
      if (img.complete && img.naturalWidth) img.onload();
    } else {
      replierSurMedaille();
    }

    var wrap = q('.rd-code-wrap');
    if (extra.code && !extra.demo) {
      wrap.innerHTML = '<div class="rd-code"><small>Votre code</small>' + extra.code + '</div>';
    } else {
      wrap.innerHTML = '';
    }

    var cta = q('.rd-cta');
    cta.textContent = lot.cta;
    cta.href = lot.lien;
    cta.target = lot.lien.indexOf('http') === 0 ? '_blank' : '_self';
    cta.rel = 'noopener';
    if (lot.lien.indexOf('#') === 0 || lot.lien.indexOf('/#') === 0) {
      cta.addEventListener('click', function () { setTimeout(fermer, 60); });
    }

    var encadre = q('.rd-spam');
    if (encadre) encadre.style.display = extra.demo ? 'none' : '';

    q('.rd-mailnote').innerHTML = extra.demo
      ? '<strong>Mode démonstration.</strong> En conditions réelles, un email récapitulatif partirait immédiatement.'
      : 'Envoyé à <strong>' + (extra.email || 'votre adresse') +
        '</strong>. Conservez votre code&nbsp;: c’est lui qui vous identifie.';
  }

  function afficherGainEnregistre(brut) {
    var d;
    try { d = JSON.parse(brut); } catch (e) { return; }
    var t = lotParCle(d.cle);
    if (!t) return;
    W.joue = true;
    // on place la roue directement sur le lot déjà gagné
    W.rotation = -(t.index * PART + PART / 2);
    W.spinner.style.transform = 'rotate(' + W.rotation + 'deg)';
    afficherGain(t.lot, { code: d.code, email: d.email });
    W.racine.querySelector('.rd-won').textContent = 'Votre lot';
    W.racine.querySelector('.rd-mailnote').innerHTML =
      'Vous avez déjà fait tourner la roue. Votre lot reste valable — le récapitulatif est dans votre boîte mail.';
  }

  /* ─── Confettis ──────────────────────────────────────── */
  function confettis(nb, jackpot) {
    var couleurs = jackpot
      ? ['#e0c088', '#f6e2b4', '#cc9e58', '#b8843a', '#fff4d6']
      : ['#b8843a', '#cc9e58', '#e0c088', '#8a7060'];
    var box = el('div', 'rd-confetti');
    document.body.appendChild(box);
    for (var i = 0; i < nb; i++) {
      var c = el('span', 'rd-conf');
      var duree = 2.4 + Math.random() * 2.2;
      c.style.left = (Math.random() * 100) + 'vw';
      c.style.background = couleurs[(Math.random() * couleurs.length) | 0];
      c.style.setProperty('--rd-dx', ((Math.random() * 220) - 110) + 'px');
      c.style.setProperty('--rd-rot', ((Math.random() * 1080) - 540) + 'deg');
      c.style.animationDuration = duree + 's';
      c.style.animationDelay = (Math.random() * (jackpot ? 1.1 : 0.5)) + 's';
      if (Math.random() > 0.6) c.style.borderRadius = '50%';
      c.style.height = (8 + Math.random() * 10) + 'px';
      box.appendChild(c);
    }
    setTimeout(function () { if (box.parentNode) box.parentNode.removeChild(box); }, 6500);
  }

  /* ─── Bandeau mobile ─────────────────────────────────── */
  function bandeau() {
    chargerCss();
    var racine = el('div', 'rd-root');
    var t = el('div', 'rd-teaser');
    t.innerHTML =
      '<button class="rd-teaser-close" type="button" aria-label="Fermer">✕</button>' +
      '<span class="rd-teaser-icon">🎁</span>' +
      '<span class="rd-teaser-txt"><b>La Roue des Cadeaux</b>' +
        '<span>6 lots, aucune case perdante</span></span>' +
      '<button class="rd-teaser-go" type="button">Tenter</button>';
    racine.appendChild(t);
    document.body.appendChild(racine);
    requestAnimationFrame(function () { t.classList.add('rd-open'); });

    t.querySelector('.rd-teaser-go').addEventListener('click', function () {
      t.classList.remove('rd-open');
      ecrire(CONFIG.CLE_VUE, '1');
      ouvrir();
    });
    t.querySelector('.rd-teaser-close').addEventListener('click', function () {
      t.classList.remove('rd-open');
      ecrire(CONFIG.CLE_VUE, '1');
    });
  }

  /* ─── Bouton flottant permanent ──────────────────────── */
  function boutonFlottant() {
    chargerCss();
    var hote = document.querySelector('.floating-actions');
    var b = el('button', 'rd-float' + (hote ? '' : ' rd-float-solo'), '🎁');
    b.type = 'button';
    b.setAttribute('aria-label', 'Ouvrir la roue des cadeaux');
    b.addEventListener('click', ouvrir);
    if (hote) { hote.insertBefore(b, hote.firstChild); }
    else {
      var r = el('div', 'rd-root');
      r.appendChild(b);
      document.body.appendChild(r);
    }
  }

  /* ─── Démarrage ──────────────────────────────────────── */
  function autorisee() {
    if (!CONFIG.PRIVE) return true;
    // mode privé : uniquement avec ?roue=1 dans l'adresse.
    // Mémorisé pour la session, pour pouvoir naviguer d'une page à l'autre.
    try {
      if (/[?&]roue=1\b/.test(window.location.search)) {
        sessionStorage.setItem('nlv_roue_apercu', '1');
        return true;
      }
      return sessionStorage.getItem('nlv_roue_apercu') === '1';
    } catch (e) {
      return /[?&]roue=1\b/.test(window.location.search);
    }
  }

  function demarrer() {
    if (!autorisee()) return;         // roue en mode privé, visiteurs exclus

    boutonFlottant();

    if (!CONFIG.POPUP_AUTO) return;   // page où le pop-up est désactivé
    if (lire(CONFIG.CLE_VUE)) return; // déjà vue : on n'insiste pas

    if (estMobile()) {
      // ⚠️ Sur téléphone, PAS de pop-up plein écran à l'arrivée :
      // Google déclasse les pages qui couvrent le contenu juste après
      // une arrivée depuis ses résultats. Bandeau discret à la place.
      setTimeout(bandeau, CONFIG.DELAI_MOBILE);
    } else {
      setTimeout(ouvrir, CONFIG.DELAI_BUREAU);
    }
  }

  // point d'entrée public : window.RoueCadeaux.ouvrir()
  window.RoueCadeaux = { ouvrir: ouvrir, fermer: fermer };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', demarrer);
  } else {
    demarrer();
  }
})();
