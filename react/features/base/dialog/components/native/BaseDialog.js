// @flow

import React from 'react';
import {
    KeyboardAvoidingView,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';

import { Icon, IconClose } from '../../../icons';
import { StyleType } from '../../../styles';
import AbstractDialog, {
    type Props as AbstractProps,
    type State
} from '../AbstractDialog';

import { brandedDialog as styles } from './styles';

export type Props = AbstractProps & {

    /**
     * The color-schemed stylesheet of the feature.
     */
    _dialogStyles: StyleType,

    t: Function
}

/**
 * Component to render a custom dialog.
 */
class BaseDialog<P: Props, S: State> extends AbstractDialog<P, S> {
    /**
     * Initializes a new {@code FeedbackDialog} instance.
     *
     * @inheritdoc
     */
    constructor(props: P) {
        super(props);

        this._onSubmit = this._onSubmit.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _dialogStyles, style, t, titleKey } = this.props;

        return (
            <TouchableWithoutFeedback>
                <KeyboardAvoidingView
                    behavior = 'height'
                    style = { [
                        styles.overlay
                    ] }>
                    <View
                        pointerEvents = 'box-none'
                        style = { [
                            _dialogStyles.dialog,
                            style
                        ] }>
                        <View style = { styles.headerWrapper }>
                            <Text style = { styles.dialogTitle }>
                                { titleKey ? t(titleKey) : ' ' }
                            </Text>
                            <TouchableOpacity
                                onPress = { this._onCancel }
                                style = { styles.closeWrapper }>
                                <Icon
                                    src = { IconClose }
                                    style = { _dialogStyles.closeStyle } />
                            </TouchableOpacity>
                        </View>
                        { this._renderContent() }
                    </View>
                </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
        );
    }

    _onCancel: () => void;

    _onSubmit: ?string => boolean;

    /**
     * Renders the content of the dialog.
     *
     * @returns {ReactElement}
     */
    _renderContent: () => Object;
}

export default BaseDialog;
