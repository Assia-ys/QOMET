# Manuel d'installation — QOMET

> Guide complet pour installer et lancer le projet de zéro.
> Aucune connaissance préalable requise.

---

## Étape 1 — Installer Node.js

Node.js est le moteur qui permet de faire tourner React sur ta machine.
Il inclut automatiquement `npm`, l'outil pour installer les librairies.

### Comment l'installer

1. Va sur **https://nodejs.org**
2. Clique sur le bouton vert **"LTS"** (version stable recommandée)
3. Lance le fichier `.msi` téléchargé
4. Clique "Next" jusqu'à la fin — laisse toutes les options par défaut

### Vérifier que l'installation a fonctionné

**Ferme ton terminal et ouvre-en un nouveau** (obligatoire), puis tape :

```bash
node -v
npm -v
```


Si tu vois ça → Node.js est installé. Passe à l'étape 2.

---

## Étape 2 — Autoriser les scripts PowerShell (Windows uniquement)

Sur Windows, PowerShell bloque par défaut l'exécution de scripts.
Sans cette étape, `npm` ne fonctionnera pas.

Ouvre PowerShell et tape :

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Réponds `O` si on te demande de confirmer.

> Cette commande n'autorise que les scripts signés ou locaux.
> Elle ne compromet pas la sécurité de ta machine.

**Alternative** : utilise l'Invite de commandes (`cmd`) au lieu de PowerShell.
Dans `cmd`, cette restriction n'existe pas.

---

## Étape 3 — Récupérer le projet

Si tu n'as pas encore le projet sur ta machine, clone le dépôt Git :

```bash
git clone <url-du-repo>
cd QOMET
```

Si tu l'as déjà, assure-toi d'être à jour :

```bash
git pull
```

---

## Étape 4 — Installer les dépendances

Les librairies du projet (React, React Router, Zustand, etc.) ne sont pas
incluses dans Git. Il faut les télécharger une première fois.

```bash
cd frontend/src
npm install
```

Cette commande lit le fichier `src/package.json` et télécharge tout
dans un dossier `node_modules/`. Elle prend 1 à 2 minutes la première fois.

> Tu n'as besoin de faire `npm install` qu'une seule fois,
> ou si quelqu'un ajoute une nouvelle librairie au projet.

---

## Étape 5 — Lancer l'application

```bash
npm run dev
```

Tu dois voir apparaître :

```
VITE v8.x.x  ready in XXX ms

➜  Local:   http://127.0.0.1:5173/
➜  press h + enter to show help
```

**Laisse ce terminal ouvert.** Si tu le fermes, l'application s'arrête.

---

## Étape 6 — Ouvrir dans le navigateur

Ouvre ton navigateur (Chrome, Edge, Firefox) et tape dans la barre d'adresse :

```
http://127.0.0.1:5173/
```

Tu dois voir une page sombre avec le nom de la route affichée.

### Tester le routeur

Chaque route doit afficher une page différente :

| URL | Page affichée |
|---|---|
| `http://127.0.0.1:5173/#/` | Accueil |
| `http://127.0.0.1:5173/#/jeu` | Jeu |
| `http://127.0.0.1:5173/#/ia` | Intelligence Artificielle |
| `http://127.0.0.1:5173/#/reseau` | Réseau |
| `http://127.0.0.1:5173/#/parametres` | Paramètres |

Si les pages changent sans rechargement complet → tout fonctionne.

---

## Résumé des commandes

À faire **une seule fois** (installation) :

```bash
cd frontend/src
npm install
```

À faire **à chaque fois** que tu travailles sur le projet :

```bash
cd frontend/src
npm run dev
```

---

## Problèmes fréquents

### "npm n'est pas reconnu"
→ Node.js n'est pas installé. Reprends l'étape 1.
→ Ou tu n'as pas fermé et rouvert ton terminal après l'installation.

### "l'exécution de scripts est désactivée"
→ Tu es sous PowerShell. Reprends l'étape 2 ou utilise `cmd`.

### "page introuvable" dans le navigateur
→ Vérifie que le terminal avec `npm run dev` est encore ouvert et actif.
→ Utilise `http://127.0.0.1:5173/` `.

### Le terminal affiche des erreurs rouges au lancement
→ Tu as probablement oublié de faire `npm install`. Relance-le.
