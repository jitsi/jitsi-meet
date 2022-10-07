import React, { PureComponent } from 'react';


import { translate } from '../../../base/i18n/functions';
import Dialog from '../../../base/ui/components/web/Dialog';
import { openURLInBrowser } from '../../../base/util/openURLInBrowser.web';
import { JAAS_UPGRADE_URL } from '../../constants';

/**
 * Component that renders the premium feature dialog.
 *
 * @returns {React$Element<any>}
 */
class PremiumFeatureDialog extends PureComponent<any> {

    /**
     * Instantiates a new component.
     *
     * @inheritdoc
     */
    constructor(props: any) {
        super(props);

        this._onSubmitValue = this._onSubmitValue.bind(this);
    }

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
                cancel = {{ hidden: true }}
                ok = {{ translationKey: 'dialog.viewUpgradeOptions' }}
                onSubmit = { this._onSubmitValue }
                titleKey = { t('dialog.viewUpgradeOptionsTitle') }>
                <span>{t('dialog.viewUpgradeOptionsContent')}</span>
            </Dialog>
        );
    }
}

export default translate(PremiumFeatureDialog);
