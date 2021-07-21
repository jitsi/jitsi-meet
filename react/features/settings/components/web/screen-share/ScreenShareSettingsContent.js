// @flow

import React from 'react';
import { connect } from 'react-redux';

import { openDialog } from '../../../../base/dialog';
import { translate } from '../../../../base/i18n';
import { IconVirtualBackground } from '../../../../base/icons';
import MainShareDesktopButton from '../../../../toolbox/components/MainShareDesktopButton';
import ToolbarButton from '../../../../toolbox/components/web/ToolbarButton';
import { VirtualBackgroundDialog } from '../../../../virtual-background/components/index';

type Props = {

    /**
     * Open the embed virtual background dialog
     */
    openEmbedDialog: Function,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};
const ScreenShareSettingsContent = ({ t, openEmbedDialog }: Props) => {
    const shareScreenAsVirtualBackground = () => {
        openEmbedDialog(VirtualBackgroundDialog, {
            share: true
        });
    };

    return (
        <div className = 'screen-share-settings'>
            <div className = 'screen-share-menu-item'>
                <ToolbarButton
                    accessibilityLabel = { t('toolbar.accessibilityLabel.shareYourScreen') }
                    icon = { IconVirtualBackground }
                    key = 'desktop-share-as-a-background'
                    /* eslint-disable react/jsx-no-bind */
                    onClick = { shareScreenAsVirtualBackground }
                    tooltip = { t('virtualBackground.desktopShareAsAVirtualBackground') } />
                <span>{t('virtualBackground.desktopShareAsAVirtualBackground')}</span>
            </div>
            <div className = 'screen-share-menu-item'>
                <MainShareDesktopButton />
                <span>{t('toolbar.accessibilityLabel.shareYourScreen')}</span>
            </div>
        </div>
    );
};
const mapDispatchToProps = { openEmbedDialog: openDialog };

export default translate(
    connect(
        null,
        mapDispatchToProps
    )(ScreenShareSettingsContent)
);
