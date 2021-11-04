// @flow

import React, { Component, type Node } from 'react';
import { Modal as NativeModal } from 'react-native';

/**
 * Type of the props of the component.
 */
type Props = {

    /**
     * Children of the component.
     */
    children: Node

    /**
     * NOTE: We pass through all props to {@code react-native#Modal} that are
     * passed to this component, so we don't list them all here, as that would
     * be an unnecessary duplication and probably an unmaintained list after a
     * while.
     *
     * See list: https://facebook.github.io/react-native/docs/modal.
     */
};

/**
 * Implements a generic Modal (using the built-in Modal component) to share
 * behaviour across modals in the app.
 */
export default class Modal extends Component<Props> {

    /**
     * Implements {@code Component#render}.
     *
     * @inheritdoc
     */
    render() {
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
