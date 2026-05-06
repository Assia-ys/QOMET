const fr = {
  // ── Navigation ──────────────────────────────────────────────────────
  retour: '← Retour',
  menu:   'Menu',

  // ── Home ────────────────────────────────────────────────────────────
  home: {
    chargement:   'Chargement...',
    init:         '● Initialisation des services...',
    menuPrincipal:'Menu Principal',
    jouerReseau:  'Jouer en réseau',
    jouerIA:      'Jouer contre IA',
    parametres:   'Paramètres',
    quitter:      'Quitter',
  },

  // ── IA ───────────────────────────────────────────────────────────────
  ia: {
    titre:       'Niveau de difficulté',
    sous:        "Choisissez le niveau de l'intelligence artificielle",
    facile:      'Facile',
    facile_badge:'Accessible à tous',
    facile_desc: 'Parfait pour débuter et apprendre les mécaniques du jeu',
    moyen:       'Moyen',
    moyen_badge: 'Challenge modéré',
    moyen_desc:  'Un challenge équilibré pour les joueurs expérimentés',
    difficile:       'Difficile',
    difficile_badge: 'Expert seulement',
    difficile_desc:  "Une IA impitoyable qui ne vous fera aucun cadeau",
    prenom:      'Ton prénom',
    prenom_placeholder: 'Ex: Alice',
    commencer:   'Commencer la partie contre IA',
    connexion:   'Connexion...',
  },

  // ── Réseau ───────────────────────────────────────────────────────────
  reseau: {
    titre:       'Multijoueur sur réseau local',
    sous:        'Affrontez un ami humain sur le même réseau Wi-Fi (sans IA)',
    creer:       'Créer une partie',
    rejoindre:   'Rejoindre une partie',
    prenom:      'Ton prénom',
    prenom_placeholder: 'Ex: Alice',
    code:        'Code de la partie (4 caractères)',
    creer_btn:   'Créer',
    rejoindre_btn:'Rejoindre',
    info_wifi:   'Les deux joueurs doivent être sur le même réseau Wi-Fi',
    salle_titre: 'Partie créée !',
    salle_sous:  'Partage ce code avec ton adversaire',
    code_label:  'Code de la partie',
    joueur2:     'Joueur 2',
    connecte:    'Connecté',
    attente:     'En attente...',
    attente_msg: "En attente de l'adversaire...",
    annuler:     'Annuler',
    erreur_titre:'Connexion impossible',
    erreur_sous: 'Impossible de rejoindre la partie.',
    reessayer:   'Réessayer',
  },

  // ── Game ─────────────────────────────────────────────────────────────
  game: {
    poser_ou_deplacer: 'Clique pour poser ou déplacer',
    deplacer:          'Déplace une étoile',
    ia_reflechit:      "L'IA réfléchit...",
    ton_tour:          'TON TOUR',
    son_tour:          'SON TOUR',
    pause:             '⏸ Pause',
    abandonner:        '⚑ Abandonner',
    sortir_plateau:    'Sortir du plateau (récupérer en main)',
    pause_titre:       'Pause',
    pause_reprise_auto:'La partie reprendra automatiquement dans',
    pause_msg_adverse: 'Ton adversaire a mis la partie en pause.',
    pause_attente:     "En attente de l'adversaire...",
    reprendre:         '▶ Reprendre la partie',
    menu_principal:    '← Menu principal',
    abandon_titre:     'Abandonner la partie ?',
    abandon_msg:       'Es-tu sûr de vouloir quitter ?\nCette action sera comptée comme une défaite.',
    annuler:           'Annuler',
    en_main:           'EN MAIN',
    sur_plateau:       'SUR LE PLATEAU',
  },

  // ── Modal fin de partie ───────────────────────────────────────────────
  modal: {
    gagne:           'Tu as gagné !',
    perdu:           'Tu as perdu...',
    gagne_msg:       'Félicitations, tu as formé un carré parfait !',
    perdu_msg:       'Ton adversaire a formé un carré parfait.',
    duree:           'Durée de la partie',
    rejouer:         'Rejouer',
    adversaire_deco: 'Adversaire déconnecté',
    adversaire_msg:  "Ton adversaire a quitté la partie.\nTu remportes la victoire par forfait !",
    accepter:        '✓ Accepter la victoire',
    voir_plateau:    'Voir le plateau',
    voir_resultat:   'Voir le résultat',
  },

  // ── Paramètres ────────────────────────────────────────────────────────
  params: {
    titre:        'Paramètres',
    sous:         'Configurez votre expérience de jeu',
    audio:        'Audio',
    vol_musique:  'Volume de la musique',
    vol_effets:   'Volume des effets sonores',
    reseau:       'Réseau',
    port:         'Port du serveur',
    port_hint:    'Adresse locale pour la connexion réseau locale',
    affichage:    'Affichage',
    plein_ecran:  'Mode plein écran',
    plein_hint:   'Affiche le jeu en plein écran',
    langue:       'Langue',
    sauvegarder:  'Sauvegarder les paramètres',
    sauvegarde_ok:'Paramètres sauvegardés !',
    annuler:      'Annuler',
  },
}

export default fr
