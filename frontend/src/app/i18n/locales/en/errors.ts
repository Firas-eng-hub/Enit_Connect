const errors = {
    fileTooLarge: "This file is too large. The maximum size is {{max}} MB.",
    fileType: "This file type isn't supported. Use: {{types}}.",
    http413: "This file is too large. Upload a smaller file.",
    http415: "This file type isn't supported. Upload a different file.",
    http401: "Your session has expired. Sign in again.",
    http500: "The server couldn't complete the request. Try again in a moment.",
    notFoundTitle: 'Page not found',
    notFoundBody: 'This address doesn’t match any page. It may have moved, or the link may be mistyped.',
    forbiddenTitle: 'You can’t open this page',
    forbiddenBody: 'Your account doesn’t have access to it. Sign in with the right account type, or go back.',
    home: 'Go to home page', goBack: 'Go back',
    pageTitle: "This page couldn't be displayed",
    pageBody: 'Something went wrong while loading it. Reload the page to try again. If it keeps happening, sign out and back in.',
    reload: 'Reload page',
};

export default errors;
