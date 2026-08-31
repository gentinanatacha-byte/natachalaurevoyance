# 🎡 LA ROUE DES CADEAUX — notice d'installation

Trois étapes, dans cet ordre. **Après l'étape 1, la roue tourne déjà**
(en mode démonstration) : tu peux valider le look avant de brancher quoi que
ce soit.

---

## ⚠️ D'ABORD : LES TROIS ÉTATS DE LA ROUE

En haut de `assets/js/roue.js`, deux réglages commandent tout.

| État | `PRIVE` | `API` | Qui voit quoi |
|---|---|---|---|
| **1. Privé** *(livré comme ça)* | `true` | vide | Personne ne voit rien. Toi seule, avec `?roue=1` dans l'adresse. |
| **2. Démonstration publique** | `false` | vide | Tout le monde voit la roue, mais **aucun email ne part** et on peut rejouer à l'infini. |
| **3. En service** | `false` | remplie | Une adresse = un tour, email envoyé automatiquement. |

**Ne reste jamais dans l'état 2 en production.** Une visiteuse gagnerait « 30
minutes offertes », verrait l'affiche, et ne recevrait jamais rien. C'est une
promesse en l'air faite à une future cliente.

Le bon chemin : uploader en état 1 → tout tester tranquillement → faire les
étapes 2 et 3 → passer en état 3 d'un coup.

---

## ÉTAPE 1 — Le site (5 min) → tu peux uploader sans aucun risque

Dans le dossier `site-a-uploader-sur-github/`, tous les fichiers sont
**complets** : tu les déposes tels quels dans ton repo GitHub, ils écrasent
les anciens.

⚠️ **N'uploade QUE le contenu de `site-a-uploader-sur-github/`**, en
respectant les dossiers. Les deux autres dossiers du ZIP (`aurea-vercel/` et
`supabase/`) n'ont rien à faire dans le repo du site.

```
NOUVEAUX
  assets/css/roue.css        la feuille de style de la roue
  assets/js/roue.js          tout le jeu (roue, animation, formulaire)
  assets/images/roue/        tes 6 affiches, en 2 formats (voir plus bas)
  reglement-jeu.html         le règlement, obligatoire (voir plus bas)

MODIFIÉS (une ou deux lignes seulement dans chacun)
  index.html                 + la ligne de script, + lien règlement au pied
  evenements.html            idem
  blog/index.html            + la ligne de script
  aurea/index.html           + script SANS pop-up auto, + lien règlement
  aurea/guide/index.html     + lien règlement
  _layouts/post.html         + la ligne de script (→ tous les articles)
  _includes/footer.html      + lien règlement
  confidentialite.html       + section « 4 septies » sur le jeu
```

GitHub → **Add file → Upload files** → glisser en respectant les dossiers →
**Commit**. Le rebuild prend ~2 min.

➡️ À ce stade, **tes visiteurs ne voient absolument rien** : ni pop-up, ni
bandeau, ni bouton 🎁. Le site est exactement comme avant pour eux.

Pour la voir, toi, ajoute `?roue=1` à la fin de l'adresse :

```
https://natachalaurevoyance.fr/?roue=1
```

La roue s'ouvre, tourne, sonne, affiche ton affiche de lot. Elle reste
visible tant que tu ne fermes pas l'onglet, même en changeant de page — pas
besoin de remettre `?roue=1` partout. Une mention **« Mode démonstration »**
sous le formulaire te rappelle qu'aucun email ne part encore.

---

## ÉTAPE 2 — La base de données (2 min)

Supabase → projet **aurea-tarot** → **SQL Editor** → coller
`supabase/supabase-roue.sql` → **Run**.

Ça crée **une seule table**, `roue_participations`. Rien d'existant n'est
touché — ni les profils, ni les crédits, ni la fidélité.

C'est cette table, et sa contrainte d'unicité, qui garantit qu'une adresse
ne joue qu'une fois. Pas le navigateur : un compteur dans le navigateur se
remet à zéro en navigation privée.

À la fin du fichier, j'ai laissé une série de requêtes toutes prêtes,
en commentaire : voir les derniers gagnants, retrouver quelqu'un par son
code, marquer un lot comme utilisé, exporter les inscrits newsletter.

---

## ÉTAPE 3 — Le serveur et les emails (10 min)

### 3a. Déposer la fonction

Copier `aurea-vercel/api/roue.js` dans le dossier `api/` de ton projet
Auréa (à côté de `create-checkout.js`), puis :

```
vercel --prod
```

