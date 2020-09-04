// @flow

import  {MiddlewareRegistry}  from '../base/redux';

declare var APP: Object;

/**
 * The redux middleware for {@link PrejoinPage}.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(store => next => async action => {
    switch (action.type) {


    }

    return next(action);
});
