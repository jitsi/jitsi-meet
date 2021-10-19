// @flow

/**
 * An object containing all the class names for common CSS.
 * Add a new name here and the styles to {@code commonStyles} object.
 *
 */
export const commonClassName = {
    emptyList: 'empty-list'
};

/**
 * An object containing the declaration of the common, reusable CSS classes.
 */
export const commonStyles = {
    // '.empty-list'
    [commonClassName.emptyList]: {
        listStyleType: 'none',
        margin: 0,
        padding: 0
    }
};

/**
 * Returns the global styles.
 *
 * @param {Object} theme - The Jitsi theme.
 * @returns {Object}
 */
export const getGlobalStyles = (theme: Object) => {
    return {
        // @atlaskit/modal-dialog OVERRIDES
        '.atlaskit-portal div[role=dialog]': {
            // override dialog background
            '& > div': {
                background: theme.palette.ui02,
                color: theme.palette.text01
            }
        }
    };
};