### 3b. Vérifier UNE variable d'environnement

⚠️ **C'est le seul point que je n'ai pas pu vérifier moi-même.**

Ouvre ton fichier `api/envoyer-verif-email.js` et regarde le nom de la
variable qui contient la clé Brevo. Si c'est bien `BREVO_API_KEY`, tout est
déjà en place. Sinon, dis-le-moi ou ajoute la même variable sur Vercel
(Settings → Environment Variables).

Mon fichier accepte trois noms possibles : `BREVO_API_KEY`, `BREVO_KEY`,
`VITE_BREVO_API_KEY`.

Variables facultatives :
- `BREVO_SENDER` — expéditeur (défaut `natachaweb.seo@gmail.com`,
  l'adresse vérifiée chez Brevo)
- `EMAIL_NATACHA` — où tu reçois la notification de chaque gain
  (défaut `natachalaure.voyance@gmail.com`)

### 3c. Ouvrir la roue au public

Dans `assets/js/roue.js`, deux lignes à changer **en même temps** :

```js
PRIVE: false,
API: 'https://aurea.natachalaurevoyance.fr/api/roue',
```

Re-commit sur GitHub. **C'est tout.** À partir de là : une adresse = un tour,
un email de gain part automatiquement avec l'affiche, et tu reçois une
notification à chaque participation.

**Avant de faire ça**, un dernier essai en état 1 avec l'API branchée : tu es
la seule à voir la roue, mais l'email part pour de bon. Tu vérifies que tu le
reçois, que l'affiche s'affiche dedans, et que ton adresse ne peut pas
rejouer. Ensuite seulement tu passes `PRIVE` à `false`.

⚠️ Ton adresse de test aura consommé son tour. Pour la remettre à zéro, la
requête `delete` est en bas de `supabase-roue.sql`.

---

## COMMENT ÇA MARCHE, EN CLAIR

1. Le visiteur saisit son email et clique sur **CLIQUEZ ICI**.
2. Le navigateur envoie l'adresse au serveur. **C'est le serveur qui tire
   le lot**, jamais le navigateur — sinon il suffirait d'ouvrir la console
   pour s'attribuer la demi-heure offerte.
3. Le serveur vérifie que l'adresse n'a jamais joué, enregistre la
   participation, génère un code unique, envoie l'email.
4. La roue tourne alors **vers le lot déjà décidé**. L'animation ne fait que
   raconter le résultat.

### L'anti-triche

- `jean+promo@gmail.com` et `j.e.a.n@gmail.com` sont ramenés à la même
  adresse : `jean@gmail.com`. C'est de loin la triche la plus courante,
  elle devient sans effet.
- 5 participations maximum par jour et par connexion internet.
- **Ce que ça n'empêche pas**, et il faut le savoir : rien n'interdit de
  créer de vraies adresses différentes. Aucun serveur ne peut le bloquer
  sans demander une carte bancaire. Le but est de rendre la triche plus
  coûteuse que le cadeau, pas impossible.

---

## LES LOTS ET LEURS FRÉQUENCES

| Lot | Fréquence | Ce que ça te coûte |
|---|---|---|
| 5 crédits Auréa | 34 % | quelques centimes d'API |
| Croix affinée + 2 crédits | 26 % | quelques centimes |
| Bon de 10 € | 18 % | 10 € — mais seulement si réservation |
| 1 question offerte | 12 % | ~10 min de ton temps |
| −20 % | 8 % | 8 à 29 € selon la formule |
| **30 min offertes** | **2 %** | **40 €** |

Sur **1 000 tours**, tu offres environ **20 demi-heures** (10 h de ton temps)
et **80 remises de 20 %**. Les deux tiers des lots ne te coûtent
pratiquement rien et ramènent des gens dans Auréa. C'est un bon équilibre —
mais surveille la colonne « 30 min » dans Supabase, c'est la seule ligne qui
peut peser.

Pour changer une fréquence, il faut modifier **les deux** fichiers
(`assets/js/roue.js` ET `api/roue.js`) — dis-le-moi, je te fais la nouvelle
version.

---

## LES LOTS AURÉA NE SONT PAS ENCORE AUTOMATIQUES

C'est le seul morceau qui manque, et je préfère le dire clairement.

Quand quelqu'un gagne « 5 crédits » ou « le tirage débloqué », il reçoit
un email avec son code — mais **les crédits ne sont pas encore versés tout
seuls dans son compte Auréa**. Il faut les ajouter à la main pour l'instant.

Je n'ai pas voulu deviner : je n'ai pas ton schéma Supabase sous les yeux et
je ne connais pas le nom exact de la colonne qui stocke les tirages débloqués.
**Envoie-moi `supabase-fidelite.sql` ou une capture de tes colonnes de la
table `profiles`**, et je te livre l'automatisation — c'est une petite
fonction, pas un chantier.

En attendant, dans Supabase → SQL Editor :

```sql
-- Créditer 5 crédits à quelqu'un qui a gagné
select ajouter_credits_ia('ID_DU_PROFIL', 5);
```

---

## TES 6 AFFICHES DE LOT

Elles s'affichent **à la révélation du gain** (elles remplacent la pastille
dorée, avec un balayage de lumière qui traverse l'affiche une fois) **et en
haut de l'email** reçu.

### Deux formats, et pourquoi

| Dossier | Format | Sert à |
|---|---|---|
| `assets/images/roue/xxx.webp` | WebP 700 px | l'affichage sur le site |
| `assets/images/roue/xxx.jpg` | JPEG 600 px | **l'email uniquement** |

Le WebP n'est toujours pas lu par Outlook : une affiche en WebP dans un mail
s'afficherait en carré vide chez une partie de tes gagnants. D'où le JPEG en
double, réservé à l'email.

### Le poids

Tes PNG d'origine faisaient **14,1 Mo à eux six** (2,4 Mo pièce). Envoyer ça
aurait mis 10 secondes à charger sur un téléphone en 4G, pile au moment le plus
important du jeu. Après conversion : **434 Ko pour les six**, soit **−97 %**.
J'ai mesuré l'écart sur les zones de texte doré, c'est le point le plus fragile :
3,2/255 en moyenne, invisible à l'œil. Rien n'a été rogné, ni recadré.

### Le filet de sécurité

Le visuel du lot gagné est chargé **pendant que la roue tourne**, donc il est
déjà prêt à la révélation : aucun temps d'attente. Et si une image manquait ou
ne se chargeait pas, l'écran repasse tout seul sur l'ancienne pastille dorée
avec le nom du lot. Un gain doit toujours s'afficher.

---

## LE POP-UP : POURQUOI IL EST DIFFÉRENT SUR TÉLÉPHONE

Sur **ordinateur** : le pop-up plein écran s'ouvre au bout de 5 secondes,
exactement comme tu l'as demandé.

Sur **téléphone** : un bandeau en bas de l'écran à la place. Ce n'est pas
un caprice de ma part — Google déclasse les pages mobiles qui couvrent
le contenu juste après une arrivée depuis ses résultats de recherche.
Tu es en 6ᵉ position du bloc local, la dernière chose à faire est de
donner un motif de déclassement à Google.

Le bandeau reste très visible, s'anime, et **ouvre exactement la même roue
en plein écran** dès qu'on le touche. À partir de là c'est le visiteur qui
a demandé, donc plus aucun risque.

Un **bouton 🎁 permanent** est aussi ajouté à côté de tes boutons WhatsApp
et Instagram, sur toutes les pages : ceux qui ont fermé le pop-up peuvent
revenir jouer quand ils veulent.

---

## OÙ LA ROUE APPARAÎT (ET OÙ ELLE N'APPARAÎT PAS)

**Elle n'est PAS dans l'application Auréa.** L'app est un projet à part
(aurea.natachalaurevoyance.fr) et je n'y ai pas touché.

| Page | Pop-up auto | Bouton 🎁 |
|---|---|---|
| Accueil | oui | oui |
| Articles de blog + liste | oui | oui |
| Événements | oui | oui |
| Règlement du jeu | non | oui |
| **/aurea/** (page de présentation) | **non** | oui |
| /aurea/guide/ | non | non |

Sur `/aurea/`, le pop-up est coupé : cette page a un seul travail, envoyer les
gens dans l'app. Un pop-up qui s'ouvre par-dessus lui prend sa place. Le bouton
🎁 reste, pour qui veut jouer.

Pour couper le pop-up sur une autre page, ajouter `data-popup="non"` sur la
ligne de script :

```html
<script src="/assets/js/roue.js" data-popup="non" defer></script>
```

---

## POUR TESTER

- Rejouer sur ton ordinateur : ouvrir la console (F12) et taper
  `localStorage.clear()`, puis rafraîchir.
- Forcer l'ouverture à tout moment : `RoueCadeaux.ouvrir()` dans la console,
  ou cliquer le bouton 🎁.
- Remettre ton adresse à zéro côté serveur : la requête `delete` est en bas
  de `supabase-roue.sql`.
