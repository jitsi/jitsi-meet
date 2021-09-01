// @flow
declare var APP: Object;

/**
 * Broadcasts the changed facial expression.
 *
 * @param  {Object} facialExpression - Facial expression to be broadcasted.
 * @returns {void}
 */
export async function sendFacialExpression(facialExpression: Object) {
    const count = APP.conference.membersCount;

    APP.conference.sendFacialExpression(facialExpression);

    if (count > 1) {
        const payload = {
            type: 'facial_expression',
            value: facialExpression
        };

        APP.conference.broadcastEndpointMessage(payload);
    }
}
