import { AnyAction } from 'redux';
import MiddlewareRegistry from '../../../redux/MiddlewareRegistry';

/**
 * Middleware to handle errors gracefully during action processing.
 * Prevents middleware crashes from breaking the entire Redux flow.
 */
MiddlewareRegistry.register(() => next => (action: AnyAction) => {
    try {
        return next(action);
    } catch (error: any) {
        const errorMessage = error?.message || error?.toString() || 'Unknown error';
        console.error('Middleware error:', errorMessage, 'for action:', action.type);
        return undefined;
    }
});
