// @flow
import React from 'react';
import FocusLock, { MoveFocusInside } from 'react-focus-lock';

/**
 * FocusLock wrapper that disable the FocusLock in the @atlaskit/modal-dialog. We need to disable it because if the
 * iframe API is used and a dialog is displayed it is impossible to click on fields outside of the iframe (FocusLock
 * will steal the focus from any element that is not part of the dialog).
 *
 * @param {Object} props - The props passed to the FocusLock.
 * @returns {ReactElement}
 */
export default (props: Object) => {
    const { children, ...otherProps } = props;

    const forwardProps = {
        ...otherProps,
        crossFrame: false
    };

    // MoveFocusInside is added in order to initially bring the focus on the dialog.
    return (
        <FocusLock
            { ...forwardProps }
            className = 'focus-lock'>
            <MoveFocusInside>{children}</MoveFocusInside>
        </FocusLock>
    );
};

export * from 'react-focus-lock';
