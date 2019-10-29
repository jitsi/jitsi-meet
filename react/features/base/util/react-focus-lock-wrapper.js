// @flow
import React from 'react';
import FocusLock, { MoveFocusInside } from 'react-focus-lock';

/**
 * FocusLock wrapper that disable the FocusLock in the @atlaskit/modal-dialog. We need to disable it because if the
 * iframe API is used and a dialog is displayed it is imposible to click on fields outside of the iframe (FocusLock
 * will steal the focus from any element that is not part of the dialog).
 */
export default class FocusLockWrapper extends FocusLock<*> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { children, ...otherProps } = this.props;

        const props = {
            ...otherProps,
            disabled: true
        };

        // MoveFocusInside is added in order to initially bring the focus on the dialog.
        return <FocusLock { ...props } ><MoveFocusInside>{children}</MoveFocusInside></FocusLock>;
    }
}

export * from 'react-focus-lock';
