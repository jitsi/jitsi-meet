import React, { useCallback, useState } from 'react';
import { WithTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { createToolbarEvent } from '../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../analytics/functions';
import { IReduxState } from '../../../app/types';
import { SPATIAL_AUDIO_ENABLED } from '../../../base/flags/constants';
import { getFeatureFlag } from '../../../base/flags/functions';
import { translate } from '../../../base/i18n/functions';
import { IconArrowUp, IconVolumeUp } from '../../../base/icons/svg';
import Popover from '../../../base/popover/components/Popover.web';
import { SMALL_MOBILE_WIDTH } from '../../../base/responsive-ui/constants';
import ToolboxButtonWithIcon from '../../../base/toolbox/components/web/ToolboxButtonWithIcon';
import AbstractButton, { type IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import ContextMenu from '../../../base/ui/components/web/ContextMenu';
import ContextMenuItem from '../../../base/ui/components/web/ContextMenuItem';
import ContextMenuItemGroup from '../../../base/ui/components/web/ContextMenuItemGroup';
import { toggleSpatialAudio } from '../../../video-layout/actions.any';
import logger from '../logger';

const OPTIONS = ['default', 'equalpower', 'hrtf'];

interface IProps extends WithTranslation, AbstractButtonProps {
    /**
     * The popup placement enum value.
     */
    popupPlacement: string;

    /**
     * Whether spatial audio is currently enabled.
     */
    _spatialAudioEnabled: boolean;

    /**
     * Whether spatial audio feature is available.
     */
    _spatialAudioFeatureEnabled: boolean;
}

const useStyles = makeStyles()(() => {
    return {
        container: {
            display: 'inline-block'
        },
        contextMenu: {
            position: 'relative',
            right: 'auto',
            margin: 0,
            marginBottom: '8px',
            maxHeight: 'calc(100dvh - 100px)',
            overflow: 'auto',
            width: '200px'
        }
    };
});

class SoundIconButton extends AbstractButton<IProps> {
    override accessibilityLabel = 'toolbar.accessibilityLabel.sound';
    override icon = IconVolumeUp;
    override label = 'toolbar.sound';
    override tooltip = 'toolbar.sound';
}

function SoundSettingsPopup({ children, popupPlacement, t, spatialAudioEnabled, spatialAudioFeatureEnabled, dispatch }: { 
    children: React.ReactNode; 
    popupPlacement: string; 
    t: Function;
    spatialAudioEnabled: boolean;
    spatialAudioFeatureEnabled: boolean;
    dispatch: Function;
}) {
    const [ isOpen, setIsOpen ] = useState(false);
    const [ option, setOption ] = useState(spatialAudioEnabled ? 'hrtf' : 'default');
    const { classes, cx } = useStyles();

    const onOpen = useCallback(() => setIsOpen(true), []);
    const onClose = useCallback(() => setIsOpen(false), []);
    const onSelect = useCallback((opt: string) => {
        setOption(opt);
        logger.info(`Sound option selected: ${opt}`);
        
        // Handle spatial audio toggle when HRTF is selected/deselected
        if (opt === 'hrtf' && !spatialAudioEnabled && spatialAudioFeatureEnabled) {
            // Enable spatial audio when HRTF is selected
            sendAnalytics(createToolbarEvent(
                'spatial.button',
                {
                    'is_enabled': false
                }));
            dispatch(toggleSpatialAudio());
        } else if (opt !== 'hrtf' && spatialAudioEnabled && spatialAudioFeatureEnabled) {
            // Disable spatial audio when switching away from HRTF
            sendAnalytics(createToolbarEvent(
                'spatial.button',
                {
                    'is_enabled': true
                }));
            dispatch(toggleSpatialAudio());
        }
        
        console.log('Sound option selected:', opt);
        onClose();
    }, [ onClose, spatialAudioEnabled, spatialAudioFeatureEnabled, dispatch ]);

    const getKey = (opt: string) => `toolbar.sound${opt.charAt(0).toUpperCase()}${opt.slice(1)}`;

    const menu = (
        <ContextMenu
            accessibilityLabel = { t('toolbar.sound') }
            className = { classes.contextMenu }
            hidden = { false }
            id = 'sound-context-menu'>
            <ContextMenuItemGroup>
                {OPTIONS.map(opt => (
                    <ContextMenuItem
                        accessibilityLabel = { t(getKey(opt)) }
                        key = { opt }
                        onClick = { () => onSelect(opt) }
                        selected = { option === opt }
                        text = { t(getKey(opt)) } />
                ))}
            </ContextMenuItemGroup>
        </ContextMenu>
    );

    return (
        <div className = { cx(classes.container, 'sound-preview') }>
            <Popover
                allowClick = { true }
                content = { menu }
                headingId = 'sound-settings-button'
                onPopoverClose = { onClose }
                onPopoverOpen = { onOpen }
                position = { popupPlacement }
                trigger = 'click'
                visible = { isOpen }>
                {children}
            </Popover>
        </div>
    );
}

function SoundButton({ t, dispatch, i18n, tReady, popupPlacement, _spatialAudioEnabled, _spatialAudioFeatureEnabled }: IProps) {
    const onClick = useCallback(() => {
        // Handle click if needed
    }, []);

    return (
        <SoundSettingsPopup 
            popupPlacement={popupPlacement} 
            t={t}
            spatialAudioEnabled={_spatialAudioEnabled}
            spatialAudioFeatureEnabled={_spatialAudioFeatureEnabled}
            dispatch={dispatch}>
            <ToolboxButtonWithIcon
                ariaControls = 'sound-settings-dialog'
                ariaExpanded = { false }
                ariaHasPopup = { true }
                ariaLabel = { t('toolbar.accessibilityLabel.sound') }
                icon = { IconArrowUp }
                iconDisabled = { false }
                iconId = 'sound-settings-button'
                iconTooltip = { t('toolbar.sound') }
                onIconClick = { onClick }>
                <SoundIconButton 
                    t = { t }
                    dispatch = { dispatch }
                    i18n = { i18n }
                    tReady = { tReady }
                    popupPlacement = { popupPlacement }
                    _spatialAudioEnabled = { _spatialAudioEnabled }
                    _spatialAudioFeatureEnabled = { _spatialAudioFeatureEnabled } />
            </ToolboxButtonWithIcon>
        </SoundSettingsPopup>
    );
}

/**
 * Function that maps parts of Redux state tree into component props.
 *
 * @param {Object} state - Redux state.
 * @returns {Object}
 */
function mapStateToProps(state: IReduxState) {
    const { videoSpaceWidth } = state['features/base/responsive-ui'];
    const spatialAudioFeatureEnabled = getFeatureFlag(state, SPATIAL_AUDIO_ENABLED, true);

    return {
        popupPlacement: videoSpaceWidth <= Number(SMALL_MOBILE_WIDTH) ? 'auto' : 'top-end',
        _spatialAudioEnabled: (window as any).spatialAudio || false,
        _spatialAudioFeatureEnabled: spatialAudioFeatureEnabled
    };
}

export default translate(connect(mapStateToProps)(SoundButton));
