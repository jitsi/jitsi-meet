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
        const { _dialogStyles, style } = this.props;

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
                        <TouchableOpacity
                            onPress = { this._onCancel }
                            style = { styles.closeWrapper }>
                            <Icon
                                src = { IconClose }
                                style = { _dialogStyles.closeStyle } />
                        </TouchableOpacity>
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
    _renderContent: () => Object

    /**
     * Renders a specific {@code string} which may contain HTML.
     *
     * @param {string|undefined} html - The {@code string} which may
     * contain HTML to render.
     * @returns {ReactElement[]|string}
     */
    _renderHTML(html: ?string) {
        if (typeof html === 'string') {
            // At the time of this writing, the specified HTML contains a couple
            // of spaces one after the other. They do not cause a visible
            // problem on Web, because the specified HTML is rendered as, well,
            // HTML. However, we're not rendering HTML here.

            // eslint-disable-next-line no-param-reassign
            html = html.replace(/\s{2,}/gi, ' ');

            // Render text in <b>text</b> in bold.
            const opening = /<\s*b\s*>/gi;
            const closing = /<\s*\/\s*b\s*>/gi;
            let o;
            let c;
            let prevClosingLastIndex = 0;
            const r = [];

            // eslint-disable-next-line no-cond-assign
            while (o = opening.exec(html)) {
                closing.lastIndex = opening.lastIndex;

                // eslint-disable-next-line no-cond-assign
                if (c = closing.exec(html)) {
                    r.push(html.substring(prevClosingLastIndex, o.index));
                    r.push(
                        <Text style = { styles.boldDialogText }>
                            { html.substring(opening.lastIndex, c.index) }
                        </Text>);
                    opening.lastIndex
                        = prevClosingLastIndex
                        = closing.lastIndex;
                } else {
                    break;
                }
            }
            if (prevClosingLastIndex < html.length) {
                r.push(html.substring(prevClosingLastIndex));
            }

            return r;
        }

        return html;
    }
}

export default BaseDialog;
