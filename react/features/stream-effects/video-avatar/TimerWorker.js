
/**
 * SET_TIMEOUT constant is used to set interval and it is set in
 * the id property of the request.data property. timeMs property must
 * also be set. request.data example:
 *
 * {
 *      id: SET_TIMEOUT,
 *      timeMs: 33
 * }
 */
export const SET_TIMEOUT = 1;

/**
 * CLEAR_TIMEOUT constant is used to clear the interval and it is set in
 * the id property of the request.data property.
 *
 * {
 *      id: CLEAR_TIMEOUT
 * }
 */
export const CLEAR_TIMEOUT = 2;

/**
 * TIMEOUT_TICK constant is used as response and it is set in the id property.
 *
 * {
 *      id: TIMEOUT_TICK
 * }
 */
export const TIMEOUT_TICK = 3;

/**
 * The following code is needed as string to create a URL from a Blob.
 * The URL is then passed to a WebWorker. Reason for this is to enable
 * use of setInterval that is not throttled when tab is inactive.
 */
const code = `
    var timer;

    onmessage = function(request) {
        switch (request.data.id) {
        case ${SET_TIMEOUT}: {
            timer = setTimeout(() => {
                postMessage({ id: ${TIMEOUT_TICK} });
            }, request.data.timeMs);
            break;
        }
        case ${CLEAR_TIMEOUT}: {
            if (timer) {
                clearTimeout(timer);
            }
            break;
        }
        }
    };
`;

export const timerWorkerScript = URL.createObjectURL(new Blob([ code ], { type: 'application/javascript' }));
