const settings = {
    title: 'Settings', subtitle: 'Manage your account preferences',
    companySubtitle: 'Manage your company account preferences',
    account: {
        title: 'Account settings', email: 'Email address',
        changePassword: 'Change password', passwordPlaceholder: 'Enter new password',
    },
    notifications: {
        title: 'Notification preferences',
        email: 'Email notifications', emailDesc: 'Receive updates via email',
        emailDescCompany: 'Receive new applications via email',
        push: 'Push notifications', pushDesc: 'Receive browser notifications',
        pushDescCompany: 'Receive browser notifications for applications',
        autoSave: 'Notification preferences save automatically',
    },
    privacy: {
        title: 'Privacy settings', visibility: 'Profile visibility',
        visibilityCompany: 'Company profile visibility',
        public: 'Public — Visible to all companies',
        private: 'Private — Only visible when you apply',
        hidden: 'Hidden — Not visible to companies',
        publicCompany: 'Public — Visible to all students',
        verifiedCompany: 'Verified Only — Visible to verified students',
        privateCompany: 'Private — Only visible in your offers',
    },
    language: {
        title: 'Language & region', language: 'Language',
        timezone: 'Timezone', applied: 'Language changed to {{lang}}',
    },
};

export default settings;
