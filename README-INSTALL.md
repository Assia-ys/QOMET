# Installation QOMET

> Aucun prérequis — tout est inclus dans l'application.

---

## 🐧 Linux

**1. Télécharger** le fichier `QOMET-1.0.0.AppImage`
👉 https://drive.google.com/file/d/1fQMnSZLa58Sh7UThKNvX3UmodEiU5iUS/view?usp=sharing

**2. Ouvrir un terminal** dans le dossier de téléchargement et exécuter :

```bash
sudo apt-get install -y libfuse2
chmod +x QOMET-1.0.0.AppImage
./QOMET-1.0.0.AppImage
```

> `libfuse2` est nécessaire une seule fois. Après ça, double-cliquer sur le fichier suffit.

---

## 🪟 Windows

**1. Télécharger** le fichier `QOMET-Setup.exe`
👉 https://drive.google.com/file/d/15HEBjJK1akmPd9w5b9lPDimlt3L2oIng/view?usp=sharing

**2. Double-cliquer** sur le fichier pour lancer l'installation

**3. Si Windows affiche "Application inconnue"** → cliquer sur **"Informations complémentaires"** puis **"Exécuter quand même"**

**4. Une fois installé**, lancer QOMET depuis le Bureau ou le menu Démarrer

---

## 🍎 macOS

**1. Télécharger** le fichier `QOMET.dmg`
👉 https://drive.google.com/file/d/11_ODEu5FRFDkT0m5Av6aoWZtDtH0VY-E/view?usp=sharing

**2. Double-cliquer** sur le `.dmg` puis glisser QOMET dans **Applications**

**3. Ouvrir un terminal** et exécuter cette commande avant le premier lancement :

```bash
xattr -cr /Applications/QOMET.app
```

**4. Lancer** QOMET depuis le dossier Applications

---

## Compatibilité

| Système | Version minimale |
|---------|-----------------|
| Linux   | Ubuntu 20.04+   |
| Windows | Windows 10+     |
| macOS   | macOS 12+       |

---

## Problèmes fréquents

**Linux — "dlopen(): error loading libfuse.so.2"**
```bash
sudo apt-get install -y libfuse2
```

**macOS — "QOMET est endommagé et ne peut pas être ouvert"**
```bash
xattr -cr /Applications/QOMET.app
```

**Windows — L'app ne se lance pas après installation**
→ Clic droit sur l'installeur → "Exécuter en tant qu'administrateur"
