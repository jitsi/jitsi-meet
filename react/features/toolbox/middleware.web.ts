import { batch } from 'react-redux';
import { AnyAction } from 'redux';

import { OVERWRITE_CONFIG, SET_CONFIG, UPDATE_CONFIG } from '../base/config/actionTypes';
import { NotifyClickButton } from '../base/config/configType';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import { I_AM_VISITOR_MODE } from '../visitors/actionTypes';

import {
    CLEAR_TOOLBOX_TIMEOUT,
    SET_BUTTONS_WITH_NOTIFY_CLICK,
    SET_FULL_SCREEN,
    SET_PARTICIPANT_MENU_BUTTONS_WITH_NOTIFY_CLICK,
    SET_TOOLBAR_BUTTONS,
    SET_TOOLBOX_TIMEOUT
} from './actionTypes';
import { setMainToolbarThresholds } from './actions.web';
import { THRESHOLDS, TOOLBAR_BUTTONS } from './constants';
import { getToolbarButtons } from './functions.web';
import { NOTIFY_CLICK_MODE } from './types';

import './subscriber.web';

/**
 * Middleware which intercepts Toolbox actions to handle changes to the
 * visibility timeout of the Toolbox.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case CLEAR_TOOLBOX_TIMEOUT: {
        const { timeoutID } = store.getState()['features/toolbox'];

        clearTimeout(timeoutID ?? undefined);
        break;
    }
    case UPDATE_CONFIG:
    case OVERWRITE_CONFIG:
    case I_AM_VISITOR_MODE:
    case SET_CONFIG: {
        const result = next(action);
        const { dispatch, getState } = store;
        const state = getState();

        if (action.type !== I_AM_VISITOR_MODE) {
            const {
                customToolbarButtons,
                buttonsWithNotifyClick,
                participantMenuButtonsWithNotifyClick,
                customParticipantMenuButtons
            } = state['features/base/config'];

            batch(() => {
                if (action.type !== I_AM_VISITOR_MODE) {
                    dispatch(setMainToolbarThresholds(THRESHOLDS));
                }
                dispatch({
                    type: SET_BUTTONS_WITH_NOTIFY_CLICK,
                    buttonsWithNotifyClick: _buildButtonsArray(buttonsWithNotifyClick, customToolbarButtons)
                });
                dispatch({
                    type: SET_PARTICIPANT_MENU_BUTTONS_WITH_NOTIFY_CLICK,
                    participantMenuButtonsWithNotifyClick:
                        _buildButtonsArray(participantMenuButtonsWithNotifyClick, customParticipantMenuButtons)
                });
            });
        }

        const toolbarButtons = getToolbarButtons(state, TOOLBAR_BUTTONS);

        dispatch({
            type: SET_TOOLBAR_BUTTONS,
            toolbarButtons
        });

        return result;
    }

    case SET_FULL_SCREEN:
        return _setFullScreen(next, action);

    case SET_TOOLBOX_TIMEOUT: {
        const { timeoutID } = store.getState()['features/toolbox'];
        const { handler, timeoutMS }: { handler: Function; timeoutMS: number; } = action;

        clearTimeout(timeoutID ?? undefined);
        action.timeoutID = setTimeout(handler, timeoutMS);

        break;
    }
    }

    return next(action);
});

type DocumentElement = {
    requestFullscreen?: Function;
    webkitRequestFullscreen?: Function;
};

/**
 * Makes an external request to enter or exit full screen mode.
 *
 * @param {Dispatch} next - The redux dispatch function to dispatch the
 * specified action to the specified store.
 * @param {Action} action - The redux action SET_FULL_SCREEN which is being
 * dispatched in the specified store.
 * @private
 * @returns {Object} The value returned by {@code next(action)}.
 */
function _setFullScreen(next: Function, action: AnyAction) {
    const result = next(action);

    const { fullScreen } = action;

    if (fullScreen) {
        const documentElement: DocumentElement
            = document.documentElement || {};

        if (typeof documentElement.requestFullscreen === 'function') {
            documentElement.requestFullscreen();
        } else if (
            typeof documentElement.webkitRequestFullscreen === 'function') {
            documentElement.webkitRequestFullscreen();
        }

        return result;
    }

    if (typeof document.exitFullscreen === 'function') {
        document.exitFullscreen();
    } else if (typeof document.webkitExitFullscreen === 'function') {
        document.webkitExitFullscreen();
    }

    return result;
}

/**
 * Common logic to gather buttons that have to notify the api when clicked.
 *
 * @param {Array} buttonsWithNotifyClick - The array of system buttons that need to notify the api.
 * @param {Array} customButtons - The custom buttons.
 * @returns {Array}
 */
function _buildButtonsArray(
        buttonsWithNotifyClick?: NotifyClickButton[],
        customButtons?: {
            icon: string;
            id: string;
            text: string;
        }[]
): Map<string, NOTIFY_CLICK_MODE> {
    const customButtonsWithNotifyClick = customButtons?.map(
        ({ id }) => ([ id, NOTIFY_CLICK_MODE.ONLY_NOTIFY ]) as [string, NOTIFY_CLICK_MODE]) ?? [];
    const buttons = (Array.isArray(buttonsWithNotifyClick) ? buttonsWithNotifyClick : [])
        .filter(button => typeof button === 'string' || (typeof button === 'object' && typeof button.key === 'string'))
        .map(button => {
            if (typeof button === 'string') {
                return [ button, NOTIFY_CLICK_MODE.PREVENT_AND_NOTIFY ] as [string, NOTIFY_CLICK_MODE];
            }

            return [
                button.key,
                button.preventExecution ? NOTIFY_CLICK_MODE.PREVENT_AND_NOTIFY : NOTIFY_CLICK_MODE.ONLY_NOTIFY
            ] as [string, NOTIFY_CLICK_MODE];
        });

    return new Map([ ...customButtonsWithNotifyClick, ...buttons ]);
}
