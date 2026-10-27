# Les chiffres de l'accueil

Deux fichiers à remplacer sur GitHub : `index.html` à la racine, et
`assets/js/main.js`.

---

## Le problème

Tes trois compteurs étaient écrits comme ceci :

```html
<span class="trust-num" data-count="98" data-suffix="%">0</span>
```

La vraie valeur n'existait que dans l'attribut `data-count`, et seul le
JavaScript l'affichait — uniquement quand le bloc entrait dans l'écran.

Résultat : tout ce qui lit ta page sans lancer le JavaScript y voyait

```
0  Années d'expérience
0+ Consultations
0% de satisfaction
```

## Le correctif

Les chiffres sont maintenant écrits **dans la page**. L'animation
fonctionne toujours : le script remet le compteur à zéro juste avant de
le lancer, et seulement pour ceux qui sont encore sous le pli — un
chiffre déjà lu par ta visiteuse ne retombe pas à zéro sous ses yeux.

Vérifié dans un vrai navigateur, sur téléphone et sur ordinateur :

| | Avant | Après |
|---|---|---|
| Sans JavaScript | `0 · 0+ · 0%` | **`10 · 500+ · 98%`** |
| Avec JavaScript, à la fin | `10 · 500+ · 98%` | `10 · 500+ · 98%` |
| L'animation | fonctionne | fonctionne |

## Ce que ça change vraiment, sans exagérer

Google **exécute** le JavaScript, lors d'un second passage. Il voyait
donc probablement déjà les bons chiffres. L'impact sur ton classement
était sans doute faible.

Mais tout ce qui lit la page sans l'exécuter y voyait « 0 % de
satisfaction » : les moteurs de recherche IA, les aperçus quand on
partage ton lien, les outils d'audit comme Solocal, et Google lui-même
entre son premier et son second passage. Ça valait la correction.
