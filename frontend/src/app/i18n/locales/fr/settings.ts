const settings = {
    title: 'Paramètres', subtitle: 'Gérez vos préférences de compte',
    companySubtitle: 'Gérez les préférences de votre compte entreprise',
    account: {
        title: 'Paramètres du compte', email: 'Adresse e-mail',
        changePassword: 'Changer le mot de passe', passwordPlaceholder: 'Entrez un nouveau mot de passe',
    },
    notifications: {
        title: 'Préférences de notification',
        email: 'Notifications par e-mail', emailDesc: 'Recevoir des mises à jour par e-mail',
        emailDescCompany: 'Recevoir les candidatures par e-mail',
        push: 'Notifications push', pushDesc: 'Recevoir des notifications du navigateur',
        pushDescCompany: 'Recevoir des notifications pour les candidatures',
        autoSave: 'Les préférences de notification sont enregistrées automatiquement',
    },
    privacy: {
        title: 'Confidentialité', visibility: 'Visibilité du profil',
        visibilityCompany: 'Visibilité du profil entreprise',
        public: 'Public — Visible par toutes les entreprises',
        private: 'Privé — Visible uniquement lors de vos candidatures',
        hidden: 'Masqué — Non visible par les entreprises',
        publicCompany: 'Public — Visible par tous les étudiants',
        verifiedCompany: 'Vérifié uniquement — Visible par les étudiants vérifiés',
        privateCompany: 'Privé — Visible uniquement dans vos offres',
    },
    language: {
        title: 'Langue et région', language: 'Langue',
        timezone: 'Fuseau horaire', applied: 'Langue changée en {{lang}}',
    },
};

export default settings;
