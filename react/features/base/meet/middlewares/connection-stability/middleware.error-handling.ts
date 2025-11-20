import { AnyAction } from 'redux';
import MiddlewareRegistry from '../../../redux/MiddlewareRegistry';

/**
 * Middleware to handle errors gracefully during action processing.
 * Prevents middleware crashes from breaking the entire Redux flow.
 */
MiddlewareRegistry.register(() => next => (action: AnyAction) => {
    try {
        return next(action);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Middleware error:', errorMessage, 'for action:', action.type);
        return undefined;
    }
});
