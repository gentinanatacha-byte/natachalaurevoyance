/* ═══════════════════════════════════════════════════════════════════════
   mes-cartes.js — le registre des cartes cadeaux, pour Natacha

   Elle colle sa clé une fois ; le navigateur la retient. La page liste
   les cartes vendues et permet de marquer une carte utilisée après la
   consultation.

   La clé est gardée dans localStorage, c'est-à-dire dans CE navigateur,
   sur CET appareil. Elle n'est jamais envoyée ailleurs qu'à l'API, et
   « Oublier la clé » l'efface complètement.
   ═══════════════════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  var API = "https://aurea.natachalaurevoyance.fr/api/carte-registre";
  var BOITE = "nl-cle-registre";

  var porte    = document.getElementById("reg-porte");
  var contenu  = document.getElementById("reg-contenu");
  var champCle = document.getElementById("reg-cle");
  var souci    = document.getElementById("reg-souci");
  var lignes   = document.getElementById("reg-lignes");
  var vide     = document.getElementById("reg-vide");
  var bilanEl  = document.getElementById("reg-bilan");
  var chercher = document.getElementById("reg-chercher");

  var cartes = [];
  var aujourdhui = "";

  /* localStorage peut être refusé (navigation privée stricte, réglages
     d'entreprise). On ne doit pas pour autant casser la page. */
  function lireCle() {
    try { return localStorage.getItem(BOITE) || ""; } catch (e) { return ""; }
  }
  function ecrireCle(v) {
    try { if (v) localStorage.setItem(BOITE, v); else localStorage.removeItem(BOITE); } catch (e) {}
  }

  function montrerPorte(message) {
    porte.hidden = false;
    contenu.hidden = true;
    souci.textContent = message || "";
    if (champCle) champCle.focus();
  }

  function charger(cle) {
    souci.textContent = "";
    fetch(API, { headers: { "X-Cle-Registre": cle, Accept: "application/json" } })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) {
          return { statut: r.status, corps: j };
        });
      })
      .then(function (rep) {
        if (rep.statut === 401) { ecrireCle(""); return montrerPorte("Cette clé n'est pas la bonne."); }
        if (rep.statut === 429) return montrerPorte("Trop d'essais. Réessayez dans une heure.");
        if (!rep.corps || !rep.corps.ok) return montrerPorte("Le registre n'a pas répondu. Réessayez dans un instant.");

        ecrireCle(cle);
        cartes = rep.corps.cartes || [];
        aujourdhui = rep.corps.aujourdhui || "";
        porte.hidden = true;
        contenu.hidden = false;
        dessinerBilan(rep.corps.bilan || {});
        dessiner();
      })
      .catch(function () { montrerPorte("Je n'arrive pas à joindre le registre. Vérifiez votre connexion."); });
  }

  function dessinerBilan(b) {
    bilanEl.innerHTML =
      bloc(b.a_honorer, "à honorer") +
      bloc(b.utilisees, "utilisées") +
      bloc(b.perimees,  "périmées") +
      bloc((b.encaisse || 0) + " €", "encaissé");
  }
  function bloc(valeur, mot) {
    return "<div><b>" + (valeur == null ? "–" : valeur) + "</b><span>" + mot + "</span></div>";
  }

  function dessiner() {
    var filtre = CarteNoel.normaliserCode(chercher.value || "").replace(/-/g, "");
    var visibles = cartes.filter(function (c) {
      if (!filtre) return true;
      var botte = (c.reference + " " + c.destinataire + " " + c.offrant + " " + (c.email || ""))
        .toUpperCase().replace(/[-\s]/g, "");
      return botte.indexOf(filtre) !== -1;
    });

    vide.hidden = visibles.length > 0;
    lignes.innerHTML = visibles.map(ligne).join("");

    Array.prototype.forEach.call(lignes.querySelectorAll("[data-ref]"), function (b) {
      b.addEventListener("click", function () { basculer(b.dataset.ref, b.dataset.annuler === "1", b); });
    });
  }

  function ligne(c) {
    var faite = c.statut === "utilisee";
    var perimee = !faite && aujourdhui && c.valide_jusqu_au && c.valide_jusqu_au < aujourdhui;

    return "<tr class='" + (faite ? "faite" : "") + "'>" +
      "<td data-titre='Code'><code>" + CarteNoel.echapper(c.reference) + "</code>" +
        (c.mot ? "<div style='color:var(--noel-gris);font-size:.78rem;margin-top:5px;max-width:250px;'>« " +
                 CarteNoel.echapper(c.mot) + " »</div>" : "") + "</td>" +
      "<td data-titre='Pour'>" + CarteNoel.echapper(c.destinataire) + "</td>" +
      "<td data-titre='Offert par'>" + CarteNoel.echapper(c.offrant) +
        "<div style='color:var(--noel-gris);font-size:.78rem;'>" + CarteNoel.echapper(c.email || "") +
        (c.telephone ? "<br>" + CarteNoel.echapper(c.telephone) : "") + "</div></td>" +
      "<td data-titre='Valable jusqu&rsquo;au'>" + CarteNoel.dateLisible(c.valide_jusqu_au) +
        (perimee ? "<div class='reg-perime'>dépassée</div>" : "") +
        (faite && c.utilisee_le ? "<div style='color:var(--noel-gris);font-size:.78rem;'>utilisée le " +
          CarteNoel.dateLisible(c.utilisee_le) + "</div>" : "") + "</td>" +
      "<td data-titre=''><button type='button' class='reg-mini' data-ref='" +
        CarteNoel.echapper(c.reference) + "' data-annuler='" + (faite ? "1" : "0") + "'>" +
        (faite ? "Remettre en service" : "Marquer utilisée") + "</button></td>" +
    "</tr>";
  }

  function basculer(reference, annuler, bouton) {
    bouton.disabled = true;
    var avant = bouton.textContent;
    bouton.textContent = "…";

    fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Cle-Registre": lireCle() },
      body: JSON.stringify({ reference: reference, annuler: annuler }),
    })
      .then(function (r) { return r.json().catch(function () { return {}; }); })
      .then(function (rep) {
        if (!rep || !rep.ok) { bouton.disabled = false; bouton.textContent = avant; return; }
        // On met à jour la ligne sur place : recharger toute la liste
        // ferait sauter la recherche en cours.
        cartes.forEach(function (c) {
          if (c.reference === reference) {
            c.statut = rep.statut;
            c.utilisee_le = rep.utilisee_le || null;
          }
        });
        dessiner();
      })
      .catch(function () { bouton.disabled = false; bouton.textContent = avant; });
  }

  /* ── Branchements ────────────────────────────────────────────────── */

  document.getElementById("reg-entrer").addEventListener("click", function () {
    var v = (champCle.value || "").trim();
    if (v.length < 20) return (souci.textContent = "Cette clé est trop courte pour être la bonne.");
    charger(v);
  });

  champCle.addEventListener("keydown", function (e) {
    if (e.key === "Enter") document.getElementById("reg-entrer").click();
  });

  chercher.addEventListener("input", dessiner);

  document.getElementById("reg-sortir").addEventListener("click", function () {
    ecrireCle("");
    champCle.value = "";
    montrerPorte("Clé oubliée sur cet appareil.");
  });

  /* Au chargement : la clé peut venir de l'adresse (le lien de l'e-mail
     peut en porter une), sinon du navigateur. */
  var depuisUrl = new URLSearchParams(location.search).get("cle");
  if (depuisUrl) {
    history.replaceState(null, "", location.pathname);  // on ne la laisse pas dans la barre
    charger(depuisUrl);
  } else if (lireCle()) {
    charger(lireCle());
  } else {
    montrerPorte();
  }
})();
