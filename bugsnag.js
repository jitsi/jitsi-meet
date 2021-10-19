/* eslint-disable */
import bugsnag from '@bugsnag/js';

const BUGSNAG_API_KEY = ''

const getBugsnagClient = () => {
    let bugsnagClient;

    if (process.env.NODE_ENV === 'production') {
        bugsnagClient = bugsnag({
            apiKey: BUGSNAG_API_KEY,
            releaseStage: 'production'
        });
    }

    return bugsnagClient;
};

export const notifyBugsnag = (error)=>{
    if (window.bugsnag
        && window.bugsnag.notify
        && typeof window.bugsnag.notify === 'function') {
        window.bugsnag.notify(error);
    }
}

export { getBugsnagClient };
