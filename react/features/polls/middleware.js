// @flow

import { MiddlewareRegistry, StateListenerRegistry } from '../base/redux';

MiddlewareRegistry.register(({ dispatch, getState }) => next => action => {
	switch (action.type) {
	}
	
	return next(action);
});
