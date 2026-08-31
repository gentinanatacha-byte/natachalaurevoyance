# 🎁 CARTE CADEAU — notice d'installation

Même architecture que la roue : rien de nouveau à apprendre, rien de nouveau
à payer. La page est **directement opérationnelle** — pas de mode privé,
puisqu'aucune promesse automatique n'est faite au visiteur.

---

## ÉTAPE 1 — La base (2 min)

Supabase → SQL Editor → coller `supabase/supabase-cartes-cadeaux.sql` → Run.

Une seule table créée, `cartes_cadeaux`. Rien d'existant n'est touché.

La table prévoit déjà les colonnes `stripe_session`, `montant_paye` et
`paye_le` : elles restent vides tant que tu encaisses à la main, et servent
si tu branches le paiement en ligne plus tard. C'est ce qui fera de cette
évolution une greffe et non une refonte.

## ÉTAPE 2 — Le serveur (5 min)

Copier `aurea-vercel/api/carte-cadeau.js` dans le dossier `api/` du projet
Auréa, à côté de `roue.js`, puis `vercel --prod`.

**Aucune nouvelle variable d'environnement** : la fonction réutilise
`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` et `BREVO_API_KEY` déjà en place.

## ÉTAPE 3 — Le site (3 min)

Déposer dans le repo GitHub, en respectant les dossiers :

```
NOUVEAUX
  carte-cadeau.html              la page
  assets/css/carte-cadeau.css
  assets/js/carte-cadeau.js
MODIFIÉS
  index.html                     + lien menu et pied de page
  evenements.html                + lien menu et pied de page
  _includes/header.html          + lien menu
  _includes/footer.html          + lien pied de page
  cgv.html                       + article 5 bis « Cartes cadeaux »
  confidentialite.html           + section 4 octies
```

⚠️ Comme la dernière fois : **le contenu** du dossier, pas le dossier.

---

## TON TABLEAU DE BORD

Tout se pilote depuis Supabase → SQL Editor. Les requêtes sont en bas du
fichier SQL, prêtes à copier. La seule vraiment quotidienne :

```sql
select cree_le, reference, offrant, email, telephone,
       destinataire, formule_nom, mode, montant, occasion, mot, statut,
       round(extract(epoch from now() - cree_le) / 3600) as heures_ecoulees
from public.cartes_cadeaux
where statut in ('nouvelle', 'devis_envoye', 'payee')
order by cree_le;
```

La colonne `heures_ecoulees` te dit lesquelles approchent des 48 h promises.

### Le cycle d'une commande

```
nouvelle  →  devis_envoye  →  payee  →  carte_envoyee  →  utilisee
```

Une contrainte en base refuse tout autre statut : impossible d'écrire
« payée » avec un accent ou « envoyé » au singulier et de ne plus retrouver
la commande. Chaque étape a sa requête toute prête dans le fichier SQL.

L'étape `carte_envoyee` pose automatiquement la date de validité à un an.

### Quand quelqu'un se présente avec une carte

Une requête te donne un verdict en clair — valable, déjà utilisée, expirée,
ou pas encore réglée. Elle est dans le fichier SQL sous « est-elle valable ».

---

## LE CHIFFRE QU'IL FAUDRA REGARDER

Une requête calcule ton **taux de transformation** : combien de demandes
deviennent des cartes payées.

En dessous de 50 %, ce n'est pas ta page qui est en cause, c'est le délai.
Un cadeau s'achète sur un élan, et ton système impose une attente de 48 h
puis un virement. C'est ce chiffre, et lui seul, qui dira s'il vaut le coup
de brancher le paiement en ligne — pas une intuition.

Autre requête utile : les cartes vendues mais jamais utilisées qui arrivent
à échéance. Un rappel amical trois semaines avant, et tu récupères une
consultation qui allait se perdre.

---

## CE QUE LA PAGE FAIT DÉJÀ POUR TOI

- **Aperçu en direct.** Le visiteur voit sa carte se composer pendant qu'il
  tape le prénom et son message. C'est ce qui donne envie d'aller au bout.
- **Le prix suit le mode choisi.** On n'affiche jamais deux chiffres : la
  personne choisit à domicile ou à distance, et ne voit que son tarif.
- **Le montant est recalculé sur le serveur.** Le navigateur peut annoncer
  ce qu'il veut, il n'est pas cru — sinon on pourrait commander une Guidance
  Complète à 5 €.
- **Piège à robots** invisible, et 4 demandes maximum par jour et par
  connexion internet.
- **SEO complet** : title, description, canonical, données structurées
  Produit + FAQ + fil d'Ariane, et une FAQ de six questions qui vise
  « offrir une consultation de voyance », « carte cadeau voyance Nice »,
  « cadeau original ».

---

## CE QUE JE N'AI PAS FAIT, ET POURQUOI

**La carte elle-même.** Tu la prépares à la main, comme convenu. L'aperçu de
la page indique honnêtement au visiteur que la vraie carte sera illustrée et
plus belle — ne le démens pas, c'est une promesse.

Le jour où tu veux l'automatiser, la méthode est prête : tu génères deux ou
trois fonds sur OpenArt comme pour tes affiches de lot, et je compose le
prénom, le message et la référence par-dessus. Les données sont déjà toutes
en base.
