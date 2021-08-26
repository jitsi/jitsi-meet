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

/**
 * Returns the last facial expression of the local participant.
 *
 * @param  {Array<Object>} facialExpressions - The current redux state.
 * @returns {FacialExpression}
 */
export function getLastFacialExpression(facialExpressions: Array<Object>): string | null {
    if (facialExpressions.length === 0) {
        return null;
    }

    const { expression: lastFacialExpression } = facialExpressions[facialExpressions.length - 1];

    return lastFacialExpression;
}
