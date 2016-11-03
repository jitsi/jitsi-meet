import { combineReducers } from 'redux';

/**
 * A registry for Redux reducers, allowing features to register themselves
 * without needing to create additional inter-feature dependencies.
 */
class ReducerRegistry {
    /**
     * Creates a ReducerRegistry instance.
     */
    constructor() {
        /**
         * The set of registered reducers, keyed based on the field each reducer
         * will manage.
         */
        this.reducerRegistry = {};
    }

    /**
     * Combines all registered reducers into a single reducing function.
     *
     * @param {Object} [additional={}] - Any additional reducers that need to be
     * included (such as reducers from third-party modules).
     * @returns {Function}
     */
    combineReducers(additional = {}) {
        return combineReducers({
            ...this.reducerRegistry,
            ...additional
        });
    }

    /**
     * Adds a reducer to the registry.
     *
     * The method is to be invoked only before {@link #combineReducers()}.
     *
     * @param {string} name - The field in the state object that will be managed
     * by the provided reducer.
     * @param {Function} reducer - A Redux reducer.
     * @returns {void}
     */
    register(name, reducer) {
        this.reducerRegistry[name] = reducer;
    }
}

/**
 * The public singleton instance of the ReducerRegistry class.
 */
export default new ReducerRegistry();
