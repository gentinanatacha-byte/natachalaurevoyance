/* ═══════════════════════════════════════════════════════════════════════
   mon-bon.js — la page qui affiche et imprime une carte cadeau

   Elle lit le code dans l'adresse (?c=CC-ABC-123), demande la carte au
   serveur, et la dessine.

   Le seul moment délicat est le retour de paiement : Stripe renvoie
   l'acheteur ici immédiatement, mais la confirmation du paiement nous
   parvient par un autre chemin, qui met parfois une seconde ou deux de
   plus. Afficher « carte introuvable » à ce moment-là serait une petite
   catastrophe — quelqu'un vient de payer. On patiente donc, et on
   redemande, pendant une trentaine de secondes.
   ═══════════════════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  /* Greffé sur carte-cadeau : voir la note dans achat-noel.js. */
  var API = "https://aurea.natachalaurevoyance.fr/api/carte-cadeau?quoi=bon";

  var attente = document.getElementById("bon-attente");
  var contenu = document.getElementById("bon-contenu");
  var absent  = document.getElementById("bon-absent");
  var carte   = document.getElementById("carte");

  var parametres = new URLSearchParams(location.search);
  var code    = CarteNoel.normaliserCode(parametres.get("c") || parametres.get("code") || "");
  var retourDePaiement = parametres.get("etat") === "nouveau";

  /* Combien de fois réessayer. Hors retour de paiement, une seule
     tentative suffit : le code vient d'un e-mail, la carte existe ou
     n'existe pas. */
  var ESSAIS_MAX = retourDePaiement ? 20 : 1;
  var ATTENTE_MS = 1500;
  var essai = 0;

  function montrer(quoi) {
    [attente, contenu, absent].forEach(function (el) {
      if (el) el.hidden = el !== quoi;
    });
  }

  if (!/^CC-[A-Z0-9]{3}-[A-Z0-9]{3}$/.test(code)) {
    montrer(absent);
    return;
  }

  function demander() {
    essai++;
    fetch(API + "&c=" + encodeURIComponent(code), { headers: { Accept: "application/json" } })
      .then(function (r) { return r.json().catch(function () { return {}; }); })
      .then(function (bon) {
        if (bon && bon.trouve) return afficher(bon);
        if (essai < ESSAIS_MAX) return setTimeout(demander, ATTENTE_MS);
        montrer(absent);
      })
      .catch(function () {
        if (essai < ESSAIS_MAX) return setTimeout(demander, ATTENTE_MS);
        montrer(absent);
      });
  }

  function afficher(bon) {
    CarteNoel.remplir(carte, {
      destinataire: bon.destinataire,
      mot: bon.mot,
      code: bon.reference,
    });

    var sceau    = document.getElementById("bon-sceau");
    var titre    = document.getElementById("bon-titre");
    var chapeau  = document.getElementById("bon-chapeau");
    var validite = document.getElementById("bon-validite");

    /* Une carte déjà honorée, ou périmée, reste affichée : son
       détenteur a le droit de la revoir. Mais il doit le savoir avant
       de l'offrir, pas en me téléphonant. */
    if (bon.statut === "utilisee") {
      sceau.className = "bon-sceau utilisee";
      sceau.textContent = "Déjà utilisée";
      titre.textContent = "Cette carte a déjà été honorée";
      chapeau.textContent = "La consultation a eu lieu. La carte reste consultable, mais elle ne peut plus être utilisée.";
    } else if (bon.expire) {
      sceau.className = "bon-sceau expire";
      sceau.textContent = "Date dépassée";
      titre.textContent = "Cette carte a dépassé sa date";
      chapeau.innerHTML = "Elle était valable jusqu'au " + CarteNoel.dateLisible(bon.valide_jusqu_au) +
        ". Appelez-moi au <a href=\"tel:+33627815276\" style=\"color:var(--noel-or-clair)\">06 27 81 52 76</a>, nous trouverons une solution.";
    } else {
      sceau.textContent = "";
      titre.textContent = retourDePaiement
        ? "Merci — votre carte est prête"
        : "Votre carte cadeau";
      chapeau.textContent = "Pour " + bon.destinataire +
        " · valable jusqu'au " + CarteNoel.dateLisible(bon.valide_jusqu_au) + ".";
    }

    if (validite) {
      validite.innerHTML = "<strong>Valable jusqu'au " +
        CarteNoel.dateLisible(bon.valide_jusqu_au) + "</strong> · " +
        "Carte nominative mais cessible, non remboursable et non échangeable contre des espèces.";
    }

    document.title = "Carte cadeau " + bon.reference + " — Natacha Laure Voyance";
    montrer(contenu);
  }

  /* ── Les deux boutons ─────────────────────────────────────────────── */

  var bImprimer = document.getElementById("bon-imprimer");
  if (bImprimer) {
    bImprimer.addEventListener("click", function () {
      // Les polices et le visuel doivent être là AVANT l'impression,
      // sinon la feuille sort avec un cadre vide.
      var pret = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
      var fond = document.getElementById("carte-fond");
      var image = (fond && !fond.complete)
        ? new Promise(function (ok) { fond.addEventListener("load", ok); fond.addEventListener("error", ok); })
        : Promise.resolve();
      Promise.all([pret, image]).then(function () { setTimeout(function () { window.print(); }, 60); });
    });
  }

  var bCopier = document.getElementById("bon-copier");
  if (bCopier) {
    bCopier.addEventListener("click", function () {
      var lien = location.origin + location.pathname + "?c=" + encodeURIComponent(code);
      var dire = function (t) {
        bCopier.textContent = t;
        setTimeout(function () { bCopier.textContent = "Copier le lien"; }, 2200);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(lien).then(function () { dire("Lien copié ✓"); },
                                                 function () { dire("Copie refusée"); });
      } else {
        // Vieux navigateurs, et pages servies sans HTTPS.
        var z = document.createElement("textarea");
        z.value = lien; z.setAttribute("readonly", "");
        z.style.position = "absolute"; z.style.left = "-9999px";
        document.body.appendChild(z); z.select();
        try { document.execCommand("copy"); dire("Lien copié ✓"); }
        catch (e) { dire("Copie refusée"); }
        document.body.removeChild(z);
      }
    });
  }

  demander();
})();
