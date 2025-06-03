import React, { useCallback, useState } from 'react';
import { WithTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import { IconArrowUp, IconVolumeUp } from '../../../base/icons/svg';
import Popover from '../../../base/popover/components/Popover.web';
import { SMALL_MOBILE_WIDTH } from '../../../base/responsive-ui/constants';
import ToolboxButtonWithIcon from '../../../base/toolbox/components/web/ToolboxButtonWithIcon';
import AbstractButton, { type IProps as AbstractButtonProps } from '../../../base/toolbox/components/AbstractButton';
import ContextMenu from '../../../base/ui/components/web/ContextMenu';
import ContextMenuItem from '../../../base/ui/components/web/ContextMenuItem';
import ContextMenuItemGroup from '../../../base/ui/components/web/ContextMenuItemGroup';
import logger from '../logger';

const OPTIONS = ['default', 'equalpower', 'hrtf'];

interface IProps extends WithTranslation, AbstractButtonProps {
    /**
     * The popup placement enum value.
     */
    popupPlacement: string;
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

function SoundSettingsPopup({ children, popupPlacement, t }: { children: React.ReactNode; popupPlacement: string; t: Function }) {
    const [ isOpen, setIsOpen ] = useState(false);
    const [ option, setOption ] = useState('default');
    const { classes, cx } = useStyles();

    const onOpen = useCallback(() => setIsOpen(true), []);
    const onClose = useCallback(() => setIsOpen(false), []);
    const onSelect = useCallback((opt: string) => {
        setOption(opt);
        logger.info(`Sound option selected: ${opt}`);
        // eslint-disable-next-line no-console
        console.log('Sound option selected:', opt);
        onClose();
    }, [ onClose ]);

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

function SoundButton({ t, dispatch, i18n, tReady, popupPlacement }: IProps) {
    const onClick = useCallback(() => {
        // Handle click if needed
    }, []);

    return (
        <SoundSettingsPopup popupPlacement={popupPlacement} t={t}>
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
                    popupPlacement = { popupPlacement } />
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

    return {
        popupPlacement: videoSpaceWidth <= Number(SMALL_MOBILE_WIDTH) ? 'auto' : 'top-end'
    };
}

export default translate(connect(mapStateToProps)(SoundButton));
