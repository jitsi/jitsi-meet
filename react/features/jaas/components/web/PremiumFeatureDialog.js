// @flow

import React, { PureComponent } from 'react';


import { Dialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n';
import { openURLInBrowser } from '../../../base/util';
import { JAAS_UPGRADE_URL } from '../../constants';

/**
 * Component that renders the premium feature dialog.
 *
 * @returns {React$Element<any>}
 */
class PremiumFeatureDialog extends PureComponent<*> {

    /**
     * Instantiates a new component.
     *
     * @inheritdoc
     */
    constructor(props) {
        super(props);

        this._onSubmitValue = this._onSubmitValue.bind(this);
    }


    _onSubmitValue: () => void;

    /**
     * Callback to be invoked when the dialog ok is pressed.
     *
     * @returns {boolean}
     */
    _onSubmitValue() {
        openURLInBrowser(JAAS_UPGRADE_URL, true);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        const { t } = this.props;

        return (
            <Dialog
                hideCancelButton = { true }
                okKey = { t('dialog.viewUpgradeOptions') }
                onSubmit = { this._onSubmitValue }
                titleKey = { t('dialog.viewUpgradeOptionsTitle') }
                width = { 'small' }>
                <span>{t('dialog.viewUpgradeOptionsContent')}</span>
            </Dialog>
        );
    }
}

export default translate(PremiumFeatureDialog);
