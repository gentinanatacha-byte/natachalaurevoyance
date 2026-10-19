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
    ETAT: "https://aurea.natachalaurevoyance.fr/api/consultation-etat",
    RESERVER: "https://aurea.natachalaurevoyance.fr/api/consultation-reserver",
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
  };

  var etat = null;        // ce que renvoie l'API
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
    var barre = "";
    // Le prix barré ne s'affiche que s'il est RÉELLEMENT supérieur. Barrer
    // un prix identique ou inférieur serait une réduction inventée — et
    // l'article L112-1-1 du code de la consommation ne l'admet pas.
    if (etat.prix_barre_cents > etat.prix_cents) {
      barre = '<span class="rv-prix-barre">' + euros(etat.prix_barre_cents) + "</span>";
    }
    el.prix.innerHTML =
      '<span class="rv-prix-montant">' + euros(etat.prix_cents) + "</span>" +
      barre +
      '<span class="rv-prix-note">Consultation de ' + etat.duree_minutes +
      " minutes, en appel WhatsApp. Réglée une fois, rien d'autre à payer.</span>";

    el.montant.textContent = euros(etat.prix_cents);
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

    if (!choix) {
      souci = { texte: "Choisissez d'abord un créneau ci-dessus.", champ: null };
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

    el.payer.disabled = true;
    el.payer.querySelector(".rv-payer-texte").textContent = "Ouverture du paiement…";

    fetch(CONFIG.RESERVER, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prenom: el.prenom.value.trim(),
        telephone: "+" + numeroInternational(),
        email: el.email.value.trim(),
        debut: choix,
        message: el.message.value.trim() || null,
        // Toujours « promo » : cette page n'est accessible que par le lien
        // envoyé en privé, et elle n'est pas indexée. Qui arrive ici vient
        // forcément de la recommandation. L'étiquette ne donne droit à
        // aucune remise — le montant vient de la base — elle sert à ce que
        // Natacha reconnaisse ces clientes d'un coup d'œil.
        source: "promo",
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
        rendreBouton();

        var base = res.corps.erreur || "Impossible d'ouvrir le paiement.";
        montrerErreur(res.corps.detail ? base + " (" + res.corps.detail + ")" : base);

        // Un créneau pris pendant qu'on remplissait : on rafraîchit la
        // liste pour ne pas laisser cliquer deux fois sur le même refus.
        if (res.corps.code === "creneau_deja_pris" || res.corps.code === "creneau_inconnu") {
          choix = null;
          el.bloc2.classList.remove("rv-ouvert");
          el.bloc2.setAttribute("aria-hidden", "true");
          charger();
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
      el.voileTexte.textContent =
        "Vous allez recevoir un e-mail de confirmation avec la date et l'heure. " +
        "Natacha vous appellera elle-même au numéro que vous avez indiqué — " +
        "vous n'avez plus rien à faire.";
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

  function charger() {
    fetch(CONFIG.ETAT, { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data && data.erreur) throw new Error(data.erreur);
        etat = data;
        afficherPrix();
        afficherAgenda();
      })
      .catch(function (err) {
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
      });
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
