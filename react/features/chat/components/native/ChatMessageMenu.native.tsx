import React, { PureComponent } from 'react';
import { Text, TextStyle, View, ViewStyle } from 'react-native';
import { connect } from 'react-redux';

import { IStore } from '../../../app/types';
import { hideSheet } from '../../../base/dialog/actions';
import BottomSheet from '../../../base/dialog/components/native/BottomSheet';
import { bottomSheetStyles } from '../../../base/dialog/components/native/styles';
import { IMessage } from '../../types';

import CopyMessageButton from './CopyMessageButton.native';
import styles from './styles';

interface IProps {

    /**
     * The Redux dispatch function.
     */
    dispatch: IStore['dispatch'];

    /**
     * The message being rendered in this menu.
     */
    message: IMessage;
}

class ChatMessageMenu extends PureComponent<IProps> {
    /**
     * Constructor of the component.
     *
     * @inheritdoc
     */
    constructor(props: IProps) {
        super(props);

        this._onCancel = this._onCancel.bind(this);
        this._renderMenuHeader = this._renderMenuHeader.bind(this);
    }

    /**
     * Implements {@code Component#render}.
     *
     * @inheritdoc
     */
    override render() {
        const { message } = this.props;
        const buttonProps = {
            afterClick: this._onCancel,
            message,
            showLabel: true,
            styles: bottomSheetStyles.buttons
        };

        return (
            <BottomSheet
                renderHeader = { this._renderMenuHeader }>
                <CopyMessageButton { ...buttonProps } />
            </BottomSheet>
        );
    }

    /**
     * Callback to hide this menu.
     *
     * @private
     * @returns {boolean}
     */
    _onCancel() {
        this.props.dispatch(hideSheet());
    }

    /**
     * Function to render the menu's header.
     *
     * @returns {React$Element}
     */
    _renderMenuHeader() {
        const { message } = this.props;

        return (
            <View
                style = { [
                    bottomSheetStyles.sheet,
                    styles.messageMenuHeader as ViewStyle
                ] }>
                <Text
                    ellipsizeMode = { 'middle' }
                    numberOfLines = { 1 }
                    style = { styles.messageMenuHeaderText as TextStyle }>
                    { message.message }
                </Text>
            </View>
        );
    }
}

export default connect()(ChatMessageMenu);
