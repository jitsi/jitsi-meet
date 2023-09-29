import React, { Component } from 'react';
import { WithTranslation } from 'react-i18next';

import { translate } from '../../base/i18n/functions';

/**
 * A component that renders the description of the notification for old Jitsi Meet Electron clients.
 *
 * @augments AbstractApp
 */
export class OldElectronAPPNotificationDescription extends Component<WithTranslation> {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { t } = this.props;

        return (
            <div>
                { t('notify.oldElectronClientDescription1') }
                <a
                    href = 'https://github.com/jitsi/jitsi-meet-electron/releases/latest'
                    rel = 'noopener noreferrer'
                    target = '_blank'>
                    { t('notify.oldElectronClientDescription2') }
                </a>
                { t('notify.oldElectronClientDescription3') }
            </div>
        );
    }

}

export default translate(OldElectronAPPNotificationDescription);
