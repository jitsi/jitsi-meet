import { Action, type Reducer, combineReducers } from 'redux';

/**
 * The type of the dictionary/map which associates a reducer (function) with the
 * name of he Redux state property managed by the reducer.
 */
type NameReducerMap<S> = { [name: string]: Reducer<S, Action<any>>; };

/**
 * A registry for Redux reducers, allowing features to register themselves
 * without needing to create additional inter-feature dependencies.
 */
class ReducerRegistry {
    _elements: NameReducerMap<any>;

    /**
     * Creates a ReducerRegistry instance.
     */
    constructor() {
        /**
         * The set of registered reducers, keyed based on the field each reducer
         * will manage.
         *
         * @private
         * @type {NameReducerMap}
         */
        this._elements = {};
    }

    /**
     * Combines all registered reducers into a single reducing function.
     *
     * @param {Object} [additional={}] - Any additional reducers that need to be
     * included (such as reducers from third-party modules).
     * @returns {Function}
     */
    combineReducers(additional: NameReducerMap<any> = {}) {
        return combineReducers({
            ...this._elements,
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
     * @param {Reducer} reducer - A Redux reducer.
     * @returns {void}
     */
    register<S>(name: string, reducer: Reducer<S, any>) {
        this._elements[name] = reducer;
    }
}

/**
 * The public singleton instance of the ReducerRegistry class.
 */
export default new ReducerRegistry();
