/* global APP */

export default {
    rotes: {
        '/': 'home',
        '^[a-zA-Z0-9]+$': 'video',
        '/*': 'error'
    },
    handlers: {
        home: function () {
            return APP.UI.goToHome();
        },
        video: function() {
            return APP.UI.goToVideoPage();
        },
        error: function() {
            //TODO: GOTO error page
            console.log('ERROR!');
        }
    }
};

