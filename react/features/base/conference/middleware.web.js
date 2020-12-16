// @flow

import UIEvents from '../../../../service/UI/UIEvents';
import { MiddlewareRegistry } from '../redux';
import { TOGGLE_SCREENSHARING } from '../tracks/actionTypes';

import './middleware.any';

declare var APP: Object;

MiddlewareRegistry.register((/* store */) => next => action => {
    switch (action.type) {
    case TOGGLE_SCREENSHARING: {
        if (typeof APP === 'object') {
            APP.UI.emitEvent(UIEvents.TOGGLE_SCREENSHARING);
        }

        break;
    }
    }

    return next(action);
});
