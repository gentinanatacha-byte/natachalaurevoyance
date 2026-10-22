/* ═══════════════════════════════════════════════════════════════════════
   achat-noel.js — la page d'achat de la carte cadeau de Noël

   Deux choses seulement :
     · l'aperçu de la carte se remplit à mesure que l'on tape ;
     · le formulaire part au serveur, qui renvoie l'adresse de Stripe.

   Le prix n'est jamais calculé ici. La page l'affiche, le serveur le
   décide. C'est une règle sans exception : tout ce qui est écrit dans le
   navigateur peut être réécrit par n'importe qui.
   ═══════════════════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  var API = "https://aurea.natachalaurevoyance.fr/api/carte-noel";

  var form    = document.getElementById("noel-form");
  var carte   = document.getElementById("carte");
  var erreur  = document.getElementById("noel-erreur");
  var bouton  = document.getElementById("f-envoyer");
  if (!form || !carte) return;

  var champs = {
    destinataire: document.getElementById("f-destinataire"),
    mot:          document.getElementById("f-mot"),
    offrant:      document.getElementById("f-offrant"),
    email:        document.getElementById("f-email"),
    telephone:    document.getElementById("f-telephone"),
    cgv:          document.getElementById("f-cgv"),
    optin:        document.getElementById("f-optin"),
  };

  /* ── L'aperçu ─────────────────────────────────────────────────────
     Le code affiché est un leurre assumé : le vrai est tiré par la
     base au moment du paiement, et ne peut pas l'être avant. Écrire
     « CC-••• -••• » plutôt qu'un faux code évite de laisser croire
     que celui-ci sera le bon. */
  function rafraichir() {
    CarteNoel.remplir(carte, {
      destinataire: champs.destinataire.value,
      mot: champs.mot.value,
      code: "CC-•••-•••",
    });
  }

  function compteur(champ, sortie, max) {
    if (!champ || !sortie) return;
    var n = champ.value.length;
    sortie.textContent = n + "/" + max;
    sortie.className = "noel-compteur" +
      (n >= max ? " plein" : n > max * 0.85 ? " serre" : "");
  }

  var cDest = document.getElementById("c-destinataire");
  var cMot  = document.getElementById("c-mot");

  ["input", "change"].forEach(function (ev) {
    champs.destinataire.addEventListener(ev, function () {
      compteur(champs.destinataire, cDest, 24); rafraichir();
    });
    champs.mot.addEventListener(ev, function () {
      compteur(champs.mot, cMot, 140); rafraichir();
    });
  });

  /* ── Les messages d'erreur, en français et sans jargon ───────────── */
  var MOTIFS = {
    email_invalide:    "Cette adresse e-mail ne semble pas valide. Vérifiez-la : c'est là que la carte sera envoyée.",
    prenoms_manquants: "Il me faut votre prénom et celui de la personne à qui vous offrez la carte.",
    trop_de_demandes:  "Vous avez lancé plusieurs commandes aujourd'hui. Réessayez demain, ou appelez-moi au 06 27 81 52 76.",
    offre_terminee:    "L'offre de Noël est terminée. La page des cartes cadeaux reste ouverte toute l'année.",
    serveur:           "Quelque chose a coincé de mon côté. Réessayez dans un instant, ou appelez-moi au 06 27 81 52 76.",
  };

  function direLErreur(texte) {
    erreur.textContent = texte;
    erreur.hidden = false;
    erreur.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  /* ── L'envoi ─────────────────────────────────────────────────────── */
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    erreur.hidden = true;

    // Contrôles de courtoisie, avant d'embêter le serveur.
    if (!champs.destinataire.value.trim() || !champs.offrant.value.trim()) {
      return direLErreur(MOTIFS.prenoms_manquants);
    }
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(champs.email.value.trim())) {
      return direLErreur(MOTIFS.email_invalide);
    }
    if (!champs.cgv.checked) {
      return direLErreur("Merci d'accepter les conditions générales de vente pour continuer.");
    }

    bouton.disabled = true;
    var libelle = bouton.textContent;
    bouton.textContent = "Ouverture du paiement…";

    fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        destinataire: champs.destinataire.value,
        mot:          champs.mot.value,
        offrant:      champs.offrant.value,
        email:        champs.email.value,
        telephone:    champs.telephone.value,
        optin:        champs.optin.checked,
      }),
    })
      .then(function (r) {
        return r.json().catch(function () { return {}; });
      })
      .then(function (rep) {
        if (rep && rep.ok && rep.url) {
          // On quitte le site pour Stripe : pas de retour en arrière ici,
          // le bouton reste désactivé le temps de la bascule.
          window.location.href = rep.url;
          return;
        }
        bouton.disabled = false;
        bouton.textContent = libelle;
        direLErreur(MOTIFS[rep && rep.raison] || MOTIFS.serveur);
      })
      .catch(function () {
        bouton.disabled = false;
        bouton.textContent = libelle;
        direLErreur("Je n'arrive pas à joindre le serveur. Vérifiez votre connexion, puis réessayez.");
      });
  });

  /* ── L'état de l'offre ───────────────────────────────────────────
     Le serveur fait foi : si l'offre est close, la page se ferme même
     si quelqu'un a gardé l'onglet ouvert depuis des semaines. */
  fetch(API, { headers: { Accept: "application/json" } })
    .then(function (r) { return r.json(); })
    .then(function (o) {
      if (!o) return;

      var echeance = document.getElementById("noel-echeance");
      if (echeance && o.fin) {
        // « jusqu'au 25 décembre » se lit mieux que « ... 25 décembre 2026 ».
        // L'année n'est écrite que si l'offre déborde sur la suivante.
        var lisible = CarteNoel.dateLisible(o.fin);
        if (o.fin.slice(0, 4) === String(new Date().getFullYear())) {
          lisible = lisible.replace(/\s\d{4}$/, "");
        }
        echeance.textContent = "Offre de Noël, jusqu'au " + lisible;
      }

      if (o.ouverte === false) {
        bouton.disabled = true;
        bouton.textContent = "Offre de Noël terminée";
        direLErreur(MOTIFS.offre_terminee +
          " Rendez-vous sur la page des cartes cadeaux pour toutes les autres formules.");
      }
    })
    .catch(function () { /* sans réponse, la page reste telle quelle */ });

  /* ── Retour d'un paiement abandonné ──────────────────────────────── */
  if (new URLSearchParams(location.search).get("etat") === "abandon") {
    direLErreur("Le paiement a été interrompu — rien n'a été débité. " +
                "Vos informations sont toujours là, vous pouvez reprendre.");
  }

  // Premier rendu, pour que la carte ne soit pas vide à l'arrivée.
  compteur(champs.destinataire, cDest, 24);
  compteur(champs.mot, cMot, 140);
  rafraichir();
})();
