// @flow

import React from 'react';
import { Text } from 'react-native';

import { translate } from '../../../i18n';
import { connect } from '../../../redux';
import { _abstractMapStateToProps } from '../../functions';

import { type Props as AbstractProps } from './BaseDialog';
import BaseSubmitDialog from './BaseSubmitDialog';

type Props = AbstractProps & {

    /**
     * Untranslated i18n key of the content to be displayed.
     *
     * NOTE: This dialog also adds support to Object type keys that will be
     * translated using the provided params. See i18n function
     * {@code translate(string, Object)} for more details.
     */
    contentKey: string | { key: string, params: Object},
};

/**
 * Implements an alert dialog, to simply show an error or a message, then disappear on dismiss.
 */
class AlertDialog extends BaseSubmitDialog<Props, *> {
    /**
     * Implements {@code BaseSubmitDialog._renderSubmittable}.
     *
     * @inheritdoc
     */
    _renderSubmittable() {
        const { _dialogStyles, contentKey, t } = this.props;
        const content
            = typeof contentKey === 'string'
                ? t(contentKey)
                : this._renderHTML(t(contentKey.key, contentKey.params));

        return (
            <Text style = { _dialogStyles.text }>
                { content }
            </Text>
        );
    }

    _renderHTML: string => Object | string;
}

export default translate(connect(_abstractMapStateToProps)(AlertDialog));
