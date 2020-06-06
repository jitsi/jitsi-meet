// @flow

import { MiddlewareRegistry } from '../base/redux';

MiddlewareRegistry.register(() => next => action => next(action));
