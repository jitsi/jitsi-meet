import { appNavigate } from '../app/actions.native';
import { KICKED_OUT } from '../base/conference/actionTypes';
import { conferenceLeft } from '../base/conference/actions';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';

import { notifyKickedOut } from './actions.native';

import './middleware.any';

MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case KICKED_OUT: {
        const { dispatch } = store;

        dispatch(notifyKickedOut(
          action.participant,
          () => {
              dispatch(conferenceLeft(action.conference));
              dispatch(appNavigate(undefined));
          }
        ));

        break;
    }
    }

    return next(action);
});
