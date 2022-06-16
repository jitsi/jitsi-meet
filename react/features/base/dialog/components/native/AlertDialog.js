// @flow

import React from 'react';
import { View } from 'react-native';
import Dialog from 'react-native-dialog';

import { translate } from '../../../i18n';
import { connect } from '../../../redux';
import { _abstractMapStateToProps } from '../../functions';
import AbstractDialog, { type Props as AbstractProps } from '../AbstractDialog';
import { renderHTML } from '../functions.native';


type Props = AbstractProps & {

    /**
     * Untranslated i18n key of the content to be displayed.
     *
     * NOTE: This dialog also adds support to Object type keys that will be
     * translated using the provided params. See i18n function
     * {@code translate(string, Object)} for more details.
     */
    contentKey: string | { key: string, params: Object},

    /**
     * Translation function.
     */
    t: Function
};

/**
 * Implements an alert dialog, to simply show an error or a message,
 * then disappear on dismiss.
 */
class AlertDialog extends AbstractDialog<Props> {
    /**
     * Implements React's {@link Component#render}.
     *
     * @inheritdoc
     */
    render() {
        const { contentKey, t } = this.props;
        const content
            = typeof contentKey === 'string'
                ? t(contentKey)
                : renderHTML(t(contentKey.key, contentKey.params));

        return (
            <View>
                <Dialog.Container visible = { true }>
                    <Dialog.Description>
                        { content }
                    </Dialog.Description>
                    <Dialog.Button
                        label = { t('dialog.Ok') }
                        onPress = { this._onSubmit } />
                </Dialog.Container>
            </View>
        );
    }

    _onSubmit: () => boolean;
}

export default translate(connect(_abstractMapStateToProps)(AlertDialog));
