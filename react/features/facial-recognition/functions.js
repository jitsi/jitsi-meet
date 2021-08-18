// @flow
declare var APP: Object;

/**
 * Broadcasts the changed facial expression.
 *
 * @param  {string} facialExpression - Facial expression to be broadcasted.
 * @returns {void}
 */
export async function changeFacialExpression(facialExpression: string) {
    let count = 1;

    try {
        count = APP.conference.membersCount;
    } catch (e) {
        // pass
    }

    if (APP.conference !== undefined && count > 1) {
        console.log('AICI');
        const payload = {
            type: 'facial_expression',
            value: facialExpression
        };

        APP.conference.broadcastEndpointMessage(payload);
    }
}
