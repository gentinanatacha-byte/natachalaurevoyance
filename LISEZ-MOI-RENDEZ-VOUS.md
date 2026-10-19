# Les consultations téléphoniques sur rendez-vous

**L'offre Club Med'Or : 50 € au lieu de 70 €, une heure au téléphone.**

Une personne reçoit le lien sur WhatsApp, choisit un créneau, laisse son
prénom, son numéro et son e-mail, paie. C'est tout. Pas de compte à créer,
pas de mot de passe, pas d'e-mail à confirmer.

Tu reçois un e-mail avec **un bouton « Appeler sur WhatsApp »**, un fichier
`.ics` qui pose le rendez-vous dans l'agenda de ton téléphone, et le
rendez-vous apparaît dans ton espace pro. C'est toi qui appelles.

---

## ⚠️ Pourquoi les appels passent par WhatsApp

Le Club Med'Or est à **Bogis-Bossey, canton de Vaud**. Ses membres ont donc
des numéros suisses — et la Suisse n'est **pas** dans la zone Europe incluse
des forfaits français. Tu es à Nice, c'est toi qui appelles, pendant une heure :

| Opérateur | Prix/min vers un mobile suisse | Coût d'un rendez-vous d'1 h |
|---|---|---|
| Orange | 0,23 € | **13,80 €** |
| Free | 0,29 € (inclus sur Free Max) | **17,40 €** |
| Bouygues | 0,47 € | **28,20 €** |
| SFR | 0,67 € | **40,20 €** |

Sur une consultation à 50 €, c'est entre 28 % et **80 %** de la recette.
Chez SFR, il te resterait 9,80 € pour une heure de travail.

**WhatsApp passe par les données : zéro franc, où que soit la cliente.**
Toute la chaîne est donc réglée sur WhatsApp — la page, les deux e-mails,
le fichier d'agenda et ton espace pro.

La page demande le **pays** à côté du numéro, parce qu'un appel WhatsApp
exige le format international : « 078 615 78 58 » est à la fois un numéro
suisse et un numéro français. Le menu est préréglé sur la Suisse. La cliente
voit son numéro réécrit en entier sous le champ, ce qui attrape les fautes
de frappe avant le paiement.

---

## Le rendez-vous dans ton agenda de téléphone

Chaque confirmation porte un fichier `.ics` en pièce jointe. Une tape dessus
et le rendez-vous entre dans ton agenda — Apple, Google, Outlook, peu importe —
avec **deux alarmes : 12 h avant et 10 min avant**. Le titre porte le prénom
et le numéro, donc un coup d'œil à l'agenda suffit pour appeler.

C'est volontairement plus fiable qu'une notification que j'aurais écrite :
rien à autoriser, rien qui dort, et ça survit à un changement de téléphone.
La cliente reçoit le même fichier de son côté.

---

## À faire une fois, dans l'ordre

### 1. La base de données (5 minutes)

Ouvre **Supabase → SQL Editor → New query**, colle tout le contenu de
`supabase-consultations.sql`, et clique sur **Run**.

Tu devrais voir une série de `CREATE TABLE`, `CREATE FUNCTION`, `GRANT`.
S'il y a une ligne rouge, envoie-la-moi telle quelle.

> Ce fichier crée l'agenda, les rendez-vous et les règles. Il ne touche à
> rien de ce qui existe déjà — tes lectures, tes crédits et tes cartes
> cadeaux ne bougent pas.

### 2. L'application (2 minutes)

Dans VS Code, dans le dossier de l'appli :

```
vercel --prod
```

C'est ce qui met en ligne les trois nouvelles fonctions de réservation et
l'agenda dans ton espace pro.

