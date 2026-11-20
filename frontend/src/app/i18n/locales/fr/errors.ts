const errors = {
    fileTooLarge: "Ce fichier est trop volumineux. Taille maximale : {{max}} Mo.",
    fileType: "Ce type de fichier n'est pas pris en charge. Formats acceptés : {{types}}.",
    http413: "Fichier trop volumineux. Téléversez un fichier plus petit.",
    http415: "Type de fichier non pris en charge. Téléversez un autre fichier.",
    http401: "Votre session a expiré. Reconnectez-vous.",
    http500: "Le serveur n'a pas pu traiter la demande. Réessayez dans un instant.",
    notFoundTitle: 'Page introuvable',
    notFoundBody: "Cette adresse ne correspond à aucune page. Elle a peut-être été déplacée, ou le lien est erroné.",
    forbiddenTitle: 'Vous ne pouvez pas ouvrir cette page',
    forbiddenBody: "Votre compte n'y a pas accès. Connectez-vous avec le bon type de compte, ou revenez en arrière.",
    home: "Aller à l'accueil", goBack: 'Revenir en arrière',
    pageTitle: "Cette page n'a pas pu s'afficher",
    pageBody: "Une erreur s'est produite pendant le chargement. Rechargez la page pour réessayer. Si le problème persiste, déconnectez-vous puis reconnectez-vous.",
    reload: 'Recharger la page',
};

export default errors;
