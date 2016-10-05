/* global APP */

export default {
    rotes: {
        '/': 'home',
        '^[a-zA-Z0-9]+$': 'video',
        '/*': 'error'
    },
    handlers: {
        home: () => APP.UI.goToHome(),
        video: () => APP.UI.goToVideoPage(),
        error: function() {
            //TODO: GOTO error page
            console.log('ERROR!');
        }
    }
};

