/* ═══════════════════════════════════════════════════════════════════
   INSCRIPTIONS AUX JOURNÉES DE FORMATION
   natachalaurevoyance.fr — 22.11.2026

   Ce fichier affiche les sessions et enregistre les inscriptions.
   Le site étant 100 % statique, il parle directement à Supabase depuis
   le navigateur.

   ⚠ LES DEUX VALEURS CI-DESSOUS SONT À REMPLIR UNE SEULE FOIS.
     Elles se trouvent dans Supabase : Project Settings → API.
     La clé « anon public » est PRÉVUE pour être publique : elle ne
     permet que d'écrire une inscription et de lire les dates, jamais
     de lire les coordonnées de qui que ce soit (voir base-de-donnees.sql).
     Ne colle JAMAIS ici la clé « service_role ».
   ═══════════════════════════════════════════════════════════════════ */

const SUPABASE_URL = 'https://cnxhehfngpwsrwdtqigq.supabase.co/';
const SUPABASE_CLE = 'sb_publishable_namlfDcAhfb05G28r5kzDQ_Sbdk4e2B';


/* ─────────────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  const zone = document.getElementById('fo-sessions');
  if (!zone) return;

  const configure = SUPABASE_URL.indexOf('XXXX') === -1 &&
                    SUPABASE_CLE.indexOf('COLLE_ICI') === -1;

  if (!configure) {
    zone.innerHTML =
      '<p class="fo-chargement">Les dates seront affichées ici dès que la ' +
      'connexion sera en place.</p>';
    return;
  }

  /* GARDE-FOU : une clé secrète n'a RIEN à faire dans un navigateur.
     Si elle est collée ici par erreur, la page refuse de fonctionner
     plutôt que de la publier à la terre entière. */
  if (/^sb_secret_/.test(SUPABASE_CLE) || /service_role/.test(SUPABASE_CLE)) {
    zone.innerHTML =
      '<p class="fo-chargement">Configuration à corriger : la clé utilisée est ' +
      'une clé secrète. Remplacez-la par la clé « publishable ».</p>';
    if (window.console) {
      console.error('formation.js : clé SECRÈTE détectée. Ne jamais la mettre ' +
                    'dans une page publique. Utiliser la clé publishable.');
    }
    return;
  }

  /* Les clés récentes (sb_publishable_…) sont des chaînes opaques : elles
     se placent dans l'en-tête « apikey » seulement. Les anciennes clés
     « anon » sont des JWT (elles commencent par eyJ) et acceptent en plus
     l'en-tête Authorization. On adapte selon le format reçu, et en cas de
     refus on retente une fois avec l'autre combinaison — comme ça ta page
     marche quelle que soit la clé que tu colles. */
  const cleJWT = /^eyJ/.test(SUPABASE_CLE);

  function entetes(avecAuth) {
    const h = { 'apikey': SUPABASE_CLE, 'Content-Type': 'application/json' };
    if (avecAuth) h['Authorization'] = 'Bearer ' + SUPABASE_CLE;
    return h;
  }

  /* Appelle Supabase, et retente une seule fois avec l'autre jeu
     d'en-têtes si l'authentification est refusée. */
  function appel(chemin, options, avecAuth) {
    if (avecAuth === undefined) avecAuth = cleJWT;
    const o = Object.assign({}, options);
    o.headers = Object.assign(entetes(avecAuth), options.extraHeaders || {});
    delete o.extraHeaders;
    return fetch(SUPABASE_URL + chemin, o).then(function (r) {
      if ((r.status === 401 || r.status === 403) && avecAuth === cleJWT) {
        return appel(chemin, options, !cleJWT);
      }
      return r;
    });
  }

  const jours = new Intl.DateTimeFormat('fr-FR',
    { weekday: 'long', day: 'numeric', month: 'long' });

  function echapper(t) {
    const d = document.createElement('div');
    d.textContent = t == null ? '' : String(t);
    return d.innerHTML;
  }

  function dateLisible(iso) {
    const [a, m, j] = iso.split('-').map(Number);
    const texte = jours.format(new Date(a, m - 1, j));
    return texte.charAt(0).toUpperCase() + texte.slice(1);
  }

  function heureLisible(h) {
    return h ? h.slice(0, 5).replace(':', ' h ').replace(/ 00$/, '') : '';
  }

  /* L'état d'une session, en mots plutôt qu'en chiffres bruts.
     On n'affiche JAMAIS « 0 inscrit » : une date vide donnerait
     l'impression que personne n'en veut, alors qu'elle vient d'ouvrir. */
  function etat(s) {
    const manque = s.places_min - s.inscrits;
    const reste  = s.places_max - s.inscrits;

    if (s.statut === 'complete' || reste <= 0) {
      return { cle: 'complete', texte: 'Session complète', ouverte: false };
    }
    if (s.inscrits >= s.places_min) {
      return {
        cle: 'confirmee',
        texte: reste <= 2
          ? 'Session confirmée · ' + reste + (reste > 1 ? ' places restantes' : ' place restante')
          : 'Session confirmée',
        ouverte: true
      };
    }
    if (manque === 1) {
      return { cle: 'presque', texte: 'Plus qu’une inscription pour confirmer cette date', ouverte: true };
    }
    return {
      cle: 'ouverte',
      texte: 'Plus que ' + manque + ' inscriptions pour confirmer cette date',
      ouverte: true
    };
  }

  function prixLisible(s) {
    return s.devise === 'CHF' ? s.prix + ' CHF' : s.prix + ' €';
  }

  function carte(s) {
    const e = etat(s);
    const visio = s.format === 'visio';
    return '' +
      '<article class="fo-session fo-session--' + e.cle + '" data-id="' + s.id + '">' +
        '<div class="fo-session-tete">' +
          '<p class="fo-session-date">' + echapper(dateLisible(s.date_session)) + '</p>' +
          '<p class="fo-session-infos">' +
            (heureLisible(s.heure_debut) ? 'À partir de ' + echapper(heureLisible(s.heure_debut)) + ' · ' : '') +
            echapper(s.lieu) +
            (visio ? ' · en deux demi-journées' : '') +
          '</p>' +
        '</div>' +
        '<p class="fo-session-etat">' + e.texte + '</p>' +
        '<p class="fo-session-prix">' + prixLisible(s) + ' par personne</p>' +
        (e.ouverte
          ? '<button type="button" class="btn btn-gold fo-ouvrir">M’inscrire à cette date</button>'
          : '<p class="fo-session-close">Les inscriptions sont closes pour cette date.</p>') +
      '</article>';
  }

  function formulaire(s) {
    return '' +
    '<form class="contact-form fo-form" novalidate>' +
      '<p class="fo-form-titre">Inscription — ' + echapper(dateLisible(s.date_session)) + '</p>' +
      '<p class="fo-form-rassure">Aucun paiement maintenant. Vous recevrez un lien de ' +
        'règlement uniquement si la session est confirmée.</p>' +
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
      '<label class="form-field"><span class="form-label">Un mot, une question, ou les personnes que vous amenez</span>' +
        '<textarea name="message" rows="3"></textarea></label>' +
      /* Piège à robots : invisible, jamais rempli par un humain. */
      '<div class="fo-piege" aria-hidden="true">' +
        '<label>Ne rien écrire ici<input type="text" name="site" tabindex="-1" autocomplete="off"></label>' +
      '</div>' +
      '<label class="form-consent">' +
        '<input type="checkbox" name="engagement" required>' +
        '<span>Je m’engage à être présent·e si la session est confirmée.</span>' +
      '</label>' +
      '<button type="submit" class="btn btn-gold btn-block">Je réserve ma place</button>' +
      '<p class="fo-form-msg" role="status"></p>' +
    '</form>';
  }

  /* Remet à jour la ligne d'état et la couleur de bordure d'une carte,
     sans toucher au reste de son contenu. */
  function rafraichirEtat(article, s) {
    const e = etat(s);
    const ligne = article.querySelector('.fo-session-etat');
    if (ligne) ligne.textContent = e.texte;
    article.className = 'fo-session fo-session--' + e.cle;
  }

  function message(form, texte, type) {
    const p = form.querySelector('.fo-form-msg');
    p.textContent = texte;
    p.className = 'fo-form-msg fo-form-msg--' + type;
  }

  function brancher(article, s) {
    const bouton = article.querySelector('.fo-ouvrir');
    if (!bouton) return;

    bouton.addEventListener('click', function () {
      if (article.querySelector('.fo-form')) return;
      bouton.insertAdjacentHTML('afterend', formulaire(s));
      bouton.hidden = true;
      const form = article.querySelector('.fo-form');
      form.querySelector('input[name="prenom"]').focus();

      form.addEventListener('submit', function (ev) {
        ev.preventDefault();
        const d = new FormData(form);

        if (d.get('site')) return;                       // robot
        if (!form.checkValidity()) { form.reportValidity(); return; }

        const envoi = form.querySelector('button[type="submit"]');
        envoi.disabled = true;
        envoi.textContent = 'Envoi…';
        message(form, '', 'neutre');

        appel('/rest/v1/inscriptions', {
          method: 'POST',
          extraHeaders: { 'Prefer': 'return=minimal' },
          body: JSON.stringify({
            session_id: s.id,
            prenom:     String(d.get('prenom')).trim(),
            nom:        String(d.get('nom')).trim(),
            email:      String(d.get('email')).trim().toLowerCase(),
            telephone:  String(d.get('telephone') || '').trim(),
            message:    String(d.get('message') || '').trim(),
            engagement: true
          })
        })
        .then(function (r) {
          if (r.ok) {
            form.innerHTML =
              '<p class="fo-form-titre">C’est noté, merci.</p>' +
              '<p class="fo-form-rassure">Votre place est réservée. Vous recevrez un ' +
              'message dès que cette date sera confirmée — et c’est seulement à ce ' +
              'moment-là que le règlement vous sera demandé.</p>';
            /* On met à jour le compteur de CETTE carte seulement.
               Recharger toute la liste effacerait le message que la
               personne vient de recevoir, sous ses yeux. */
            s.inscrits += 1;
            rafraichirEtat(article, s);
            return null;
          }
          return r.json().then(function (e) { throw e; });
        })
        .catch(function (e) {
          let t = 'L’inscription n’a pas pu être enregistrée. Réessayez dans un ' +
                  'instant, ou écrivez-moi à natachalaure.voyance@gmail.com.';
          if (e && e.code === '23505') {
            t = 'Vous êtes déjà inscrit·e à cette date avec cette adresse e-mail.';
          } else if (e && e.message && /complète|fermées|existe pas/i.test(e.message)) {
            t = e.message;
          }
          message(form, t, 'erreur');
          envoi.disabled = false;
          envoi.textContent = 'Je réserve ma place';
        });
      });
    });
  }

  function charger() {
    appel('/rest/v1/rpc/sessions_ouvertes', { method: 'POST', body: '{}' })
    .then(function (r) { if (!r.ok) throw new Error('rpc'); return r.json(); })
    .then(function (sessions) {
      if (!Array.isArray(sessions) || sessions.length === 0) {
        zone.innerHTML =
          '<p class="fo-chargement">Aucune date n’est ouverte en ce moment. ' +
          'Écrivez-moi à <a href="mailto:natachalaure.voyance@gmail.com">' +
          'natachalaure.voyance@gmail.com</a> : dès que nous sommes quatre, ' +
          'j’ouvre une session.</p>';
        return;
      }
      zone.innerHTML = sessions.map(carte).join('');
      sessions.forEach(function (s) {
        const a = zone.querySelector('.fo-session[data-id="' + s.id + '"]');
        if (a) brancher(a, s);
      });
    })
    .catch(function () {
      zone.innerHTML =
        '<p class="fo-chargement">Les dates ne s’affichent pas pour le moment. ' +
        'Écrivez-moi à <a href="mailto:natachalaure.voyance@gmail.com">' +
        'natachalaure.voyance@gmail.com</a> et je vous les communique.</p>';
    });
  }

  charger();
})();
