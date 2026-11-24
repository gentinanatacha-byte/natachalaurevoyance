/* ═══════════════════════════════════════════════════════════════════
   INSCRIPTIONS AUX JOURNÉES DE FORMATION
   natachalaurevoyance.fr — 24.11.2026

   Affiche les dates, enregistre les inscriptions et les demandes de
   nouvelles dates. Le site étant statique, le navigateur parle
   directement à Supabase.

   ⚠ RIEN À REMPLIR DANS CE FICHIER.
     L'URL et la clé sont dans assets/js/formation-config.js, qui est
     chargé juste avant. C'est le seul que tu modifies, et je ne le
     remplacerai jamais.
   ═══════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const zone   = document.getElementById('fo-sessions');
  const zoneD  = document.getElementById('fo-demande');
  const zoneP  = document.getElementById('fo-demande-pro');
  if (!zone && !zoneD && !zoneP) return;

  const cfg = window.NLV_SUPABASE || {};
  const URL_SB = (cfg.url || '').replace(/\/+$/, '');
  const CLE_SB = cfg.cle || '';

  function stop(texte) {
    if (zone)  zone.innerHTML  = '<p class="fo-chargement">' + texte + '</p>';
    if (zoneD) zoneD.innerHTML = '';
    if (zoneP) zoneP.innerHTML = '';
  }

  if (!URL_SB || !CLE_SB || /COLLE_ICI|XXXX/.test(URL_SB + CLE_SB)) {
    stop('Les dates seront affichées ici dès que la connexion sera en place.');
    return;
  }

  /* GARDE-FOU : une clé secrète n'a rien à faire dans un navigateur. */
  if (/^sb_secret_/.test(CLE_SB) || /service_role/.test(CLE_SB)) {
    stop('Configuration à corriger : la clé utilisée est une clé secrète. ' +
         'Remplacez-la par la clé « publishable ».');
    if (window.console) {
      console.error('formation-config.js : clé SECRÈTE détectée. Utiliser la ' +
                    'clé publishable, jamais la secrète.');
    }
    return;
  }

  /* Les clés récentes (sb_publishable_…) se placent dans l'en-tête
     « apikey » seulement ; les anciennes clés anon sont des JWT (eyJ…)
     et acceptent en plus Authorization. On s'adapte, et en cas de refus
     on retente une fois avec l'autre combinaison. */
  const cleJWT = /^eyJ/.test(CLE_SB);

  function entetes(avecAuth) {
    const h = { 'apikey': CLE_SB, 'Content-Type': 'application/json' };
    if (avecAuth) h['Authorization'] = 'Bearer ' + CLE_SB;
    return h;
  }

  function appel(chemin, options, avecAuth) {
    if (avecAuth === undefined) avecAuth = cleJWT;
    const o = Object.assign({}, options);
    o.headers = Object.assign(entetes(avecAuth), options.extraHeaders || {});
    delete o.extraHeaders;
    return fetch(URL_SB + chemin, o).then(function (r) {
      if ((r.status === 401 || r.status === 403) && avecAuth === cleJWT) {
        return appel(chemin, options, !cleJWT);
      }
      return r;
    });
  }

  /* ─── petits outils ─────────────────────────────────────────── */

  const fmtJour = new Intl.DateTimeFormat('fr-FR',
    { weekday: 'long', day: 'numeric', month: 'long' });

  function echapper(t) {
    const d = document.createElement('div');
    d.textContent = t == null ? '' : String(t);
    return d.innerHTML;
  }

  function dateLisible(iso) {
    const p = iso.split('-').map(Number);
    const t = fmtJour.format(new Date(p[0], p[1] - 1, p[2]));
    return t.charAt(0).toUpperCase() + t.slice(1);
  }

  function annee(iso) { return iso.slice(0, 4); }

  function heureLisible(h) {
    return h ? h.slice(0, 5).replace(':', ' h ').replace(/ 00$/, '') : '';
  }

  function prixLisible(s) {
    return s.devise === 'CHF' ? s.prix + ' CHF' : s.prix + ' €';
  }

  /* L'état d'une session, en mots. On n'affiche jamais « 0 inscrit » :
     une date qui vient d'ouvrir dirait « personne n'en veut ». */
  function etat(s) {
    const manque = s.places_min - s.inscrits;
    const reste  = s.places_max - s.inscrits;

    if (s.statut === 'complete' || reste <= 0) {
      return { cle: 'complete', texte: 'Formation complète', ouverte: false };
    }
    if (s.inscrits >= s.places_min) {
      return {
        cle: 'confirmee',
        texte: reste <= 2
          ? 'Formation confirmée · ' + reste + (reste > 1 ? ' places restantes' : ' place restante')
          : 'Formation confirmée',
        ouverte: true
      };
    }
    if (manque === 1) {
      return { cle: 'presque', texte: 'Formation confirmée dans 1 inscription', ouverte: true };
    }
    return {
      cle: 'ouverte',
      texte: 'Formation confirmée dans ' + manque + ' inscriptions',
      ouverte: true
    };
  }

  /* Une petite jauge : autant de points que de places nécessaires,
     remplis au fur et à mesure. On voit le chemin parcouru d'un coup
     d'œil, sans lire. */
  function jauge(s) {
    let p = '';
    for (let i = 0; i < s.places_min; i++) {
      p += '<span class="fo-point' + (i < s.inscrits ? ' fo-point--pris' : '') + '"></span>';
    }
    return '<div class="fo-jauge" aria-hidden="true">' + p + '</div>';
  }

  /* ─── les cartes de session ─────────────────────────────────── */

  function carte(s) {
    const e = etat(s);
    return '' +
      '<article class="fo-session fo-session--' + e.cle + '" data-id="' + s.id + '">' +
        '<p class="fo-session-date">' + echapper(dateLisible(s.date_session)) +
          ' <span class="fo-annee">' + annee(s.date_session) + '</span></p>' +
        '<p class="fo-session-infos">' +
          (heureLisible(s.heure_debut) ? 'À partir de ' + echapper(heureLisible(s.heure_debut)) + ' · ' : '') +
          echapper(s.lieu) + '</p>' +
        jauge(s) +
        '<p class="fo-session-etat">' + e.texte + '</p>' +
        '<p class="fo-session-prix">' + prixLisible(s) + ' par personne</p>' +
        (e.ouverte
          ? '<button type="button" class="btn btn-gold fo-ouvrir">Réserver ma place</button>'
          : '<p class="fo-session-close">Les inscriptions sont closes pour cette date.</p>') +
      '</article>';
  }

  function champs(prefixe) {
    return '' +
      '<div class="form-row">' +
        '<label class="form-field"><span class="form-label">Prénom *</span>' +
          '<input type="text" name="prenom" required autocomplete="given-name"></label>' +
        '<label class="form-field"><span class="form-label">Nom *</span>' +
          '<input type="text" name="nom" required autocomplete="family-name"></label>' +
      '</div>' +
      '<div class="form-row">' +
        '<label class="form-field"><span class="form-label">E-mail *</span>' +
          '<input type="email" name="email" required autocomplete="email"></label>' +
        '<label class="form-field"><span class="form-label">Téléphone *</span>' +
          '<input type="tel" name="telephone" required autocomplete="tel"></label>' +
      '</div>' +
      /* Piège à robots : invisible, jamais rempli par un humain. */
      '<div class="fo-piege" aria-hidden="true">' +
        '<label>Ne rien écrire ici<input type="text" name="site" tabindex="-1" autocomplete="off"></label>' +
      '</div>';
  }

  function formulaireInscription(s) {
    return '' +
    '<form class="contact-form fo-form" novalidate>' +
      '<p class="fo-form-titre">' + echapper(dateLisible(s.date_session)) + '</p>' +
      '<p class="fo-form-rassure">Aucun paiement maintenant. Vous recevez un lien de ' +
        'règlement uniquement si la formation est confirmée.</p>' +
      champs() +
      '<label class="form-field"><span class="form-label">Un mot, une question, ou les personnes qui vous accompagnent</span>' +
        '<textarea name="message" rows="3"></textarea></label>' +
      '<label class="form-consent">' +
        '<input type="checkbox" name="engagement" required>' +
        '<span>Je m’engage à être présent·e si la formation est confirmée.</span>' +
      '</label>' +
      '<button type="submit" class="btn btn-gold btn-block">Je réserve ma place</button>' +
      '<p class="fo-form-msg" role="status"></p>' +
    '</form>';
  }

  function formulaireDemande() {
    return '' +
    '<form class="contact-form fo-form fo-form--demande" novalidate>' +
      champs() +
      '<div class="form-row">' +
        '<label class="form-field"><span class="form-label">Quand seriez-vous disponible ?</span>' +
          '<input type="text" name="periode" placeholder="un samedi de mars, en soirée…"></label>' +
        '<label class="form-field"><span class="form-label">Vous seriez combien ?</span>' +
          '<input type="number" name="personnes" min="1" max="20" placeholder="je ne sais pas encore"></label>' +
      '</div>' +
      '<label class="form-field"><span class="form-label">Votre message</span>' +
        '<textarea name="message" rows="3" placeholder="J’ai déjà un groupe prêt, ou j’aimerais proposer une date…"></textarea></label>' +
      '<button type="submit" class="btn btn-gold btn-block">Envoyer ma proposition</button>' +
      '<p class="fo-form-msg" role="status"></p>' +
    '</form>';
  }

  /* Formulaire dédié aux lieux et aux professionnels : on ne leur
     demande pas « quand êtes-vous disponible » comme à un particulier,
     mais où, combien, et dans quel cadre. */
  function formulaireDemandePro() {
    return '' +
    '<form class="contact-form fo-form fo-form--pro" novalidate>' +
      '<p class="fo-form-titre">Recevoir la journée chez vous</p>' +
      '<p class="fo-form-rassure">Dites-moi simplement où vous êtes et qui vous ' +
        'réunissez. Je vous rappelle pour caler la date et les conditions ensemble.</p>' +
      '<div class="form-row">' +
        '<label class="form-field"><span class="form-label">Votre structure</span>' +
          '<input type="text" name="structure" autocomplete="organization" ' +
          'placeholder="salon, boutique, association, comité d’entreprise…"></label>' +
        '<label class="form-field"><span class="form-label">Où êtes-vous ?</span>' +
          '<input type="text" name="periode" autocomplete="address-level2" ' +
          'placeholder="ville ou quartier"></label>' +
      '</div>' +
      champs() +
      '<label class="form-field"><span class="form-label">Combien de personnes pensez-vous réunir ?</span>' +
        '<input type="number" name="personnes" min="1" max="30" placeholder="même approximatif"></label>' +
      '<label class="form-field"><span class="form-label">Votre message</span>' +
        '<textarea name="message" rows="3" placeholder="Le cadre, la période qui vous arrangerait, vos questions…"></textarea></label>' +
      '<button type="submit" class="btn btn-gold btn-block">Envoyer ma demande</button>' +
      '<p class="fo-form-msg" role="status"></p>' +
    '</form>';
  }

  function message(form, texte, type) {
    const p = form.querySelector('.fo-form-msg');
    p.textContent = texte;
    p.className = 'fo-form-msg fo-form-msg--' + type;
  }

  function rafraichirEtat(article, s) {
    const e = etat(s);
    const ligne = article.querySelector('.fo-session-etat');
    if (ligne) ligne.textContent = e.texte;
    const j = article.querySelector('.fo-jauge');
    if (j) j.outerHTML = jauge(s);
    article.className = 'fo-session fo-session--' + e.cle;
  }

  /* Envoi commun aux deux formulaires. */
  function envoyer(form, chemin, corps, succes, bouton, libelle) {
    bouton.disabled = true;
    bouton.textContent = 'Envoi…';
    message(form, '', 'neutre');

    return appel(chemin, {
      method: 'POST',
      extraHeaders: { 'Prefer': 'return=minimal' },
      body: JSON.stringify(corps)
    })
    .then(function (r) {
      if (r.ok) { succes(); return null; }
      return r.json().then(function (e) { throw e; });
    })
    .catch(function (e) {
      let t = 'L’envoi n’a pas pu aboutir. Réessayez dans un instant, ou ' +
              'écrivez-moi à natachalaure.voyance@gmail.com.';
      if (e && e.code === '23505') {
        t = 'Vous êtes déjà inscrit·e à cette date avec cette adresse e-mail.';
      } else if (e && e.message && /complète|fermées|existe pas/i.test(e.message)) {
        t = e.message;
      }
      message(form, t, 'erreur');
      bouton.disabled = false;
      bouton.textContent = libelle;
    });
  }

  function brancherSession(article, s) {
    const bouton = article.querySelector('.fo-ouvrir');
    if (!bouton) return;

    bouton.addEventListener('click', function () {
      if (article.querySelector('.fo-form')) return;
      bouton.insertAdjacentHTML('afterend', formulaireInscription(s));
      bouton.hidden = true;
      const form = article.querySelector('.fo-form');
      form.querySelector('input[name="prenom"]').focus();

      form.addEventListener('submit', function (ev) {
        ev.preventDefault();
        const d = new FormData(form);
        if (d.get('site')) return;
        if (!form.checkValidity()) { form.reportValidity(); return; }

        envoyer(form, '/rest/v1/inscriptions', {
          session_id: s.id,
          prenom:     String(d.get('prenom')).trim(),
          nom:        String(d.get('nom')).trim(),
          email:      String(d.get('email')).trim().toLowerCase(),
          telephone:  String(d.get('telephone') || '').trim(),
          message:    String(d.get('message') || '').trim(),
          engagement: true
        }, function () {
          form.innerHTML =
            '<p class="fo-form-titre">C’est noté, merci.</p>' +
            '<p class="fo-form-rassure">Votre place est réservée. Vous recevrez un ' +
            'message dès que cette date sera confirmée — et c’est seulement à ce ' +
            'moment-là que le règlement vous sera demandé.</p>';
          s.inscrits += 1;
          rafraichirEtat(article, s);
        }, form.querySelector('button[type="submit"]'), 'Je réserve ma place');
      });
    });
  }

  function brancherDemande() {
    if (!zoneD) return;
    zoneD.innerHTML = formulaireDemande();
    const form = zoneD.querySelector('.fo-form');

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      const d = new FormData(form);
      if (d.get('site')) return;
      if (!form.checkValidity()) { form.reportValidity(); return; }

      const n = parseInt(d.get('personnes'), 10);
      envoyer(form, '/rest/v1/demandes', {
        type:      n >= 4 ? 'groupe' : 'date',
        prenom:    String(d.get('prenom')).trim(),
        nom:       String(d.get('nom')).trim(),
        email:     String(d.get('email')).trim().toLowerCase(),
        telephone: String(d.get('telephone') || '').trim(),
        periode:   String(d.get('periode') || '').trim(),
        personnes: isNaN(n) ? null : n,
        message:   String(d.get('message') || '').trim()
      }, function () {
        form.innerHTML =
          '<p class="fo-form-titre">Merci, c’est bien reçu.</p>' +
          '<p class="fo-form-rassure">Je reviens vers vous rapidement. Si une date ' +
          'se dégage, elle apparaîtra aussi sur cette page et d’autres pourront ' +
          's’y joindre.</p>';
      }, form.querySelector('button[type="submit"]'), 'Envoyer ma proposition');
    });
  }

  /* Le bouton « Parlons-en » ouvre le formulaire au lieu de renvoyer
     vers le contact général du site : la personne reste dans son
     contexte, et la demande arrive déjà étiquetée « professionnel ». */
  function brancherDemandePro() {
    if (!zoneP) return;
    const bouton = document.querySelector('.fo-ouvrir-pro');
    if (!bouton) return;

    bouton.addEventListener('click', function () {
      if (zoneP.querySelector('.fo-form')) return;

      zoneP.innerHTML = formulaireDemandePro();
      bouton.hidden = true;
      bouton.setAttribute('aria-expanded', 'true');

      const form = zoneP.querySelector('.fo-form');
      const premier = form.querySelector('input[name="structure"]');
      if (premier) premier.focus({ preventScroll: true });
      zoneP.scrollIntoView({ behavior: 'smooth', block: 'center' });

      form.addEventListener('submit', function (ev) {
        ev.preventDefault();
        const d = new FormData(form);
        if (d.get('site')) return;
        if (!form.checkValidity()) { form.reportValidity(); return; }

        const n = parseInt(d.get('personnes'), 10);
        envoyer(form, '/rest/v1/demandes', {
          type:      'pro',
          structure: String(d.get('structure') || '').trim(),
          prenom:    String(d.get('prenom')).trim(),
          nom:       String(d.get('nom')).trim(),
          email:     String(d.get('email')).trim().toLowerCase(),
          telephone: String(d.get('telephone') || '').trim(),
          periode:   String(d.get('periode') || '').trim(),
          personnes: isNaN(n) ? null : n,
          message:   String(d.get('message') || '').trim()
        }, function () {
          form.innerHTML =
            '<p class="fo-form-titre">Merci, c’est noté.</p>' +
            '<p class="fo-form-rassure">Je vous recontacte rapidement pour voir ' +
            'ensemble la date, le lieu et la façon dont on s’organise.</p>';
        }, form.querySelector('button[type="submit"]'), 'Envoyer ma demande');
      });
    });
  }

  /* ─── chargement ────────────────────────────────────────────── */

  function charger() {
    appel('/rest/v1/rpc/sessions_ouvertes', { method: 'POST', body: '{}' })
    .then(function (r) { if (!r.ok) throw new Error('rpc'); return r.json(); })
    .then(function (sessions) {
      if (!Array.isArray(sessions) || sessions.length === 0) {
        zone.innerHTML =
          '<p class="fo-chargement">Aucune date n’est ouverte en ce moment — ' +
          'proposez la vôtre juste en dessous, j’ouvre des sessions à la demande.</p>';
        return;
      }
      zone.innerHTML = sessions.map(carte).join('');
      sessions.forEach(function (s) {
        const a = zone.querySelector('.fo-session[data-id="' + s.id + '"]');
        if (a) brancherSession(a, s);
      });
    })
    .catch(function () {
      zone.innerHTML =
        '<p class="fo-chargement">Les dates ne s’affichent pas pour le moment. ' +
        'Écrivez-moi à <a href="mailto:natachalaure.voyance@gmail.com">' +
        'natachalaure.voyance@gmail.com</a> et je vous les communique.</p>';
    });
  }

  if (zone) charger();
  brancherDemande();
  brancherDemandePro();
})();
