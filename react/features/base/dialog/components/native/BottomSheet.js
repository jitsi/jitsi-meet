// @flow

import React, { Component, type Node } from 'react';
import { TouchableWithoutFeedback, View } from 'react-native';
import { connect } from 'react-redux';

import { ColorSchemeRegistry } from '../../../color-scheme';
import { Modal } from '../../../react';
import { StyleType } from '../../../styles';

import { bottomSheetStyles as styles } from './styles';

/**
 * The type of {@code BottomSheet}'s React {@code Component} prop types.
 */
type Props = {

    /**
     * The color-schemed stylesheet of the feature.
     */
    _styles: StyleType,

    /**
     * The children to be displayed within this component.
     */
    children: Node,

    /**
     * Handler for the cancel event, which happens when the user dismisses
     * the sheet.
     */
    onCancel: ?Function
};

/**
 * A component emulating Android's BottomSheet. For all intents and purposes,
 * this component has been designed to work and behave as a {@code Dialog}.
 */
class BottomSheet extends Component<Props> {
    /**
     * Initializes a new {@code BottomSheet} instance.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._onCancel = this._onCancel.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _styles } = this.props;

        return [
            <View
                key = 'overlay'
                style = { styles.overlay } />,
            <Modal
                key = 'modal'
                onRequestClose = { this._onCancel }
                visible = { true }>
                <View style = { styles.container }>
                    <TouchableWithoutFeedback
                        onPress = { this._onCancel } >
                        <View style = { styles.backdrop } />
                    </TouchableWithoutFeedback>
                    <View style = { _styles.sheet }>
                        { this.props.children }
                    </View>
                </View>
            </Modal>
        ];
    }

    _onCancel: () => void;

    /**
     * Cancels the dialog by calling the onCancel prop callback.
     *
     * @private
     * @returns {void}
     */
    _onCancel() {
        const { onCancel } = this.props;

        onCancel && onCancel();
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {{
 *     _styles: StyleType
 * }}
 */
function _mapStateToProps(state) {
    return {
        _styles: ColorSchemeRegistry.get(state, 'BottomSheet')
    };
}

export default connect(_mapStateToProps)(BottomSheet);
