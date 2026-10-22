/* ═══════════════════════════════════════════════════════════════════════
   PRISE DE RENDEZ-VOUS — natachalaurevoyance.fr/rendez-vous/
   19.10.2026

   Trois gestes, et c'est tout : choisir une heure, écrire trois lignes,
   payer. Aucun compte, aucun mot de passe, aucun e-mail à confirmer.

   Rien d'important ne se décide ici. Le prix, la disponibilité et la
   validité du créneau sont vérifiés par la base de données : ce fichier
   est dans le navigateur de la cliente, donc modifiable par elle. Il
   affiche et il transmet, il ne juge pas.
   ═══════════════════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  var CONFIG = {
    // Une seule adresse pour les deux gestes : GET pour lire l'agenda,
    // POST pour réserver. Vercel limite le plan gratuit à douze fonctions.
    API: "https://aurea.natachalaurevoyance.fr/api/consultations",
    // Nombre de jours affichés d'emblée. Au-delà, un bouton « voir plus ».
    // Trop de choix fait hésiter ; trop peu fait partir.
    JOURS_VISIBLES: 3,
  };

  var el = {
    prix: document.getElementById("rv-prix"),
    agenda: document.getElementById("rv-agenda"),
    bloc2: document.getElementById("rv-bloc-coordonnees"),
    choisi: document.getElementById("rv-choisi"),
    form: document.getElementById("rv-form"),
    prenom: document.getElementById("rv-prenom"),
    telephone: document.getElementById("rv-telephone"),
    pays: document.getElementById("rv-pays"),
    apercuTel: document.getElementById("rv-apercu-tel"),
    email: document.getElementById("rv-email"),
    message: document.getElementById("rv-message"),
    accord: document.getElementById("rv-accord"),
    accordLigne: document.getElementById("rv-accord-ligne"),
    erreur: document.getElementById("rv-erreur"),
    payer: document.getElementById("rv-payer"),
    montant: document.getElementById("rv-payer-montant"),
    voile: document.getElementById("rv-voile"),
    voileTitre: document.getElementById("rv-voile-titre"),
    voileTexte: document.getElementById("rv-voile-texte"),
    voileSceau: document.getElementById("rv-voile-sceau"),
    voileFermer: document.getElementById("rv-voile-fermer"),
    // Présents seulement sur la page publique : les deux pages privées ne
    // proposent qu'une formule au téléphone.
    formules: document.getElementById("rv-formules"),
    blocFormules: document.getElementById("rv-bloc-formules"),
    champAdresse: document.getElementById("rv-champ-adresse"),
    adresse: document.getElementById("rv-adresse"),
    champReglement: document.getElementById("rv-champ-reglement"),
  };

  var offre = null;       // les formules et destinations de ce lien
  var etat = null;        // la formule retenue + ses créneaux
  var formule = null;     // le code de la formule choisie
  var choix = null;       // l'ISO du créneau retenu
  var toutAfficher = false;

  // ─── Outils ──────────────────────────────────────────────────────────

  // Toujours en heure de Paris, jamais en heure du téléphone : une cliente
  // en vacances à l'étranger doit lire l'heure à laquelle Natacha appelle.
  function fmt(iso, options) {
    options.timeZone = "Europe/Paris";
    return new Intl.DateTimeFormat("fr-FR", options).format(new Date(iso));
  }
  var jourLong = function (iso) {
    return fmt(iso, { weekday: "long", day: "numeric", month: "long" });
  };
  var heureCourte = function (iso) {
    return fmt(iso, { hour: "2-digit", minute: "2-digit" }).replace(":", " h ");
  };
  var cleJour = function (iso) {
    return fmt(iso, { year: "numeric", month: "2-digit", day: "2-digit" });
  };

  function euros(cents) {
    var v = cents / 100;
    // « 49 € » plutôt que « 49,00 € » : plus court se lit plus vite.
    return (v % 1 === 0 ? String(v) : v.toFixed(2).replace(".", ",")) + " €";
  }

  // Le groupe déclaré par la page (<meta name="rv-groupe">). Une page qui
  // l'oublierait n'empêcherait pas de réserver : on renvoie simplement
  // rien, et l'espace pro affichera « Offre privée ».
  function groupeDeLaPage() {
    var m = document.querySelector('meta[name="rv-groupe"]');
    return (m && m.getAttribute("content")) || null;
  }

  // Le code du lien, déclaré dans l'en-tête de chaque page. C'est lui qui
  // décide des formules proposées ET du tarif : la page n'envoie jamais de
  // prix, elle dit seulement d'où vient la cliente.
  function lienDeLaPage() {
    var m = document.querySelector('meta[name="rv-lien"]');
    return (m && m.getAttribute("content")) || "public";
  }

  function formuleChoisie() {
    if (!offre || !offre.formules) return null;
    for (var i = 0; i < offre.formules.length; i++) {
      if (offre.formules[i].code === formule) return offre.formules[i];
    }
    return null;
  }

  var aDomicile = function () {
    var f = formuleChoisie();
    return Boolean(f && f.mode === "domicile");
  };

  // ─── Le numéro au format international ──────────────────────────────
  //  WhatsApp exige un numéro complet, sans espaces ni zéro initial :
  //  « 078 615 78 58 » devient « 41786157858 ». Sans le pays, ce numéro
  //  est ambigu — il existe à l'identique en France et en Suisse.
  function numeroInternational() {
    var opt = el.pays.options[el.pays.selectedIndex];
    var indicatif = el.pays.value;
    var zeroInitial = opt.getAttribute("data-trunc") === "1";
    var chiffres = el.telephone.value.replace(/[^0-9]/g, "");

    // Le préfixe international « 00 » d'abord : beaucoup de Suisses
    // écrivent leur numéro « 0041 78 … » pour un correspondant étranger.
    // Sans cette ligne, on obtenait +4104178… — un numéro qui n'existe
    // pas, donc un lien WhatsApp vers personne. Trouvé au banc d'essai.
    if (chiffres.indexOf("00") === 0) chiffres = chiffres.slice(2);

    if (chiffres.indexOf(indicatif) === 0 && chiffres.length > indicatif.length + 6) {
      // Elle a tapé le format international : on ne double pas l'indicatif.
      chiffres = chiffres.slice(indicatif.length);
    } else if (zeroInitial && chiffres.charAt(0) === "0") {
      chiffres = chiffres.slice(1);
    }
    return indicatif + chiffres;
  }

  // Affiché sous le champ : voir son propre numéro réécrit en entier
  // permet d'attraper une faute de frappe avant de payer.
  function rafraichirApercu() {
    var n = numeroInternational();
    var ok = n.length >= 10 && n.length <= 15;
    el.apercuTel.textContent = ok
      ? "Je vous appellerai sur WhatsApp au +" + n
      : "";
  }

  function montrerErreur(texte) {
    el.erreur.textContent = texte;
    el.erreur.hidden = false;
    el.erreur.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  function cacherErreur() {
    el.erreur.hidden = true;
    el.erreur.textContent = "";
  }

  // ─── Le tarif ────────────────────────────────────────────────────────

  function afficherPrix() {
    var f = formuleChoisie();
    if (!f) return;
    var barre = "";
    // Le prix barré ne s'affiche que s'il est RÉELLEMENT supérieur. Barrer
    // un prix identique ou inférieur serait une réduction inventée — et
    // l'article L112-1-1 du code de la consommation ne l'admet pas.
    if (f.prix_barre_cents && f.prix_barre_cents > f.prix_cents) {
      barre = '<span class="rv-prix-barre">' + euros(f.prix_barre_cents) + "</span>";
    }
    el.prix.innerHTML =
      '<span class="rv-prix-montant">' + euros(f.prix_cents) + "</span>" +
      barre +
      '<span class="rv-prix-note">' + escapeHtml(f.nom) + ", " + f.duree_minutes +
      " minutes, " +
      (f.mode === "domicile"
        ? "chez vous. Réglée une fois, rien d'autre à payer."
        : "en appel WhatsApp. Réglée une fois, rien d'autre à payer.") +
      "</span>";

    el.montant.textContent = euros(f.prix_cents);
  }

  // ─── Le choix de la formule ──────────────────────────────────────────

  // Les formules sont présentées en DEUX menus distincts — à domicile d'un
  // côté, par téléphone de l'autre — et non en une seule liste mélangée :
  // le premier choix réel d'une visiteuse, c'est « est-ce qu'elle vient chez
  // moi ou est-ce qu'on s'appelle », pas la durée.
  function carteFormule(f) {
    var barre = f.prix_barre_cents && f.prix_barre_cents > f.prix_cents
      ? '<s class="rv-f-barre">' + euros(f.prix_barre_cents) + "</s>" : "";
    return '<button type="button" class="rv-formule" data-code="' + escapeHtml(f.code) + '"' +
      (f.code === formule ? ' aria-pressed="true"' : ' aria-pressed="false"') + ">" +
      '<span class="rv-f-nom">' + escapeHtml(f.nom) + "</span>" +
      '<span class="rv-f-duree">' + f.duree_minutes + " minutes</span>" +
      '<span class="rv-f-prix">' + euros(f.prix_cents) + barre + "</span>" +
      "</button>";
  }

  function groupeFormules(titre, precision, liste) {
    if (!liste.length) return "";
    var cartes = "";
    for (var i = 0; i < liste.length; i++) cartes += carteFormule(liste[i]);
    return '<div class="rv-groupe">' +
      '<p class="rv-groupe-titre">' + escapeHtml(titre) +
      '<span class="rv-groupe-precision">' + escapeHtml(precision) + "</span></p>" +
      '<div class="rv-groupe-cartes">' + cartes + "</div></div>";
  }

  function afficherFormules() {
    if (!el.formules) return;
    var domicile = [], telephone = [];
    for (var i = 0; i < offre.formules.length; i++) {
      (offre.formules[i].mode === "domicile" ? domicile : telephone)
        .push(offre.formules[i]);
    }
    // Un seul mode proposé : pas de titre de groupe, ce serait du bruit.
    var html = (domicile.length && telephone.length)
      ? groupeFormules("Chez vous", "dans un rayon de 15 km autour de Saint-Laurent-du-Var", domicile) +
        groupeFormules("Par téléphone", "partout en France", telephone)
      : groupeFormules("", "", domicile.concat(telephone))
          .replace(/<p class="rv-groupe-titre">.*?<\/p>/, "");
    el.formules.innerHTML = html;
    var boutons = el.formules.querySelectorAll(".rv-formule");
    for (var j = 0; j < boutons.length; j++) {
      boutons[j].addEventListener("click", function () {
        choisirFormule(this.getAttribute("data-code"));
      });
    }
  }

  function existeFormule(code) {
    if (!offre || !offre.formules) return false;
    for (var i = 0; i < offre.formules.length; i++) {
      if (offre.formules[i].code === code) return true;
    }
    return false;
  }

  // Quand on arrive d'un bouton « Réserver » de l'accueil, la formule est
  // déjà cochée mais elle se trouve plus bas que l'écran : sans ce geste, on
  // croit que le clic n'a rien fait. On respecte le réglage système de ceux
  // qui ont désactivé les animations.
  function amenerALaFormule() {
    if (!el.blocFormules) return;
    var doux = !(window.matchMedia &&
                 window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    setTimeout(function () {
      try {
        el.blocFormules.scrollIntoView({
          behavior: doux ? "smooth" : "auto", block: "start"
        });
      } catch (e) { el.blocFormules.scrollIntoView(); }
    }, 250);
  }

  function choisirFormule(code) {
    formule = code;
    choix = null;
    toutAfficher = false;
    afficherFormules();
    afficherPrix();
    adapterChamps();
    // Le bloc des coordonnées se referme : le créneau d'avant ne vaut plus
    // pour une formule d'une autre durée.
    el.bloc2.classList.add("rv-bloc-inactif");
    el.bloc2.setAttribute("aria-hidden", "true");
    el.agenda.innerHTML = '<p class="rv-attente">Je regarde mes disponibilités…</p>';
    chargerCreneaux();
  }

  // Adresse et mode de règlement n'apparaissent que pour un rendez-vous à
  // domicile : les demander pour un appel n'aurait aucun sens.
  function adapterChamps() {
    var chez = aDomicile();
    if (el.champAdresse) {
      el.champAdresse.hidden = !chez;
      if (!chez && el.adresse) el.adresse.value = "";
    }
    if (el.champReglement) el.champReglement.hidden = !chez;
    adapterLesMots(chez);
  }

  // Une page qui sert les deux modes ne peut pas promettre un appel
  // WhatsApp à quelqu'un qui a demandé une visite à domicile. Tant
  // qu'aucune formule n'est choisie, les textes restent neutres.
  function adapterLesMots(chez) {
    var f = formuleRetenue();
    var dit = function (id, texte) {
      var n = document.getElementById(id);
      if (n && texte) n.textContent = texte;
    };
    if (!f) return;

    var lib = document.getElementById("rv-tel-libelle");
    if (lib) {
      lib.innerHTML = chez
        ? "Votre numéro de téléphone <em>— au cas où je doive vous joindre</em>"
        : "Votre numéro WhatsApp <em>— c'est là que je vous appellerai</em>";
    }

    dit("rv-atout1-titre", chez ? "Je viens chez vous" : "Je vous appelle sur WhatsApp");
    dit("rv-atout1-texte", chez
      ? "Dans un rayon de 15 km autour de Saint-Laurent-du-Var."
      : "Vous n'avez rien à composer. L'appel est gratuit, même entre pays.");
    dit("rv-atout2-titre", dureeEnMots(f.duree_minutes));
    dit("rv-atout2-texte", "Le temps de poser vos questions et d'entendre les réponses.");
  }

  function formuleRetenue() {
    if (!offre || !offre.formules) return null;
    for (var i = 0; i < offre.formules.length; i++) {
      if (offre.formules[i].code === formule) return offre.formules[i];
    }
    return null;
  }

  function dureeEnMots(min) {
    var connus = {
      30: "Une demi-heure", 45: "Trois quarts d'heure",
      60: "Une heure entière", 90: "Une heure et demie",
      120: "Deux heures entières", 180: "Trois heures entières"
    };
    if (connus[min]) return connus[min];
    if (min < 60) return min + " minutes";
    if (min % 60 === 0) return (min / 60) + " heures entières";
    return Math.floor(min / 60) + " h " + (min % 60);
  }

  function reglementChoisi() {
    if (!aDomicile()) return "en_ligne";
    var coche = document.querySelector('input[name="rv-reglement"]:checked');
    return coche && coche.value === "especes" ? "especes" : "en_ligne";
  }

  // ─── L'agenda ────────────────────────────────────────────────────────

  function afficherAgenda() {
    var creneaux = (etat.creneaux || []).map(function (c) {
      return c.debut || c;
    });

    if (!etat.ouverte) {
      el.agenda.innerHTML =
        '<p class="rv-vide">' +
        (etat.message_pause
          ? escapeHtml(etat.message_pause)
          : "Les rendez-vous sont momentanément en pause. Appelez-moi au " +
            '<a href="tel:+33627815276" style="color:#cc9e58">06 27 81 52 76</a>, ' +
            "je vous trouve un moment.") +
        "</p>";
      return;
    }

    if (creneaux.length === 0) {
      el.agenda.innerHTML =
        '<p class="rv-vide">Tous mes créneaux sont pris pour le moment. ' +
        'Appelez-moi au <a href="tel:+33627815276" style="color:#cc9e58">06 27 81 52 76</a> ' +
        "et je vous cale en direct.</p>";
      return;
    }

    // Regroupés par journée, dans l'ordre.
    var jours = [];
    var index = {};
    creneaux.forEach(function (iso) {
      var k = cleJour(iso);
      if (!index[k]) {
        index[k] = { cle: k, premier: iso, heures: [] };
        jours.push(index[k]);
      }
      index[k].heures.push(iso);
    });

    var montres = toutAfficher ? jours : jours.slice(0, CONFIG.JOURS_VISIBLES);
    var html = montres
      .map(function (j) {
        return (
          '<div class="rv-jour"><p class="rv-jour-titre">' +
          escapeHtml(jourLong(j.premier)) +
          '</p><div class="rv-heures">' +
          j.heures
            .map(function (iso) {
              return (
                '<button type="button" class="rv-heure" data-iso="' +
                escapeHtml(iso) +
                '" aria-pressed="' + (choix === iso ? "true" : "false") + '">' +
                escapeHtml(heureCourte(iso)) +
                "</button>"
              );
            })
            .join("") +
          "</div></div>"
        );
      })
      .join("");

    if (!toutAfficher && jours.length > CONFIG.JOURS_VISIBLES) {
      html +=
        '<button type="button" class="rv-plus" id="rv-plus">' +
        "Voir d'autres dates (" + (jours.length - CONFIG.JOURS_VISIBLES) + " jours de plus)" +
        "</button>";
    }

    el.agenda.innerHTML = html;

    Array.prototype.forEach.call(
      el.agenda.querySelectorAll(".rv-heure"),
      function (b) {
        b.addEventListener("click", function () {
          choisir(b.getAttribute("data-iso"));
        });
      }
    );
    var plus = document.getElementById("rv-plus");
    if (plus) {
      plus.addEventListener("click", function () {
        toutAfficher = true;
        afficherAgenda();
      });
    }
  }

  // ─── Le choix d'un créneau ───────────────────────────────────────────

  function choisir(iso) {
    choix = iso;
    cacherErreur();

    Array.prototype.forEach.call(
      el.agenda.querySelectorAll(".rv-heure"),
      function (b) {
        b.setAttribute(
          "aria-pressed",
          b.getAttribute("data-iso") === iso ? "true" : "false"
        );
      }
    );

    el.choisi.innerHTML =
      "Rendez-vous retenu : <strong>" +
      escapeHtml(jourLong(iso)) + " à " + escapeHtml(heureCourte(iso)) +
      "</strong>. Je vous appellerai à cette heure-là.";

    el.bloc2.classList.add("rv-ouvert");
    el.bloc2.setAttribute("aria-hidden", "false");

    // On amène la personne au formulaire sans qu'elle ait à chercher, mais
    // on ne met PAS le curseur dans le champ : sur mobile, le clavier qui
    // surgit masque ce qu'on vient de choisir et désoriente.
    el.bloc2.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // ─── L'envoi ─────────────────────────────────────────────────────────

  function valider() {
    var souci = null;
    [el.prenom, el.telephone, el.email].forEach(function (c) {
      // closest() et non parentNode : le téléphone est désormais imbriqué
      // dans une ligne avec le menu pays.
      c.closest(".rv-champ").classList.remove("rv-faux");
    });
    el.accordLigne.classList.remove("rv-faux");

    if (el.champAdresse && !el.champAdresse.hidden) {
      el.champAdresse.classList.remove("rv-faux");
    }

    if (!formule) {
      souci = { texte: "Choisissez d'abord une formule ci-dessus.", champ: null };
    } else if (!choix) {
      souci = { texte: "Choisissez d'abord un créneau ci-dessus.", champ: null };
    } else if (aDomicile() && el.adresse && el.adresse.value.trim().length < 8) {
      // Huit caractères : « 5 rue X » passe, « Nice » ne passe pas. Une
      // adresse sans numéro ni code postal ne se géocode pas.
      souci = {
        texte:
          "Indiquez l'adresse complète où Natacha doit venir : numéro, rue, " +
          "code postal et ville.",
        champ: el.adresse,
      };
    } else if (!el.prenom.value.trim()) {
      souci = { texte: "Merci d'indiquer votre prénom.", champ: el.prenom };
    } else if (numeroInternational().length < 10 || numeroInternational().length > 15) {
      souci = {
        texte:
          "Ce numéro semble incomplet. Vérifiez le pays à gauche, puis votre " +
          "numéro — c'est là que Natacha vous appellera sur WhatsApp.",
        champ: el.telephone,
      };
    } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(el.email.value.trim())) {
      souci = {
        texte: "Cette adresse e-mail semble incomplète — c'est là que part votre confirmation.",
        champ: el.email,
      };
    } else if (!el.accord.checked) {
      // Vérifié en dernier : on ne demande pas de cocher une case avant
      // que le reste soit bon, sinon on la fait cocher deux fois.
      souci = {
        texte:
          "Il reste la petite case à cocher juste au-dessus du bouton : " +
          "elle confirme que vous voulez bien votre rendez-vous à la date choisie.",
        champ: null, ligne: el.accordLigne,
      };
    }

    if (souci) {
      if (souci.champ) {
        souci.champ.closest(".rv-champ").classList.add("rv-faux");
        souci.champ.focus();
      }
      if (souci.ligne) {
        souci.ligne.classList.add("rv-faux");
        souci.ligne.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      montrerErreur(souci.texte);
      return false;
    }
    return true;
  }

  function envoyer(e) {
    e.preventDefault();
    cacherErreur();
    if (!valider()) return;

    var especes = reglementChoisi() === "especes";
    el.payer.disabled = true;
    el.payer.querySelector(".rv-payer-texte").textContent =
      especes ? "Enregistrement…" : "Ouverture du paiement…";

    fetch(CONFIG.API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prenom: el.prenom.value.trim(),
        telephone: "+" + numeroInternational(),
        email: el.email.value.trim(),
        debut: choix,
        message: el.message.value.trim() || null,
        // Le lien d'où vient la cliente. C'est lui qui décide du tarif,
        // côté serveur : la page n'envoie aucun prix.
        lien: lienDeLaPage(),
        formule: formule,
        // L'adresse part en clair ; c'est le serveur qui la géocode et la
        // base qui recalcule la distance. Des coordonnées envoyées par la
        // page se truqueraient d'un clic dans la console.
        adresse: aDomicile() ? el.adresse.value.trim() : null,
        reglement: reglementChoisi(),
        // Le NOM du groupe, déclaré dans l'en-tête de chaque page. Sans
        // lui, deux liens privés rempliraient la même case et on ne
        // saurait plus lequel a amené la cliente.
        groupe: groupeDeLaPage(),
        origin: window.location.origin,
      }),
    })
      .then(function (r) {
        return r.json().then(function (corps) {
          return { ok: r.ok, corps: corps };
        });
      })
      .then(function (res) {
        if (res.ok && res.corps.url) {
          window.location.href = res.corps.url;
          return;
        }
        // Règlement en espèces : il n'y a rien à payer maintenant, donc
        // aucune page Stripe où aller. Le rendez-vous est déjà confirmé.
        if (res.ok && res.corps.confirme) {
          ecranEspeces(res.corps);
          return;
        }
        rendreBouton();

        var base = res.corps.erreur || "Impossible d'ouvrir le paiement.";
        montrerErreur(res.corps.detail ? base + " (" + res.corps.detail + ")" : base);

        // Un créneau pris pendant qu'on remplissait : on rafraîchit la
        // liste pour ne pas laisser cliquer deux fois sur le même refus.
        if (res.corps.code === "creneau_deja_pris" || res.corps.code === "creneau_inconnu") {
          choix = null;
          el.bloc2.classList.remove("rv-ouvert");
          el.bloc2.setAttribute("aria-hidden", "true");
          chargerCreneaux();
        }
        // Une adresse hors zone ou illisible : on remet le curseur dedans
        // plutôt que de laisser chercher ce qui ne va pas.
        if (res.corps.code === "hors_zone" ||
            res.corps.code === "adresse_non_localisee") {
          if (el.adresse) { el.adresse.focus(); el.adresse.select(); }
        }
      })
      .catch(function () {
        rendreBouton();
        montrerErreur(
          "La connexion a été interrompue. Vérifiez votre réseau et réessayez — " +
          "rien n'a été débité."
        );
      });
  }

  function ecranEspeces(corps) {
    el.voileTitre.textContent = "C'est noté";
    el.voileTexte.innerHTML =
      "Votre rendez-vous est enregistré pour le <strong>" +
      escapeHtml(corps.quand || "") + "</strong>.<br><br>" +
      "Natacha se déplace chez vous. Il n'y a rien à régler maintenant : " +
      "le paiement se fait sur place, en espèces, le jour même" +
      (corps.montant_cents ? " — <strong>" + euros(corps.montant_cents) + "</strong>" : "") +
      ".<br><br>Vous allez recevoir un e-mail de confirmation, avec le rendez-vous " +
      "à ajouter à votre agenda.";
    el.voile.hidden = false;
    if (el.voileSceau) el.voileSceau.classList.add("rv-sceau-anime");
  }

  function rendreBouton() {
    el.payer.disabled = false;
    el.payer.querySelector(".rv-payer-texte").textContent = "Réserver et régler";
  }

  // ─── Le retour de paiement ───────────────────────────────────────────

  function ecranRetour() {
    var params = new URLSearchParams(window.location.search);
    var e = params.get("etat");
    if (e !== "confirme" && e !== "abandon") return;

    if (e === "confirme") {
      el.voileSceau.textContent = "✓";
      el.voile.classList.remove("rv-neutre");
      el.voileTitre.textContent = "C'est noté, votre rendez-vous est pris";
      // Ce texte s'affiche aussi bien après un rendez-vous par téléphone
      // qu'après un rendez-vous à domicile : il ne doit donc promettre ni un
      // appel ni une visite. Le détail exact est dans l'e-mail.
      el.voileTexte.textContent =
        "Vous allez recevoir un e-mail de confirmation avec la date, l'heure " +
        "et tout ce qu'il faut savoir pour le jour J. " +
        "Vous n'avez plus rien à faire.";
    } else {
      el.voileSceau.textContent = "↺";
      el.voile.classList.add("rv-neutre");
      el.voileTitre.textContent = "Rien n'a été débité";
      el.voileTexte.textContent =
        "Le paiement a été interrompu, votre créneau est de nouveau libre. " +
        "Vous pouvez recommencer tranquillement, il est peut-être encore disponible.";
    }
    el.voile.hidden = false;
    el.voileFermer.focus();
  }

  el.voileFermer.addEventListener("click", function () {
    el.voile.hidden = true;
    // On nettoie l'adresse : un rechargement ne doit pas réafficher la
    // confirmation d'un rendez-vous déjà pris.
    history.replaceState(null, "", window.location.pathname);
    charger();
  });

  // ─── Chargement ──────────────────────────────────────────────────────

  // On charge d'abord l'offre du lien — quelles formules, à quels prix —
  // puis les créneaux de la formule retenue. En deux temps, parce qu'une
  // Guidance de deux heures n'a pas les mêmes départs possibles qu'un
  // tirage de trente minutes.
  function chargerCreneaux() {
    fetch(CONFIG.API + "?lien=" + encodeURIComponent(lienDeLaPage()) +
          "&formule=" + encodeURIComponent(formule), { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data && data.erreur) throw new Error(data.erreur);
        etat = data;
        afficherAgenda();
      })
      .catch(enPanne);
  }

  function charger() {
    fetch(CONFIG.API + "?lien=" + encodeURIComponent(lienDeLaPage()),
          { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data && data.erreur) throw new Error(data.erreur);
        offre = data;

        if (!offre.ouverte) {
          el.prix.innerHTML = '<span class="rv-prix-chargement">Rendez-vous en pause</span>';
          el.agenda.innerHTML = '<p class="rv-vide">' +
            escapeHtml(offre.message_pause ||
              "Les rendez-vous sont momentanément en pause. Revenez bientôt.") +
            "</p>";
          return;
        }
        if (!offre.formules || !offre.formules.length) {
          throw new Error("aucune formule proposée sur ce lien");
        }

        // Un seul choix possible : inutile de faire choisir. Les deux pages
        // privées sont dans ce cas, et leur parcours ne change pas d'un
        // geste par rapport à aujourd'hui.
        if (offre.formules.length === 1) {
          if (el.blocFormules) el.blocFormules.hidden = true;
          formule = offre.formules[0].code;
          afficherPrix();
          adapterChamps();
          chargerCreneaux();
          return;
        }

        if (el.blocFormules) el.blocFormules.hidden = false;
        renumeroterEtapes();
        afficherFormules();

        // Une formule peut être demandée dans l'adresse de la page :
        // /reserver/?formule=generale-dom. Les boutons « Réserver » de
        // l'accueil s'en servent pour amener la visiteuse directement sur la
        // bonne ligne au lieu de la faire rechoisir ce qu'elle vient déjà de
        // choisir. Un code inconnu est ignoré sans rien casser.
        var demandee = new URLSearchParams(window.location.search).get("formule");
        if (demandee && existeFormule(demandee)) {
          choisirFormule(demandee);
          amenerALaFormule();
          return;
        }

        el.prix.innerHTML =
          '<span class="rv-prix-chargement">Choisissez votre formule ci-dessous</span>';
        el.agenda.innerHTML =
          '<p class="rv-attente">Choisissez d\'abord une formule.</p>';
      })
      .catch(enPanne);
  }

  function enPanne(err) {
        el.prix.innerHTML =
          '<span class="rv-prix-chargement">Tarif momentanément indisponible</span>';
        el.agenda.innerHTML =
          '<p class="rv-vide">Je n\'arrive pas à afficher mon agenda pour le moment. ' +
          'Appelez-moi au <a href="tel:+33627815276" style="color:#cc9e58">06 27 81 52 76</a> ' +
          "ou écrivez-moi sur " +
          '<a href="https://wa.me/33627815276" style="color:#cc9e58">WhatsApp</a>, ' +
          "je vous donne un rendez-vous de vive voix.</p>";
        // Journalisé mais pas affiché : le détail technique n'aide pas la
        // cliente, et le numéro de téléphone, lui, règle son problème.
        if (window.console) console.error("rendez-vous :", err);
  }

  // Quand une étape s'ajoute devant, les suivantes se décalent. Laisser
  // deux « 1 » à l'écran suffit à faire douter.
  function renumeroterEtapes() {
    var etapes = document.querySelectorAll(".rv-bloc:not([hidden]) .rv-etape");
    for (var i = 0; i < etapes.length; i++) etapes[i].textContent = String(i + 1);
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  el.telephone.addEventListener("input", rafraichirApercu);
  el.pays.addEventListener("change", rafraichirApercu);
  el.form.addEventListener("submit", envoyer);
  ecranRetour();
  charger();
})();