**Aucune variable à ajouter sur Vercel** : tout réutilise ce qui est déjà
en place (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`,
`STRIPE_WEBHOOK_SECRET`, `BREVO_API_KEY`).

**Aucun produit à créer dans Stripe** non plus : le montant est transmis au
moment du paiement. Changer le prix se fait depuis ton espace pro.

### 3. Le site (2 minutes)

Les fichiers du site passent par GitHub, comme d'habitude :

```
git add .
git commit -m "Page de rendez-vous Club Med'Or"
git push
```

Attends deux ou trois minutes que GitHub publie, puis ouvre
**https://natachalaurevoyance.fr/rendez-vous/**

Tu dois voir ta photo, « 50 € » avec « 70 € » barré, et tes créneaux.

> La page n'est **pas** indexée par Google et n'est reliée à aucun menu :
> seules les personnes qui reçoivent le lien la trouvent. C'est voulu.

### 4. Tes vrais horaires (le plus important)

Ouvre ton **espace pro** dans l'appli → **Rendez-vous téléphoniques** →
**Tarif, horaires et absences**.

La grille livrée par défaut est une proposition : **mardi, mercredi et
jeudi à 14 h, 15 h 30 et 17 h**. Remplace-la par tes vrais horaires avant
d'ouvrir, sinon tu seras appelée à des heures qui ne te vont pas.

- Touche une heure pour l'activer ou la désactiver.
- Le `+` ajoute une heure à un jour.
- Ajoute tes absences (vacances, fêtes) : aucun créneau ne sera proposé
  ces jours-là.

### 5. Ouvrir

Toujours dans les réglages, coche **« J'accepte les rendez-vous
téléphoniques »**.

Tant que ce n'est pas coché, la page affiche une pause et personne ne peut
réserver. **C'est fermé par défaut**, exprès : le temps que tu règles tes
horaires.

### 6. Un essai avant d'envoyer quoi que ce soit

Réserve un créneau toi-même, paie, et vérifie :

- l'e-mail de confirmation arrive dans ta boîte cliente ;
- l'e-mail d'alerte arrive sur ton adresse pro, avec le numéro ;
- le rendez-vous apparaît dans ton espace pro ;
- l'étiquette **Club Med'Or** est bien là.

Puis **rembourse-toi dans Stripe** et **annule le rendez-vous** (bouton
« ✓ fait ») pour libérer le créneau.

---

## Ce qui est prévu quand ça tourne mal

Je ne te livre pas que le cas idéal. Voilà ce qui se passe dans les autres.

| Situation | Ce qui arrive |
|---|---|
| Deux personnes cliquent sur le même créneau en même temps | La base en refuse une. **Vérifié avec deux connexions simultanées.** Jamais de double réservation. |
| Quelqu'un ouvre le paiement puis ferme l'onglet | Son créneau est libéré au bout de 20 minutes et redevient réservable. |
| Elle paie 25 minutes plus tard, le créneau est resté libre | Son rendez-vous est rétabli automatiquement. |
| Elle paie 25 minutes plus tard, quelqu'un a pris le créneau | Elle reçoit un e-mail honnête, et tu reçois une alerte **« À replacer »** avec son numéro. C'est le seul cas qui te demande d'agir. |
| Stripe renvoie deux fois le même paiement | Ignoré, pas de deuxième confirmation. |
| Elle oublie son rendez-vous | Un rappel part automatiquement la veille au matin. |
| Ton agenda est plein, ou l'offre est fermée | La page propose ton numéro au lieu d'un cul-de-sac. |
| Quelqu'un bricole la page pour réserver dimanche à 3 h | Refusé : la base revérifie que le créneau appartient à ta grille. |
| Quelqu'un bricole la page pour payer 1 € | Impossible : **le prix n'est jamais transmis par le navigateur**, il est lu dans tes réglages. |

---

## Deux points de droit, à lire une fois

### Le prix barré

L'article **L112-1-1 du code de la consommation** impose que le prix barré
soit **le prix le plus bas que tu as réellement pratiqué dans les 30 jours
précédents**.

Tes 70 € affichés sur le site conviennent. **Attention quand même** : si
ta roue de la fortune ou une carte cadeau a permis une consultation d'une
heure à moins de 70 € ces trente derniers jours, c'est ce prix-là qui
devient la référence. Vérifie avant d'envoyer.

Le rappel est écrit dans ton espace pro, juste à l'endroit où le chiffre
se tape.

### Le délai de rétractation

Une prestation vendue à distance ouvre un droit de rétractation de 14
jours. Comme ton rendez-vous tombe souvent avant ces 14 jours, la page
comporte une **case à cocher distincte et non pré-cochée** par laquelle la
cliente demande expressément que la consultation ait lieu à la date
choisie — c'est exactement ce que tes CGV promettaient déjà à l'article
6.3, et ce que demande l'article L221-25.

Deux nouveaux articles ont été ajoutés à tes CGV : **5 ter** (le
déroulement des rendez-vous) et **6.2 bis** (la rétractation).

Tu offres en plus **l'annulation gratuite jusqu'à la veille, avec
remboursement intégral**. C'est plus généreux que ce que la loi impose, et
c'est ce qui rend la question sans objet dans les faits.

> Je ne suis pas juriste. Ces articles sont rédigés au plus près des
> textes que j'ai vérifiés, mais si tu veux une sécurité totale, fais-les
> relire — c'est une demi-heure de conseil, pas plus.

---

## Les fichiers

**Dans le site** (GitHub) :

- `rendez-vous.html` — la page
- `assets/css/rendez-vous.css`
- `assets/js/rendez-vous.js`
- `cgv.html` — articles 5 ter, 6.2 bis et article 7 complétés

**Dans l'appli** (VS Code, `vercel --prod`) :

- `api/consultation-etat.js` — le tarif et les créneaux libres
- `api/consultation-reserver.js` — la réservation et le paiement
- `api/_consultation-notifs.js` — les e-mails et les fichiers d'agenda
- `api/_lecture-commun.js` — accepte désormais les pièces jointes
- `api/stripe-webhook.js` — une branche en plus
- `api/lecture-echeances.js` — le rappel de la veille s'y est greffé
- `src/Consultations.tsx` — l'agenda dans l'espace pro
- `src/EspacePro.tsx` — deux lignes pour l'y brancher
- `public/Images/stripe-consultation.jpg` — l'illustration du paiement

**À exécuter dans Supabase** :

- `supabase-consultations.sql`

---

## Et Le Registre, alors ?

Tu as raison : c'est là que vivent tes clientes, et c'est là que les
rendez-vous devraient atterrir. J'ai creusé le fichier en ligne pour voir
si je pouvais le faire sans y toucher. Voilà ce que j'ai trouvé.

**Son format de données, que je connais maintenant exactement :**
stockage sous la clé `registre:registre-voyance:v1`, contenu
`{clients, seances, maj}`. Une cliente porte `prenom, nom, tel, email,
naissance, sexe, ville, notes, etiquettes`. Une séance porte `clientId,
date, heure, formule, mode, duree, montant, paye, paiement, devise, theme,
impression, relanceStatut`.

**Pourquoi je n'ai rien fait quand même — deux obstacles :**

1. **Son bouton d'import ne fait pas un ajout, il fait une restauration.**
   Le code affiche « Restauré : … » et remplace l'intégralité de tes
   clientes et de tes séances par le contenu du fichier. Y glisser un
   rendez-vous reviendrait à risquer d'effacer toutes tes fiches. Je ne
   le ferai pas.
2. **Le Registre est chiffré de bout en bout avec ton code.** Le serveur ne
   stocke qu'un bloc illisible — c'est son principe, et c'est bien. Une
   réservation venue d'une page publique ne peut donc pas y être écrite
   côté serveur.

**Ce qu'il faudrait :** retoucher Le Registre lui-même. Or je n'ai ici que
sa version **compilée** (236 Ko minifiés, aucun nom de fonction lisible) —
pas son code source. Il faut donc le reconstruire, dans une session dédiée,
avec l'agenda intégré.

**Bonne nouvelle : tes données passeraient sans perte.** Le format d'import
que j'ai relevé accepte exactement `{clients, seances}` — donc un export
depuis Réglages se restaure tel quel dans une version reconstruite. On ne
part pas de zéro.

**En attendant, tu es opérationnelle :** l'agenda est dans Auréa, le `.ics`
met chaque rendez-vous dans l'agenda de ton téléphone, et tu reçois un
e-mail avec le bouton WhatsApp. Rien ne t'oblige à ouvrir Auréa pour
honorer un rendez-vous.

---

## Changer le tarif plus tard

Tout se fait depuis l'espace pro, jamais dans le code et jamais dans
Stripe. Le nouveau prix s'applique à la réservation suivante ; les
rendez-vous déjà payés ne bougent pas.
