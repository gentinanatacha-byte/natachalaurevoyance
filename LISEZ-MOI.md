# 🌙 PATCH CMS NETLIFY — Natacha Laure Voyance

## Ce que contient ce patch

Tous les fichiers nécessaires pour activer un CMS visuel `/admin/` sur ton site,
en utilisant **Netlify Identity** (comme tes autres sites restaurant).

## ⚠️ Fichiers à SUPPRIMER avant d'uploader

Pour que le CMS fonctionne, supprime ces 8 anciens dossiers d'articles HTML
dans `blog/` :

- `blog/tarot-fascine-siecles/`
- `blog/voyance-sentimentale-tarot/`
- `blog/deroulement-consultation/`
- `blog/tarot-predit-avenir/`
- `blog/taromancie-voyance-mediumnite/`
- `blog/outils-divinatoires/`
- `blog/origines-divination/`
- `blog/histoire-tarot-marseille/`

Ils seront remplacés par les fichiers `.md` du dossier `_posts/`.

## ✅ Fichiers à AJOUTER au repo (depuis ce patch)

```
_config.yml              ← Configuration Jekyll
Gemfile                  ← Dépendances Jekyll
netlify.toml             ← Configuration Netlify (build + redirections)
_layouts/post.html       ← Template des articles
_includes/header.html
_includes/footer.html
_includes/floating-actions.html
_includes/netlify-identity.html  ← Widget de connexion
_posts/                  ← 8 articles en Markdown
admin/index.html         ← Interface Decap CMS
admin/config.yml         ← Configuration Decap CMS
blog/index.html          ← Liste dynamique du blog (remplace l'ancien)
```

## 📝 1 modif manuelle à faire dans `index.html`

Voir le fichier **`MODIF-INDEX-HTML.md`** pour les instructions exactes.

## 🎯 Différences avec la version Vercel (à jeter)

| Vercel (ancien) | Netlify (nouveau) |
|---|---|
| Backend `github` dans config.yml | Backend `git-gateway` |
| Service auth externe (Vercel) | Netlify Identity intégré |
| Création d'OAuth App GitHub | Pas besoin |
| 2 comptes (Vercel + GitHub) | Seulement Netlify |
| 1h30 de setup | 30-45 min de setup |

## 🚀 Suite des étapes

Voir le guide PDF d'installation pour le détail.
