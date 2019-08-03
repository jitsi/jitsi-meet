// @flow

import { MiddlewareRegistry } from '../base/redux';
import { TOGGLE_SHARE_WHITEBOARD } from './actionTypes';

declare var APP: Object;

const logger = require('jitsi-meet-logger').getLogger(__filename);

/**
 * Middleware that captures room URL sharing actions and starts the sharing
 * process.
 *
 * @param {Store} store - Redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case TOGGLE_SHARE_WHITEBOARD:
        setTimeout(() => {    
            const { getState } = store;
            const { whiteBoardOpen } = getState()['features/openboard'];        
            _toggleShareWhiteBoard(whiteBoardOpen);
        }, 0);
        break;
    }

    return next(action);
});

/**
 * toggles to share white board.
 *
 * @private
 * @returns {void}
 */
function _toggleShareWhiteBoard(whiteBoardOpen) {
    
    if (typeof APP === 'object') {
        logger.log('_toggleShareWhiteBoard.'+whiteBoardOpen);

        if(whiteBoardOpen){
            _beginShareWhiteBoard();
        }
        else{
            _endShareWhiteBoard();
        }
    }
}

/**
 * Begins to share white board.
 *
 * @private
 * @returns {void}
 */
function _beginShareWhiteBoard() {
    // let promise;

    logger.log('_beginShareScreen.');
        if (APP.conference.isSharingScreen
                && APP.conference.getDesktopSharingSourceType() === 'screen') {
            // promise = this._sendStartRequest();
        } else {
            
            APP.conference.toggleScreenSharing(
                true,
                {
                    desktopSharingSources: [ 'screen' ]
                });
        }

        APP.API.notifyCommonExMsg("whiteboard=open");
}

/**
 * Ends sharing white board.
 *
 * @private
 * @returns {void}
 */
function _endShareWhiteBoard() {
    // let promise;

    logger.log('_endShareWhiteBoard.');

    if (APP.conference.isSharingScreen
        && APP.conference.getDesktopSharingSourceType() === 'screen') {
            APP.conference.toggleScreenSharing(
                false,
                {
                    desktopSharingSources: [ 'screen' ]
                });
    } else {
    }
    APP.API.notifyCommonExMsg("whiteboard=close");
}