/* ═══════════════════════════════════════════════════════════════════════
   carte-noel.js — le remplissage de la carte

   Un seul morceau de code écrit le prénom, le mot et le code sur le
   visuel. Il sert à l'aperçu en direct pendant la saisie ET au bon final
   que l'on imprime. C'est ce qui garantit que l'acheteur reçoit
   exactement ce qu'il a vu — pas une approximation.

   Chargé par /carte-noel/ et par /mon-bon/.
   ═══════════════════════════════════════════════════════════════════════ */

(function (global) {
  "use strict";

  /* Les limites de saisie, identiques à celles du serveur. Celles-ci
     servent au confort (compteur, coupure douce) ; celles du serveur
     font foi. Si les deux divergent un jour, c'est le serveur qui
     tranche — jamais l'inverse. */
  var LIMITES = { destinataire: 24, mot: 140 };

  /* La carte habituelle a un encadré « petit mot » deux fois moins haut
     que celle de Noël : 96 px contre 185 sur l'original. On lit donc la
     limite sur la carte elle-même (data-mot-max) quand elle en porte
     une, plutôt que d'imposer la même à deux dessins différents. */
  function limiteMot(carte) {
    var v = carte && carte.getAttribute ? parseInt(carte.getAttribute("data-mot-max"), 10) : NaN;
    return isNaN(v) ? LIMITES.mot : v;
  }

  /* Corps de départ, en pourcentage de la largeur de la carte. Ce sont
     les valeurs du fichier CSS ; elles ne sont rappelées ici que pour
     pouvoir les réduire quand un mot déborde. */
  var CORPS = { pour: 2.7, mot: 2.25, code: 2.1, duree: 2.5, modalite: 2.5 };

  /* La carte habituelle est plus large (1672 px contre 1536) : à
     pourcentage égal le texte y serait plus gros. Ses corps propres
     sont donc déclarés à part. */
  var CORPS_STANDARD = { pour: 2.5, mot: 1.95, code: 2.0, duree: 2.5, modalite: 2.5 };

  /* Les unités « cqw » (1 % de la largeur du conteneur) laissent le
     navigateur recalculer les tailles tout seul, y compris au moment de
     l'impression où la carte change de largeur. Les navigateurs d'avant
     2023 ne les connaissent pas : on repasse alors en pixels, recalculés
     à chaque redimensionnement et avant chaque impression. */
  var CQW = (function () {
    try { return global.CSS && CSS.supports && CSS.supports("font-size", "1cqw"); }
    catch (e) { return false; }
  })();

  function echapper(t) {
    return String(t == null ? "" : t).replace(/[<>&"]/g, function (c) {
      return { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c];
    });
  }

  /** Applique un corps à un champ, dans l'unité que le navigateur comprend. */
  function poserCorps(carte, champ, valeurCqw) {
    if (!champ) return;
    if (CQW) {
      champ.style.fontSize = valeurCqw + "cqw";
    } else {
      var l = carte.getBoundingClientRect().width || carte.offsetWidth || 0;
      champ.style.fontSize = (l * valeurCqw / 100).toFixed(2) + "px";
    }
  }

  /* ── Le rattrapage de débordement ──────────────────────────────────
     Les 140 signes sont calculés pour tenir dans l'encadré. Mais
     « MAMAN JE T'AIME » en capitales larges occupe bien plus de place
     que la même longueur en minuscules. Plutôt que d'interdire les
     capitales, on réduit le corps par petits pas jusqu'à ce que le
     texte retombe dans la boîte. Six pas suffisent toujours ; au-delà,
     on s'arrête, la boîte masque le reste. */
  function ajuster(carte, champ, depart) {
    if (!champ) return;
    var corps = depart, pas = 0;
    poserCorps(carte, champ, corps);
    while (pas < 6 && champ.scrollHeight > champ.clientHeight + 1) {
      corps -= depart * 0.07;
      poserCorps(carte, champ, corps);
      pas++;
    }
  }

  /**
   * Écrit les trois champs sur une carte.
   * @param {Element} carte   le conteneur .carte
   * @param {Object}  donnees { destinataire, mot, code }
   */
  function remplir(carte, donnees) {
    if (!carte) return;
    var d = donnees || {};
    var C = carte.classList && carte.classList.contains("carte--standard")
      ? CORPS_STANDARD : CORPS;

    var pour     = carte.querySelector(".carte-pour");
    var mot      = carte.querySelector(".carte-mot");
    var code     = carte.querySelector(".carte-code");
    var duree    = carte.querySelector(".carte-duree");
    var modalite = carte.querySelector(".carte-modalite");

    if (pour) {
      pour.textContent = String(d.destinataire || "").slice(0, LIMITES.destinataire);
      poserCorps(carte, pour, C.pour);
      // Un prénom très long ne doit pas sortir de l'encadré : on le
      // resserre horizontalement au lieu de le couper.
      pour.style.transform = "";
      var large = pour.scrollWidth, dispo = pour.clientWidth;
      if (dispo && large > dispo) {
        poserCorps(carte, pour, C.pour * Math.max(0.6, dispo / large));
      }
    }

    if (mot) {
      mot.textContent = String(d.mot || "").slice(0, limiteMot(carte));
      ajuster(carte, mot, C.mot);
    }

    if (code) {
      code.textContent = String(d.code || "");
      poserCorps(carte, code, C.code);
    }

    /* Les deux champs propres à la carte habituelle. Ils n'existent pas
       sur celle de Noël, dont la durée et le mode sont gravés dans le
       visuel : on ne fait rien s'ils sont absents. */
    [[duree, d.duree, C.duree], [modalite, d.modalite, C.modalite]].forEach(function (p) {
      if (!p[0]) return;
      p[0].textContent = String(p[1] || "");
      poserCorps(carte, p[0], p[2]);
      var large = p[0].scrollWidth, dispo = p[0].clientWidth;
      if (dispo && large > dispo) poserCorps(carte, p[0], p[2] * Math.max(0.6, dispo / large));
    });

    // En mode pixels, les tailles doivent être refaites quand la carte
    // change de largeur — y compris juste avant l'impression.
    if (!CQW && !carte.__suivi) {
      carte.__suivi = true;
      carte.classList.add("sans-cqw");
      var refaire = function () { remplir(carte, carte.__dernier || d); };
      if (global.ResizeObserver) new ResizeObserver(refaire).observe(carte);
      else global.addEventListener("resize", refaire);
      global.addEventListener("beforeprint", refaire);
    }
    carte.__dernier = d;
  }

  global.CarteNoel = {
    remplir: remplir,
    limites: LIMITES,
    limiteMot: limiteMot,
    echapper: echapper,
    /** Normalise un code tapé à la main : « cc abc 123 » → « CC-ABC-123 ». */
    normaliserCode: function (v) {
      return String(v || "").trim().toUpperCase().replace(/\s+/g, "");
    },
    /** « 2027-06-24 » → « 24 juin 2027 ». */
    dateLisible: function (iso) {
      if (!iso) return "";
      var p = String(iso).slice(0, 10).split("-");
      var mois = ["janvier","février","mars","avril","mai","juin","juillet",
                  "août","septembre","octobre","novembre","décembre"];
      return Number(p[2]) + " " + mois[Number(p[1]) - 1] + " " + p[0];
    },
  };
})(window);
