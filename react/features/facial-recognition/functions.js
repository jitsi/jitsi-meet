// @flow
declare var APP: Object;

/**
 * Broadcasts the changed facial expression.
 *
 * @param  {string} facialExpression - Facial expression to be broadcasted.
 * @returns {void}
 */
export async function changeFacialExpression(facialExpression: string) {
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
