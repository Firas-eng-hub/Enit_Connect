const visitor = {
    school: "École Nationale d'Ingénieurs de Tunis",
    nav: {
        news: 'News', about: 'About', signIn: 'Sign in', createAccount: 'Create account',
        openMenu: 'Open menu', closeMenu: 'Close menu', main: 'Main', skip: 'Skip to content',
    },
    hero: {
        title: 'Internships, PFE projects and first jobs for ENIT students and graduates',
        body: 'ENIT Connect is the school’s career platform. Students and alumni keep one profile, follow school news and apply to offers from partner companies.',
        student: 'Join as a student',
        company: 'Join as a company',
        photoAlt: 'ENIT campus in Tunis',
    },
    partners: { title: 'Partner companies' },
    news: {
        title: 'News',
        subtitle: 'Announcements from ENIT and its partner companies.',
        new: 'New',
        readArticle: 'Read article',
        empty: 'No news has been published yet.',
        error: "News couldn't be loaded. Check your connection, then try again.",
        retry: 'Try again',
    },
    about: {
        title: 'About ENIT Connect',
        mission1: "ENIT Connect is the career platform of the École Nationale d'Ingénieurs de Tunis. It brings students, alumni and partner companies into one place for internships, PFA and PFE projects, and jobs.",
        mission2: 'Students build a profile and apply to offers. Companies publish offers and review applications. The school publishes news and keeps the network up to date.',
        faqTitle: 'Questions',
        faq: {
            who: { q: 'Who can create an account?', a: 'ENIT students and alumni create a student account. Companies create a company account. Both confirm their email address before signing in.' },
            cost: { q: 'Is it free for students?', a: 'Yes. Creating a profile, browsing offers and applying cost nothing.' },
            offers: { q: 'What kinds of offers are published?', a: 'PFA and PFE projects, internships and jobs, posted by companies on the platform.' },
            apply: { q: 'How do I apply to an offer?', a: 'Sign in, complete your profile, open an offer and select Apply.' },
            companies: { q: 'How do companies review applications?', a: 'Each offer has its own list of candidates. Companies review profiles there and can reply through the platform mailbox.' },
            language: { q: 'Which languages are available?', a: 'English, French and Arabic. You can switch language at any time from the header.' },
        },
        contactTitle: 'Contact',
        contactBody: 'Questions about the platform or a partnership? Send us a message.',
        address: 'Address', email: 'Email', phone: 'Phone',
        form: {
            name: 'Full name', email: 'Email', message: 'Message', send: 'Send message',
            nameError: 'Enter your name.',
            emailError: 'Enter a valid email address.',
            messageError: 'Write at least 10 characters.',
            sent: 'Message sent. We usually reply within two working days.',
            failed: "Your message wasn't sent. Try again in a moment.",
        },
    },
    footer: {
        about: "The career platform of the École Nationale d'Ingénieurs de Tunis.",
        links: 'Platform', contact: 'Contact',
        rights: '© {{year}} ENIT Connect',
    },
};

export default visitor;
