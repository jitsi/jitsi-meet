// @flow

import {
    CLEAR_INTERVAL,
    INTERVAL_TIMEOUT,
    SET_INTERVAL
} from './constants';

const code = `
    var timer;

    onmessage = function(request) {
        switch (request.data.id) {
        case ${SET_INTERVAL}: {
            timer = setInterval(() => {
                postMessage({ id: ${INTERVAL_TIMEOUT} });
            }, request.data.timeMs);
            break;
        }
        case ${CLEAR_INTERVAL}: {
            if (timer) {
                clearInterval(timer);
            }
            break;
        }
        }
    };
`;

export const timerWorkerScript = URL.createObjectURL(new Blob([ code ], { type: 'application/javascript' }));
