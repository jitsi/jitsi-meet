/**
 * Sets specific properties of a specific state to specific values and prevents
 * unnecessary state changes.
 *
 * @param {Object} target - The state on which the specified properties are to
 * be set.
 * @param {Object} source - The map of properties to values which are to be set
 * on the specified target.
 * @returns {Object} The specified target if the values of the specified
 * properties equal the specified values; otherwise, a new state constructed
 * from the specified target by setting the specified properties to the
 * specified values.
 */
export function setStateProperties(target, source) {
    let t = target;

    for (const property in source) { // eslint-disable-line guard-for-in
        t = setStateProperty(t, property, source[property], t === target);
    }

    return t;
}

/**
 * Sets a specific property of a specific state to a specific value. Prevents
 * unnecessary state changes (when the specified <tt>value</tt> is equal to the
 * value of the specified <tt>property</tt> of the specified <tt>state</tt>).
 *
 * @param {Object} state - The (Redux) state from which a new state is to be
 * constructed by setting the specified <tt>property</tt> to the specified
 * <tt>value</tt>.
 * @param {string} property - The property of <tt>state</tt> which is to be
 * assigned the specified <tt>value</tt> (in the new state).
 * @param {*} value - The value to assign to the specified <tt>property</tt>.
 * @returns {Object} The specified <tt>state</tt> if the value of the specified
 * <tt>property</tt> equals the specified <tt>value/tt>; otherwise, a new state
 * constructed from the specified <tt>state</tt> by setting the specified
 * <tt>property</tt> to the specified <tt>value</tt>.
 */
export function setStateProperty(state, property, value) {
    return _setStateProperty(state, property, value, /* copyOnWrite */ true);
}

/* eslint-disable max-params */

/**
 * Sets a specific property of a specific state to a specific value. Prevents
 * unnecessary state changes (when the specified <tt>value</tt> is equal to the
 * value of the specified <tt>property</tt> of the specified <tt>state</tt>).
 *
 * @param {Object} state - The (Redux) state from which a state is to be
 * constructed by setting the specified <tt>property</tt> to the specified
 * <tt>value</tt>.
 * @param {string} property - The property of <tt>state</tt> which is to be
 * assigned the specified <tt>value</tt>.
 * @param {*} value - The value to assign to the specified <tt>property</tt>.
 * @param {boolean} copyOnWrite - If the specified <tt>state</tt> is to not be
 * modified, <tt>true</tt>; otherwise, <tt>false</tt>.
 * @returns {Object} The specified <tt>state</tt> if the value of the specified
 * <tt>property</tt> equals the specified <tt>value/tt> or <tt>copyOnWrite</tt>
 * is truthy; otherwise, a new state constructed from the specified
 * <tt>state</tt> by setting the specified <tt>property</tt> to the specified
 * <tt>value</tt>.
 */
function _setStateProperty(state, property, value, copyOnWrite) {
    // Delete state properties that are to be set to undefined. (It is a matter
    // of personal preference, mostly.)
    if (typeof value === 'undefined'
            && Object.prototype.hasOwnProperty.call(state, property)) {
        const newState = copyOnWrite ? { ...state } : state;

        if (delete newState[property]) {
            return newState;
        }
    }

    if (state[property] !== value) {
        if (copyOnWrite) {
            return {
                ...state,
                [property]: value
            };
        }

        state[property] = value;
    }

    return state;
}

/* eslint-enable max-params */
