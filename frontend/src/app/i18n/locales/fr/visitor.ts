const visitor = {
    school: "École Nationale d'Ingénieurs de Tunis",
    nav: {
        news: 'Actualités', about: 'À propos', signIn: 'Se connecter', createAccount: 'Créer un compte',
        openMenu: 'Ouvrir le menu', closeMenu: 'Fermer le menu', main: 'Principal', skip: 'Aller au contenu',
    },
    hero: {
        title: 'Stages, PFE et premiers emplois pour les élèves et diplômés de l’ENIT',
        body: 'ENIT Connect est la plateforme carrière de l’école. Élèves et diplômés gèrent un seul profil, suivent l’actualité de l’école et postulent aux offres des entreprises partenaires.',
        student: 'S’inscrire comme élève',
        company: 'S’inscrire comme entreprise',
        photoAlt: 'Campus de l’ENIT à Tunis',
    },
    partners: { title: 'Entreprises partenaires' },
    news: {
        title: 'Actualités',
        subtitle: "Annonces de l'ENIT et de ses entreprises partenaires.",
        new: 'Nouveau',
        readArticle: "Lire l'article",
        empty: "Aucune actualité n'a encore été publiée.",
        error: "Les actualités n'ont pas pu être chargées. Vérifiez votre connexion, puis réessayez.",
        retry: 'Réessayer',
    },
    about: {
        title: 'À propos d’ENIT Connect',
        mission1: "ENIT Connect est la plateforme carrière de l'École Nationale d'Ingénieurs de Tunis. Elle réunit élèves, diplômés et entreprises partenaires autour des stages, des projets PFA et PFE et des offres d'emploi.",
        mission2: "Les élèves créent un profil et postulent aux offres. Les entreprises publient des offres et examinent les candidatures. L'école publie les actualités et anime le réseau.",
        faqTitle: 'Questions',
        faq: {
            who: { q: 'Qui peut créer un compte ?', a: "Les élèves et diplômés de l'ENIT créent un compte élève. Les entreprises créent un compte entreprise. Chacun confirme son adresse e-mail avant de se connecter." },
            cost: { q: 'Est-ce gratuit pour les élèves ?', a: 'Oui. Créer un profil, consulter les offres et postuler est gratuit.' },
            offers: { q: "Quels types d'offres sont publiés ?", a: "Des projets PFA et PFE, des stages et des emplois, publiés par les entreprises sur la plateforme." },
            apply: { q: 'Comment postuler à une offre ?', a: 'Connectez-vous, complétez votre profil, ouvrez une offre et sélectionnez Postuler.' },
            companies: { q: 'Comment les entreprises examinent-elles les candidatures ?', a: 'Chaque offre a sa propre liste de candidats. Les entreprises y examinent les profils et peuvent répondre via la messagerie de la plateforme.' },
            language: { q: 'Quelles langues sont disponibles ?', a: "Anglais, français et arabe. Vous pouvez changer de langue à tout moment depuis l'en-tête." },
        },
        contactTitle: 'Contact',
        contactBody: 'Une question sur la plateforme ou un partenariat ? Écrivez-nous.',
        address: 'Adresse', email: 'E-mail', phone: 'Téléphone',
        form: {
            name: 'Nom complet', email: 'E-mail', message: 'Message', send: 'Envoyer le message',
            nameError: 'Saisissez votre nom.',
            emailError: 'Saisissez une adresse e-mail valide.',
            messageError: 'Écrivez au moins 10 caractères.',
            sent: 'Message envoyé. Nous répondons généralement sous deux jours ouvrés.',
            failed: "Votre message n'a pas été envoyé. Réessayez dans un instant.",
        },
    },
    footer: {
        about: "La plateforme carrière de l'École Nationale d'Ingénieurs de Tunis.",
        links: 'Plateforme', contact: 'Contact',
        rights: '© {{year}} ENIT Connect',
    },
};

export default visitor;
