import React, { PureComponent } from 'react';
import { Modal as NativeModal } from 'react-native';

/**
 * Implements a generic Modal (using the built-in Modal component) to share
 * behavior across modals in the app.
 */
export default class Modal extends PureComponent {

    /**
     * Implements {@code Component#render}.
     *
     * @inheritdoc
     */
    render() {
        // eslint-disable-next-line react/prop-types
        const { children, ...props } = this.props;

        return (
            <NativeModal
                animationType = { 'slide' }
                supportedOrientations = { [
                    'landscape',
                    'portrait'
                ] }
                transparent = { true }
                { ...props } >
                { children }
            </NativeModal>
        );
    }
}
