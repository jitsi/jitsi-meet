import React from 'react';
import { connect } from 'react-redux';
import Prompt from 'react-native-prompt';

import { translate } from '../../i18n';

import AbstractDialog from './AbstractDialog';

/**
 * Native dialog using Prompt.
 */
class Dialog extends AbstractDialog {

    /**
     * Native sialog component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * I18n key to put as body title.
         */
        bodyKey: React.PropTypes.string
    };

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            cancelDisabled,
            cancelTitleKey,
            bodyKey,
            okDisabled,
            okTitleKey,
            t,
            titleKey
        } = this.props;

        return (
            <Prompt
                cancelText = { cancelDisabled
                    ? undefined : t(cancelTitleKey || 'dialog.Cancel') }
                onCancel = { this._onCancel }
                onSubmit = { this._onSubmit }
                placeholder = { t(bodyKey) }
                submitText = { okDisabled
                    ? undefined : t(okTitleKey || 'dialog.Ok') }
                title = { t(titleKey) }
                visible = { true } />
        );
    }
}

export default translate(connect()(Dialog));
