/* ═══════════════════════════════════════════════════════════════
   TIRAGE EN CROIX — page d'accueil
   Cinq cartes face cachée, retournées une à une.
   Positions : 1 le passé · 2 l'avantage · 3 le blocage ·
               4 la situation actuelle · 5 conclusion.

   Quand les cinq sont retournées, le formulaire apparaît avec les
   cartes tirées en champs cachés : Natacha reçoit la croix exacte,
   dans l'ordre, avec la question et l'adresse de la personne.

   Les images ne sont chargées que pour les cinq cartes distribuées,
   et seulement quand la section arrive à l'écran. Sans JavaScript,
   le bloc reste lisible et renvoie vers /lecture-de-tirage/.

   Ce fichier est autonome : il ne dépend pas de main.js.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var sobre = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ═══ 1. LE TIRAGE ═══════════════════════════════════════════ */
  var tirage = document.querySelector('[data-tirage]');
  if (!tirage) return;

  var source = document.querySelector('script[data-arcanes]');
  var arcanes = [];
  try { arcanes = JSON.parse(source.textContent); } catch (e) { arcanes = []; }
  if (!arcanes.length) return;

  var cartes = [].slice.call(tirage.querySelectorAll('.carte'));
  var suite = document.querySelector('[data-tirage-suite]');
  var invite = document.querySelector('[data-tirage-invite]');
  var relancer = document.querySelector('[data-tirage-reset]');
  var champs = [].slice.call(document.querySelectorAll('[data-carte-tiree]'));
  var champRef = document.querySelector('[data-reference]');
  var visible = false;

  /* Référence courte, sans ambiguïté à la lecture : ni O ni I ni 0 ni 1.
     C'est elle qui relie le paiement à la demande reçue par e-mail. */
  function nouvelleReference() {
    var lettres = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    var r = '';
    for (var i = 0; i < 6; i++) r += lettres.charAt(Math.floor(Math.random() * lettres.length));
    return 'TC-' + r;
  }

  function urlCarte(id, largeur) { return '/assets/cartes/' + id + '-' + largeur + '.webp'; }

  /* Sur un téléphone à forte densité, le navigateur prendrait la grande
     image pour une carte de 150 px de large : 340 px y suffit largement. */
  function largeurCarte() {
    var grand = window.matchMedia('(min-width: 980px)').matches;
    return (grand && window.devicePixelRatio > 1.5) ? 620 : 340;
  }

  /* On ne précharge QUE la première carte, puis la suivante à chaque
     retournement : la plupart des visiteurs n'en retourneront aucune. */
  function prechargerUne(i) {
    var c = cartes[i];
    if (!c || !c.dataset.id) return;
    var img = new Image();
    img.src = urlCarte(c.dataset.id, largeurCarte());
  }

  function distribuer() {
    var pioche = arcanes.slice();
    cartes.forEach(function (c) {
      var a = pioche.splice(Math.floor(Math.random() * pioche.length), 1)[0];
      if (!a) return;
      c.dataset.id = a.id;
      c.dataset.nom = a.nom;
      c.dataset.num = a.num;
      var img = c.querySelector('.carte-face img');
      img.removeAttribute('src');
      img.alt = '';
      c.classList.remove('est-tiree');
      c.disabled = false;
    });
    champs.forEach(function (ch) { ch.value = ''; });
    if (champRef) champRef.value = nouvelleReference();
    if (suite) suite.hidden = true;
    if (invite) invite.hidden = false;
    var paiement = document.querySelector('[data-etape-paiement]');
    if (paiement) paiement.hidden = true;
    if (visible) prechargerUne(0);
  }

  function toutesRetournees() {
    return cartes.every(function (c) { return c.classList.contains('est-tiree'); });
  }

  function reveler(c) {
    if (c.classList.contains('est-tiree')) return;
    var img = c.querySelector('.carte-face img');
    img.src = urlCarte(c.dataset.id, largeurCarte());
    img.alt = c.dataset.num + ' — ' + c.dataset.nom;
    c.classList.add('est-tiree');

    var champ = document.querySelector('[data-carte-tiree="' + c.dataset.rang + '"]');
    if (champ) champ.value = c.dataset.num + ' — ' + c.dataset.nom;

    /* on prépare la suivante pendant que celle-ci se retourne */
    prechargerUne(cartes.indexOf(c) + 1);

    if (toutesRetournees()) {
      if (invite) invite.hidden = true;
      window.setTimeout(function () {
        if (!suite) return;
        suite.hidden = false;
        /* Le bloc était masqué quand la vigie d'apparition l'a observé :
           elle ne le révélera jamais toute seule. On le fait ici. */
        [].slice.call(suite.querySelectorAll('.reveal')).forEach(function (el) {
          el.classList.add('is-visible');
        });
        /* On ne saute pas à la section : la personne finit de regarder
           sa croix et descendra d'elle-même. */
      }, sobre ? 0 : 750);
    }
  }

  cartes.forEach(function (c) {
    c.addEventListener('click', function () { reveler(c); });
  });

  if (relancer) {
    relancer.addEventListener('click', function () {
      distribuer();
      tirage.scrollIntoView({ behavior: sobre ? 'auto' : 'smooth', block: 'center' });
    });
  }

  distribuer();

  if ('IntersectionObserver' in window) {
    var guet = new IntersectionObserver(function (entrees) {
      if (!entrees[0].isIntersecting) return;
      visible = true; prechargerUne(0); guet.disconnect();
    }, { rootMargin: '200px' });
    guet.observe(tirage);
  } else {
    visible = true; prechargerUne(0);
  }

  /* ═══ 2. LE FORMULAIRE ═══════════════════════════════════════
     Envoi en AJAX, sans quitter la page : la personne garde sa croix
     sous les yeux. Puis, si un lien de paiement est configuré,
     l'étape de règlement apparaît juste en dessous.
     ═════════════════════════════════════════════════════════════ */
  var form = document.querySelector('[data-form-croix]');
  if (!form) return;

  var statut = form.querySelector('.croix-statut');
  var bouton = form.querySelector('[type="submit"]');
  var libelle = bouton ? bouton.querySelector('span') : null;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.reportValidity()) return;

    var okMsg = form.getAttribute('data-ok') || 'Merci, c’est bien arrivé.';
    var koMsg = form.getAttribute('data-ko') ||
                'L’envoi a échoué. Réessayez, ou écrivez-moi directement.';
    var texteInitial = libelle ? libelle.textContent : '';

    if (bouton) { bouton.disabled = true; }
    if (libelle) { libelle.textContent = 'Envoi en cours…'; }
    if (statut) { statut.textContent = ''; statut.className = 'croix-statut'; }

    /* form.reset() effacera les champs cachés : on garde la référence. */
    var refEnvoyee = champRef ? champRef.value : '';

    fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { Accept: 'application/json' }
    })
      .then(function (r) {
        if (!r.ok) throw new Error('http');
        form.reset();
        if (statut) { statut.textContent = okMsg; statut.className = 'croix-statut est-ok'; }

        var paiement = document.querySelector('[data-etape-paiement]');
        if (!paiement) return;
        var vu = paiement.querySelector('[data-reference-affichee]');
        if (vu && refEnvoyee) vu.textContent = refEnvoyee;
        /* La référence voyage jusqu'à Stripe dans l'adresse : c'est elle
           qui relie le paiement à la demande reçue par e-mail. */
        var lien = paiement.querySelector('[data-lien-paiement]');
        if (lien && refEnvoyee) {
          var url = lien.getAttribute('data-lien-paiement');
          lien.href = url + (url.indexOf('?') === -1 ? '?' : '&') +
                      'client_reference_id=' + encodeURIComponent(refEnvoyee);
        }
        paiement.hidden = false;
      })
      .catch(function () {
        if (statut) { statut.textContent = koMsg; statut.className = 'croix-statut est-ko'; }
      })
      .then(function () {
        if (bouton) bouton.disabled = false;
        if (libelle) libelle.textContent = texteInitial;
      });
  });
})();
