# 📝 PETITE MODIF À FAIRE DANS TON `index.html`

Pour que tu puisses te connecter au CMS depuis ta page d'accueil aussi
(pas seulement le blog), il faut ajouter **2 lignes de code** dans le `<head>` de
ton fichier `index.html` (à la racine du repo).

## Étape 1 : Ouvre `index.html`

Dans GitHub Desktop, ouvre ton dossier local, puis ouvre `index.html` avec
n'importe quel éditeur de texte (Bloc-notes, TextEdit, VS Code, peu importe).

## Étape 2 : Trouve la balise `</head>`

Cherche la ligne qui contient `</head>` (généralement vers le haut du fichier).

## Étape 3 : Ajoute ce code JUSTE AVANT `</head>`

```html
<!-- Netlify Identity Widget -->
<script src="https://identity.netlify.com/v1/netlify-identity-widget.js"></script>
<script>
  if (window.netlifyIdentity) {
    window.netlifyIdentity.on("init", user => {
      if (!user) {
        window.netlifyIdentity.on("login", () => {
          document.location.href = "/admin/";
        });
      }
    });
  }
</script>
```

## Étape 4 : Sauvegarde et commit

Sauvegarde le fichier, retourne dans GitHub Desktop, fais ton commit
("Ajout widget Netlify Identity") et push.

---

**Note :** ce script est **invisible pour tes visiteurs**. Il ne s'active que si
quelqu'un de connecté arrive sur la page. Aucun impact sur le design ou la
performance.
