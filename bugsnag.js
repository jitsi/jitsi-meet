/* eslint-disable */
import bugsnag from '@bugsnag/js';

const getBugsnagClient = () => {
    let bugsnagClient;

    if (process.env.NODE_ENV === 'production') {
        bugsnagClient = bugsnag({
            apiKey: 'a0c8e2c65bed338af650acd9c2192855',
            releaseStage: 'production'
        });
    }

    return bugsnagClient;
};

export { getBugsnagClient };
