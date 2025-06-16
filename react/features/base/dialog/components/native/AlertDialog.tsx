import React from 'react';
import { WithTranslation } from 'react-i18next';
import Dialog from 'react-native-dialog';
import { connect } from 'react-redux';

import { translate } from '../../../i18n/functions';
import { _abstractMapStateToProps } from '../../functions';
import { renderHTML } from '../functions.native';

import AbstractDialog, { IProps as AbstractProps } from './AbstractDialog';

interface IProps extends AbstractProps, WithTranslation {

    /**
     * Untranslated i18n key of the content to be displayed.
     *
     * NOTE: This dialog also adds support to Object type keys that will be
     * translated using the provided params. See i18n function
     * {@code translate(string, Object)} for more details.
     */
    contentKey: string | { key: string; params: Object; };
}

/**
 * Implements an alert dialog, to simply show an error or a message,
 * then disappear on dismiss.
 */
class AlertDialog extends AbstractDialog<IProps> {
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
            <Dialog.Container
                coverScreen = { false }
                visible = { true }>
                <Dialog.Description>
                    { content }
                </Dialog.Description>
                <Dialog.Button
                    label = { t('dialog.Ok') }
                    onPress = { this._onSubmit } />
            </Dialog.Container>
        );
    }
}

export default translate(connect(_abstractMapStateToProps)(AlertDialog));
