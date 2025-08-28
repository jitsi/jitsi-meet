import { IReduxState } from '../../app/types';

export * from './functions.any';

/**
 * Returns whether the conference is in connecting state.
 *
 * @param {Object} state - The redux state.
 * @returns {boolean} Whether conference is connecting.
 */
export const isConnecting = (state: IReduxState) => {
    const { connecting, connection } = state['features/base/connection'];
    const {
        conference,
        joining,
        membersOnly,
        leaving
    } = state['features/base/conference'];

    // XXX There is a window of time between the successful establishment of the
    // XMPP connection and the subsequent commencement of joining the MUC during
    // which the app does not appear to be doing anything according to the redux
    // state. In order to not toggle the _connecting props during the window of
    // time in question, define _connecting as follows:
    // - the XMPP connection is connecting, or
    // - the XMPP connection is connected and the conference is joining, or
    // - the XMPP connection is connected and we have no conference yet, nor we
    //   are leaving one.
    return Boolean(
        connecting || (connection && (!membersOnly && (joining || (!conference && !leaving))))
    );
};
