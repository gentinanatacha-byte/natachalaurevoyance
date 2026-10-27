/* ═══════════════════════════════════════════════════════════════════════
   achat-carte.js — l'achat d'une carte cadeau, toutes formules

   Trois choses :
     · les formules sont chargées depuis les TARIFS, pas écrites ici ;
     · l'aperçu de la carte se remplit à mesure que l'on choisit et
       que l'on tape — durée et modalité comprises ;
     · le formulaire part au serveur, qui renvoie l'adresse de Stripe.

   Le prix n'est jamais calculé dans le navigateur. La page l'affiche,
   le serveur le décide : on ne lui envoie que le CODE de la formule.
   ═══════════════════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  var API = "https://aurea.natachalaurevoyance.fr/api/carte-cadeau";

  var form   = document.getElementById("cc-form");
  var carte  = document.getElementById("carte");
  var erreur = document.getElementById("cc-erreur");
  var bouton = document.getElementById("cc-envoyer");
  var bacFormules = document.getElementById("cc-formules");
  if (!form || !carte) return;

  var champs = {
    destinataire: document.getElementById("cc-destinataire"),
    mot:          document.getElementById("cc-mot"),
    offrant:      document.getElementById("cc-offrant"),
    email:        document.getElementById("cc-email"),
    telephone:    document.getElementById("cc-telephone"),
    cgv:          document.getElementById("cc-cgv"),
    optin:        document.getElementById("cc-optin"),
  };

  var formules = [];
  var choisie = null;

  /* ── L'aperçu ─────────────────────────────────────────────────────
     Le code affiché est un leurre assumé : le vrai est tiré par la base
     au moment du paiement. Écrire « CC-•••-••• » plutôt qu'un faux code
     évite de laisser croire que celui-ci sera le bon. */
  function rafraichir() {
    CarteNoel.remplir(carte, {
      destinataire: champs.destinataire.value,
      mot: champs.mot.value,
      duree: choisie ? choisie.duree : "",
      modalite: choisie ? choisie.mode_nom : "",
      code: "CC-•••-•••",
    });
  }

  function compteur(champ, sortie, max) {
    if (!champ || !sortie) return;
    var n = champ.value.length;
    sortie.textContent = n + "/" + max;
    sortie.className = "noel-compteur" + (n >= max ? " plein" : n > max * 0.85 ? " serre" : "");
  }
  var cDest = document.getElementById("cc-c-destinataire");
  var cMot  = document.getElementById("cc-c-mot");

  ["input", "change"].forEach(function (ev) {
    champs.destinataire.addEventListener(ev, function () { compteur(champs.destinataire, cDest, 24); rafraichir(); });
    champs.mot.addEventListener(ev, function () { compteur(champs.mot, cMot, 100); rafraichir(); });
  });

  /* ── Les formules ────────────────────────────────────────────────
     Deux groupes bien séparés plutôt qu'une liste en vrac : « par
     téléphone » et « à domicile » ne s'adressent pas aux mêmes gens,
     et le prix n'est pas le même. */
  function dessinerFormules() {
    if (!formules.length) {
      bacFormules.innerHTML = '<p class="aide" style="color:#f0b9a6;">' +
        'Les formules ne se chargent pas pour le moment. Appelez-moi au ' +
        '<a href="tel:+33627815276" style="color:var(--noel-or-clair)">06 27 81 52 76</a>, ' +
        'je prépare la carte à la main.</p>';
      return;
    }
    var groupes = [
      { mode: "telephone", titre: "Par téléphone", precision: "Partout en France" },
      { mode: "domicile",  titre: "Chez elle",     precision: "Dans un rayon de 15 km autour de Saint-Laurent-du-Var" },
    ];
    var html = "";
    groupes.forEach(function (g) {
      var liste = formules.filter(function (f) { return f.mode === g.mode; });
      if (!liste.length) return;
      html += '<div class="cc-groupe"><p class="cc-groupe-titre">' + CarteNoel.echapper(g.titre) +
              '<span>' + CarteNoel.echapper(g.precision) + '</span></p><div class="cc-groupe-cartes">';
      liste.forEach(function (f) {
        html += '<button type="button" class="cc-formule" data-code="' + CarteNoel.echapper(f.code) + '">' +
                '<span class="cc-formule-nom">' + CarteNoel.echapper(f.nom) + '</span>' +
                '<span class="cc-formule-duree">' + CarteNoel.echapper(f.duree) + '</span>' +
                '<span class="cc-formule-prix">' + f.prix + '&nbsp;€</span></button>';
      });
      html += "</div></div>";
    });
    bacFormules.innerHTML = html;

    Array.prototype.forEach.call(bacFormules.querySelectorAll(".cc-formule"), function (b) {
      b.addEventListener("click", function () { choisir(b.dataset.code); });
    });
  }

  function choisir(code) {
    choisie = formules.filter(function (f) { return f.code === code; })[0] || null;
    Array.prototype.forEach.call(bacFormules.querySelectorAll(".cc-formule"), function (b) {
      b.classList.toggle("retenue", b.dataset.code === code);
    });
    bouton.disabled = !choisie;
    bouton.textContent = choisie
      ? "Offrir cette carte — " + choisie.prix + " €"
      : "Choisissez une formule";
    rafraichir();
  }

  /* ── Les messages d'erreur, en français et sans jargon ───────────── */
  var MOTIFS = {
    email_invalide:        "Cette adresse e-mail ne semble pas valide. Vérifiez-la : c'est là que la carte sera envoyée.",
    prenoms_manquants:     "Il me faut votre prénom et celui de la personne à qui vous offrez la carte.",
    formule_inconnue:      "Cette formule n'est plus disponible. Rechargez la page et choisissez-en une autre.",
    tarifs_indisponibles:  "Je n'arrive pas à lire mes tarifs en ce moment. Réessayez dans un instant, ou appelez-moi au 06 27 81 52 76.",
    trop_de_demandes:      "Vous avez lancé plusieurs commandes aujourd'hui. Réessayez demain, ou appelez-moi au 06 27 81 52 76.",
    serveur:               "Quelque chose a coincé de mon côté. Réessayez dans un instant, ou appelez-moi au 06 27 81 52 76.",
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

    if (!choisie) return direLErreur("Choisissez d'abord la consultation que vous offrez.");
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

    fetch(API + "?quoi=achat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        formule:      choisie.code,
        destinataire: champs.destinataire.value,
        mot:          champs.mot.value,
        offrant:      champs.offrant.value,
        email:        champs.email.value,
        telephone:    champs.telephone.value,
        optin:        champs.optin.checked,
      }),
    })
      .then(function (r) { return r.json().catch(function () { return {}; }); })
      .then(function (rep) {
        if (rep && rep.ok && rep.url) { window.location.href = rep.url; return; }
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

  /* ── Au chargement : les formules ─────────────────────────────────── */
  fetch(API + "?quoi=formules", { headers: { Accept: "application/json" } })
    .then(function (r) { return r.json(); })
    .then(function (rep) {
      formules = (rep && rep.formules) || [];
      dessinerFormules();
      // La formule d'une heure par téléphone est la plus offerte : on la
      // propose d'emblée, sans forcer — un clic suffit pour en changer.
      var defaut = formules.filter(function (f) { return f.code === "generale-tel"; })[0] || formules[0];
      if (defaut) choisir(defaut.code);
    })
    .catch(function () { formules = []; dessinerFormules(); });

  /* ── Retour d'un paiement abandonné ──────────────────────────────── */
  if (new URLSearchParams(location.search).get("etat") === "abandon") {
    direLErreur("Le paiement a été interrompu — rien n'a été débité. " +
                "Vos informations sont toujours là, vous pouvez reprendre.");
  }

  compteur(champs.destinataire, cDest, 24);
  compteur(champs.mot, cMot, 100);
  rafraichir();
})();
