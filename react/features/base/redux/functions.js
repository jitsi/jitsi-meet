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
    // Delete state properties that are to be set to undefined. (It is a matter
    // of personal preference, mostly.)
    if (typeof value === 'undefined'
            && Object.prototype.hasOwnProperty.call(state, property)) {
        const newState = { ...state };

        if (delete newState[property]) {
            return newState;
        }
    }

    if (state[property] !== value) {
        return {
            ...state,
            [property]: value
        };
    }

    return state;
}
