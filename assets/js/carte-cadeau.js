/* ═══════════════════════════════════════════════════════════
   CARTE CADEAU — formulaire + aperçu en direct
   Page : /carte-cadeau/
   ⚠️ UN SEUL RÉGLAGE : la ligne API ci-dessous.
      Vide → mode démonstration (rien n'est envoyé).
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var CONFIG = {
    API: 'https://aurea.natachalaurevoyance.fr/api/carte-cadeau',
    DELAI: '48 h'
  };

  /* Les formules, alignées sur les tarifs du site.
     prix = { domicile, distance }. Un seul chiffre = tarif unique. */
  var FORMULES = [
    { cle: 'flash',       nom: 'Tirage Flash',                 duree: '30 minutes',       domicile: 40,  distance: 40 },
    { cle: 'generale',    nom: 'Voyance Générale',             duree: '1 heure',          domicile: 80,  distance: 70 },
    { cle: 'approfondie', nom: 'Voyance Approfondie',          duree: '1 h 30',           domicile: 105, distance: 95 },
    { cle: 'guidance',    nom: 'Guidance Complète',            duree: '2 heures',         domicile: 145, distance: 135 },
    { cle: 'libre',       nom: 'Voyance Libre',                duree: '1 h 30',           domicile: 105, distance: 95 },
    { cle: 'cours',       nom: "Cours d'initiation au tarot",  duree: '1 heure',          domicile: 45,  distance: 40 },
    { cle: 'montant',     nom: 'Un montant libre',             duree: 'à vous de choisir', domicile: null, distance: null }
  ];

  var $ = function (id) { return document.getElementById(id); };
  var form = $('cc-form');
  if (!form) return;

  var etat = { formule: null, mode: 'distance' };

  /* ─── Construction de la liste des formules ─────────────── */
  function dessinerFormules() {
    var hote = $('cc-formules');
    hote.innerHTML = '';
    FORMULES.forEach(function (f) {
      var l = document.createElement('label');
      l.className = 'cc-formule';
      l.setAttribute('data-cle', f.cle);
      l.innerHTML =
        '<input type="radio" name="cc-formule" value="' + f.cle + '">' +
        '<span class="cc-f-txt">' +
          '<span class="cc-f-nom">' + f.nom + '</span>' +
          '<span class="cc-f-duree">' + f.duree + '</span>' +
        '</span>' +
        '<span class="cc-f-prix" data-prix></span>';
      hote.appendChild(l);
      l.querySelector('input').addEventListener('change', function () {
        etat.formule = f.cle;
        majActifs();
        majPrix();
        majApercu();
        $('cc-libre').hidden = (f.cle !== 'montant');
        $('cc-bloc-mode').hidden = (f.cle === 'montant');
      });
    });
    majPrix();
  }

  function majActifs() {
    [].forEach.call(document.querySelectorAll('.cc-formule'), function (l) {
      l.classList.toggle('cc-actif', l.getAttribute('data-cle') === etat.formule);
    });
  }

  /* Le prix affiché suit le mode choisi : on ne montre jamais deux
     chiffres au visiteur, il choisit d'abord et voit le sien. */
  function majPrix() {
    [].forEach.call(document.querySelectorAll('.cc-formule'), function (l) {
      var f = trouver(l.getAttribute('data-cle'));
      var cible = l.querySelector('[data-prix]');
      if (!f || f.domicile === null) { cible.textContent = '—'; return; }
      if (etat.mode === 'libre' && f.domicile !== f.distance) {
        cible.textContent = f.distance + '–' + f.domicile + ' €';
      } else {
        cible.textContent = (etat.mode === 'domicile' ? f.domicile : f.distance) + ' €';
      }
    });
  }

  function trouver(cle) {
    for (var i = 0; i < FORMULES.length; i++) if (FORMULES[i].cle === cle) return FORMULES[i];
    return null;
  }

  function montantChoisi() {
    var f = trouver(etat.formule);
    if (!f) return null;
    if (f.cle === 'montant') {
      var v = parseInt($('cc-montant').value, 10);
      return isNaN(v) ? null : v;
    }
    if (etat.mode === 'domicile') return f.domicile;
    if (etat.mode === 'distance') return f.distance;
    return f.distance; // « le destinataire choisira » : on part du tarif à distance
  }

  /* ─── Aperçu en direct ──────────────────────────────────── */
  function majApercu() {
    var dest = ($('cc-destinataire').value || '').trim();
    var offr = ($('cc-offrant').value || '').trim();
    var mot  = ($('cc-mot').value || '').trim();
    var f    = trouver(etat.formule);

    $('cc-p-dest').textContent = dest || '…';
    $('cc-p-offrant').textContent = offr || '…';
    $('cc-p-mot').textContent = mot ? '« ' + mot + ' »' : '';

    if (!f) { $('cc-p-formule').textContent = 'Choisissez une formule'; return; }
    if (f.cle === 'montant') {
      var m = montantChoisi();
      $('cc-p-formule').textContent = m ? 'Un bon de ' + m + ' €' : 'Un montant libre';
    } else {
      var m2 = montantChoisi();
      $('cc-p-formule').textContent = f.nom + (m2 ? ' · ' + m2 + ' €' : '');
    }
  }

  /* ─── Validation ────────────────────────────────────────── */
  function emailValide(v) { return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(String(v).trim()); }

  function verifier() {
    if (!etat.formule) return 'Choisissez d’abord la formule que vous souhaitez offrir.';
    if (etat.formule === 'montant') {
      var m = montantChoisi();
      if (m === null) return 'Indiquez le montant que vous souhaitez offrir.';
      if (m < 20 || m > 500) return 'Le montant doit être compris entre 20 € et 500 €.';
    }
    if (!$('cc-destinataire').value.trim()) return 'Indiquez le prénom de la personne à qui vous offrez cette carte.';
    if (!$('cc-offrant').value.trim()) return 'Indiquez votre prénom, il figurera sur la carte.';
    if (!emailValide($('cc-email').value)) return 'Indiquez une adresse email valide — c’est là que je vous répondrai.';
    if (!$('cc-rgpd').checked) return 'Merci de cocher la case d’acceptation pour que je puisse traiter votre demande.';
    return null;
  }

  function erreur(msg) {
    var e = $('cc-erreur');
    if (!msg) { e.classList.remove('cc-on'); return; }
    e.textContent = msg;
    e.classList.add('cc-on');
    e.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  /* ─── Envoi ─────────────────────────────────────────────── */
  function envoyer() {
    var souci = verifier();
    if (souci) { erreur(souci); return; }
    erreur(null);

    if ($('cc-pot').value) { return; } // robot : on ne dit rien, on n'envoie rien

    var f = trouver(etat.formule);
    var donnees = {
      formule: f.cle,
      formule_nom: f.nom,
      montant: montantChoisi(),
      mode: etat.formule === 'montant' ? 'libre' : etat.mode,
      destinataire: $('cc-destinataire').value.trim(),
      offrant: $('cc-offrant').value.trim(),
      occasion: $('cc-occasion').value,
      mot: $('cc-mot').value.trim(),
      email: $('cc-email').value.trim(),
      telephone: $('cc-tel').value.trim(),
      optin: $('cc-optin').checked
    };

    var bouton = $('cc-envoyer');
    bouton.disabled = true;
    bouton.querySelector('span').textContent = 'Envoi en cours…';

    if (!CONFIG.API) {
      setTimeout(function () { confirmer(donnees, true); }, 500);
      return;
    }

    fetch(CONFIG.API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(donnees)
    })
      .then(function (r) { return r.json().then(function (d) { return { s: r.status, d: d }; }); })
      .then(function (res) {
        if (res.s === 200 && res.d.ok) { confirmer(donnees, false, res.d.reference); return; }
        rendreLaMain();
        if (res.d.raison === 'trop_de_demandes') {
          erreur('Vous avez déjà envoyé plusieurs demandes aujourd’hui. Si c’est une erreur, écrivez-moi directement à natachalaure.voyance@gmail.com.');
        } else if (res.d.raison === 'email_invalide') {
          erreur('Cette adresse email ne semble pas valide. Vérifiez la saisie.');
        } else {
          erreur('Votre demande n’a pas pu être transmise. Réessayez dans un instant, ou écrivez-moi à natachalaure.voyance@gmail.com.');
        }
      })
      .catch(function () {
        rendreLaMain();
        erreur('Connexion impossible. Vérifiez votre réseau et réessayez.');
      });
  }

  function rendreLaMain() {
    var b = $('cc-envoyer');
    b.disabled = false;
    b.querySelector('span').textContent = 'Envoyer ma demande';
  }

  function confirmer(d, demo, reference) {
    $('cc-form').hidden = true;
    document.querySelector('.cc-apercu-col').hidden = true;
    document.querySelector('.cc-sub').hidden = true;
    var m = $('cc-merci');
    m.hidden = false;
    $('cc-merci-txt').innerHTML = demo
      ? '<strong>Mode démonstration</strong> — en conditions réelles, votre demande serait transmise et un email de confirmation partirait immédiatement.'
      : 'Merci ' + echapper(d.offrant) + '. Je prépare la carte de <strong>' +
        echapper(d.destinataire) + '</strong> et je vous écris sous <strong>' +
        CONFIG.DELAI + '</strong> avec les modalités de règlement.' +
        (reference ? '<br><small>Référence de votre demande : <strong>' + echapper(reference) + '</strong></small>' : '');
    m.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function echapper(t) {
    return String(t).replace(/[<>&"]/g, function (c) {
      return { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c];
    });
  }

  /* ─── Branchements ──────────────────────────────────────── */
  dessinerFormules();

  [].forEach.call(document.querySelectorAll('input[name="mode"]'), function (r) {
    r.addEventListener('change', function () {
      etat.mode = r.value;
      majPrix();
      majApercu();
    });
  });

  ['cc-destinataire', 'cc-offrant', 'cc-mot', 'cc-montant'].forEach(function (id) {
    $(id).addEventListener('input', majApercu);
  });

  $('cc-mot').addEventListener('input', function () {
    $('cc-compteur').textContent = $('cc-mot').value.length;
  });

  $('cc-envoyer').addEventListener('click', envoyer);
  form.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') { e.preventDefault(); envoyer(); }
  });

  majApercu();
})();
