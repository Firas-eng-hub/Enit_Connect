// Visitor landing page.
const landing = {
    audience: { label: 'Show the page for', student: 'Students', company: 'Companies' },
    hero: {
        student: {
            title: 'From your first internship\nto your first job',
            body: 'ENIT Connect brings internships, PFA and PFE subjects and jobs from partner companies to ENIT students and alumni. One profile serves every application.',
            cta: 'Create your student profile',
            proof: 'Free for students. Sign up with your email address.',
        },
        company: {
            title: 'Recruit ENIT engineers\nfrom their first internship',
            body: 'Publish internships, PFA and PFE subjects and jobs. Review the candidates for each offer and answer them from one mailbox.',
            cta: 'Create a company account',
            proof: 'Your account is ready once you confirm your email address.',
        },
    },
    path: {
        step: 'Step {{n}}',
        student: {
            title: 'Your path at ENIT',
            stops: {
                worker: { label: 'Worker internship', when: 'End of year 1', body: 'Browse internship offers from partner companies and apply with the profile you created when you joined.' },
                pfa: { label: 'PFA project', when: 'Year 2', body: 'Find PFA subjects published by companies and apply from the offer page.' },
                engineer: { label: 'Engineering internship', when: 'Summer of year 2', body: 'Offers close to your profile appear under Recommended for you, so you see them first.' },
                pfe: { label: 'PFE project', when: 'Year 3', body: 'Compare PFE subjects, apply to several and answer companies in your platform mailbox.' },
                job: { label: 'First job', when: 'After graduation', body: 'Alumni keep using ENIT Connect. Apply to job offers from the same profile and follow school news.' },
            },
        },
        company: {
            title: 'Hiring through ENIT Connect',
            stops: {
                account: { label: 'Create a company account', body: 'Sign up with your company details and confirm your email address.' },
                publish: { label: 'Publish an offer', body: 'Post an internship, a PFA or PFE subject or a job, with the skills it requires.' },
                receive: { label: 'Receive applications', body: 'Each offer keeps its own list of candidates.' },
                review: { label: 'Review profiles', body: 'Open the profile of each candidate from the list on the offer.' },
                reply: { label: 'Reply in the mailbox', body: 'Answer candidates through the platform mailbox.' },
            },
        },
    },
    steps: {
        title: 'How it works',
        profile: { title: 'Build your profile once', body: 'Add your department, skills, projects and CV. Every application reuses it.' },
        match: { title: 'See which offers suit you', body: 'Offers close to your profile are listed under Recommended for you.' },
        apply: { title: 'Apply and follow up', body: 'Apply in one step, then read and answer company messages in your platform mailbox.' },
    },
    tagline: 'One profile carries you from your PFA to your PFE and on to your first job.',
    companies: {
        title: 'Hiring ENIT engineers?',
        body: 'Publish an offer, review the candidates it receives and reply to them from the platform mailbox.',
        cta: 'Create a company account',
        flow: { publish: 'Publish an offer', review: 'Review applications', reply: 'Reply in the mailbox' },
    },
    final: {
        title: 'Your next internship starts with a profile',
        body: 'It is free for ENIT students and alumni.',
    },
};

export default landing;
