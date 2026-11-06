/* ───────────────────────────────────────────────────────────────
   PROVENANCE — d'où vient le visiteur ?

   Natacha Laure a deux sites qui mènent tous les deux à Auréa :
     natachalaurevoyance.fr  (France)   → ?site=fr  ou rien
     tarot-events.ch         (Suisse)   → ?site=ch

   Ce fichier fait trois choses sur les pages Auréa du site :
     1. il retient le site d'origine, même quand le paramètre disparaît
        de l'adresse au fil de la navigation ;
     2. il fait pointer les boutons « retour au site » vers le BON site ;
     3. il transmet le marqueur aux liens vers l'application, pour que
        celle-ci puisse faire la même chose de son côté.

   SÉCURITÉ — on ne lit jamais une adresse complète dans le paramètre.
   Un `?retour=https://nimportequoi.com` transformerait le site en
   passerelle de redirection, utilisable pour du hameçonnage. Seuls les
   codes courts de la liste ci-dessous sont acceptés ; tout le reste est
   ignoré et on retombe sur le site français.
   ─────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  var SITES = {
    fr: { url: 'https://natachalaurevoyance.fr/', nom: 'Natacha Laure Voyance' },
    ch: { url: 'https://tarot-events.ch/',        nom: 'Natacha Laure · Tarot Events' }
  };
  var DEFAUT = 'fr';
  var CLE = 'site-origine';

  /* ---- Quel site ? ---- */
  var code = null;
  try {
    code = new URLSearchParams(window.location.search).get('site');
  } catch (e) { /* très vieux navigateur : on reste sur le défaut */ }

  if (code && SITES[code]) {
    try { window.sessionStorage.setItem(CLE, code); } catch (e) {}
  } else {
    try { code = window.sessionStorage.getItem(CLE); } catch (e) { code = null; }
  }
  if (!code || !SITES[code]) code = DEFAUT;

  /* Rien à faire si l'on vient du site français : c'est déjà le défaut. */
  if (code === DEFAUT) return;

  var site = SITES[code];

  function auChargement(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else { fn(); }
  }

  auChargement(function () {
    /* 1. Les retours vers le site : « / » et « https://natachalaurevoyance.fr/ » */
    var retours = document.querySelectorAll(
      'a[href="/"], a[href="https://natachalaurevoyance.fr/"], a[href="https://natachalaurevoyance.fr"]'
    );
    Array.prototype.forEach.call(retours, function (a) {
      a.href = site.url;
      a.setAttribute('rel', 'noopener');
      /* on remplace le nom du site dans le libellé, en gardant la flèche */
      if (a.textContent.indexOf('Natacha Laure') !== -1) {
        a.textContent = a.textContent.replace('Natacha Laure Voyance', site.nom);
      }
    });

    /* 2. Les liens internes des pages Auréa gardent le marqueur */
    var internes = document.querySelectorAll('a[href^="/aurea/"]');
    Array.prototype.forEach.call(internes, function (a) {
      var h = a.getAttribute('href');
      if (h.indexOf('site=') !== -1) return;
      a.setAttribute('href', h + (h.indexOf('?') === -1 ? '?' : '&') + 'site=' + code);
    });

    /* 3. Les liens vers l'application la préviennent à son tour */
    var versAppli = document.querySelectorAll('a[href*="aurea.natachalaurevoyance.fr"]');
    Array.prototype.forEach.call(versAppli, function (a) {
      var h = a.getAttribute('href');
      if (h.indexOf('site=') !== -1) return;
      a.setAttribute('href', h + (h.indexOf('?') === -1 ? '?' : '&') + 'site=' + code);
    });
  });
})();
