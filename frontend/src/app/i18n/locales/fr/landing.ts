// Page d'accueil visiteur.
const landing = {
    audience: { label: 'Afficher la page pour', student: 'Élèves', company: 'Entreprises' },
    hero: {
        student: {
            title: 'Du premier stage\nau premier emploi',
            body: "ENIT Connect réunit les stages, les sujets de PFA et de PFE et les emplois des entreprises partenaires pour les élèves et diplômés de l'ENIT. Un seul profil sert à chaque candidature.",
            cta: 'Créer mon profil élève',
            proof: 'Gratuit pour les élèves. Inscription avec votre adresse email.',
        },
        company: {
            title: "Recrutez les ingénieurs de l'ENIT\ndès leur premier stage",
            body: 'Publiez des stages, des sujets de PFA et de PFE et des emplois. Consultez les candidats de chaque offre et répondez leur depuis une seule messagerie.',
            cta: 'Créer un compte entreprise',
            proof: 'Votre compte est prêt dès que vous confirmez votre adresse email.',
        },
    },
    path: {
        step: 'Étape {{n}}',
        student: {
            title: "Votre parcours à l'ENIT",
            stops: {
                worker: { label: 'Stage ouvrier', when: 'Fin de 1re année', body: 'Parcourez les offres de stage des entreprises partenaires et postulez avec le profil créé à votre inscription.' },
                pfa: { label: 'Projet de PFA', when: '2e année', body: "Trouvez les sujets de PFA publiés par les entreprises et postulez depuis la page de l'offre." },
                engineer: { label: 'Stage ingénieur', when: 'Été de 2e année', body: 'Les offres proches de votre profil apparaissent dans Recommandé pour vous, en premier.' },
                pfe: { label: 'Projet de PFE', when: '3e année', body: 'Comparez les sujets de PFE, postulez à plusieurs et répondez aux entreprises dans votre messagerie.' },
                job: { label: 'Premier emploi', when: 'Après le diplôme', body: "Les diplômés gardent ENIT Connect. Postulez aux offres d'emploi avec le même profil et suivez l'actualité de l'école." },
            },
        },
        company: {
            title: 'Recruter avec ENIT Connect',
            stops: {
                account: { label: 'Créer un compte entreprise', body: "Inscrivez votre entreprise et confirmez votre adresse email." },
                publish: { label: 'Publier une offre', body: 'Publiez un stage, un sujet de PFA ou de PFE ou un emploi, avec les compétences demandées.' },
                receive: { label: 'Recevoir des candidatures', body: 'Chaque offre garde sa propre liste de candidats.' },
                review: { label: 'Consulter les profils', body: "Ouvrez le profil de chaque candidat depuis la liste de l'offre." },
                reply: { label: 'Répondre dans la messagerie', body: 'Répondez aux candidats via la messagerie de la plateforme.' },
            },
        },
    },
    steps: {
        title: 'Comment ça marche',
        profile: { title: 'Créez votre profil une fois', body: 'Ajoutez votre département, vos compétences, vos projets et votre CV. Chaque candidature le réutilise.' },
        match: { title: 'Voyez les offres qui vous conviennent', body: 'Les offres proches de votre profil sont listées dans Recommandé pour vous.' },
        apply: { title: 'Postulez et suivez', body: 'Postulez en une étape, puis lisez les messages des entreprises et répondez depuis votre messagerie.' },
    },
    tagline: 'Un seul profil vous mène du PFA au PFE, puis à votre premier emploi.',
    companies: {
        title: 'Vous recrutez des ingénieurs ENIT ?',
        body: 'Publiez une offre, consultez les candidats reçus et répondez leur depuis la messagerie de la plateforme.',
        cta: 'Créer un compte entreprise',
        flow: { publish: 'Publier une offre', review: 'Consulter les candidatures', reply: 'Répondre dans la messagerie' },
    },
    final: {
        title: 'Votre prochain stage commence par un profil',
        body: "C'est gratuit pour les élèves et diplômés de l'ENIT.",
    },
};

export default landing;
