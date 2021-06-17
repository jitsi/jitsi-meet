// @flow

import React from 'react';
import { connect } from 'react-redux';

import { VirtualBackgroundDialog } from '../../../../virtual-background/components/index';
import { translate } from '../../../../base/i18n';
import { openDialog } from '../../../../base/dialog';
import { IconShareDesktop, IconVirtualBackground } from '../../../../base/icons';
import ToolbarButton from '../../../../toolbox/components/web/ToolbarButton';
type Props = {

    /**
     * Open the embed virtual background dialog
     */
    openEmbedDialog: Function,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function,
};
const ScreenShareSettingsContent = ({ t, openEmbedDialog }: Props) => {
    const shareScreen = () => { console.log('simple share screen')};
    const shareScreenAsVirtualBackground = () => {
        openEmbedDialog(VirtualBackgroundDialog, {
            share: true
        })
    }
    return (
        <div className = 'screen-share-settings'>
            <ToolbarButton
                accessibilityLabel={t('toolbar.accessibilityLabel.shareYourScreen')}
                icon={IconShareDesktop}
                key='screen-share'
                onClick={shareScreen}
                tooltip={t('dialog.shareYourScreen')} />
            <ToolbarButton
                accessibilityLabel={t('toolbar.accessibilityLabel.shareYourScreen')}
                icon={IconVirtualBackground}
                key='screen-share-as-background'
                onClick={shareScreenAsVirtualBackground}
                tooltip={t('dialog.shareYourScreen')} />
        </div>
    );
};
const mapDispatchToProps = { openEmbedDialog: openDialog };

export default translate(connect(null, mapDispatchToProps)(ScreenShareSettingsContent));
