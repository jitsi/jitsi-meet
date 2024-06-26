import { IStore } from '../app/types';
import { connect } from '../base/connection/actions.native';
import { navigateRoot } from '../mobile/navigation/rootNavigationContainerRef';
import { screen } from '../mobile/navigation/routes';
import { showVisitorsQueue } from '../visitors/functions';

/**
 * Action used to start the conference.
 *
 * @param {Object} options - The config options that override the default ones (if any).
 * @param {boolean} _ignoreJoiningInProgress - If true we won't check the joiningInProgress flag.
 * @returns {Function}
 */
export function joinConference(options?: Object, _ignoreJoiningInProgress = false) {
    return async function(dispatch: IStore['dispatch'], getState: IStore['getState']) {
        const _showVisitorsQueue = showVisitorsQueue(getState);

        if (_showVisitorsQueue) {
            dispatch(connect());
            navigateRoot(screen.conference.root);
        }
    };
}
