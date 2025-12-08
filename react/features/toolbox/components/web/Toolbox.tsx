import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import { isMobileBrowser } from '../../../base/environment/utils';
import { getLocalParticipant, isLocalParticipantModerator } from '../../../base/participants/functions';
import ContextMenu from '../../../base/ui/components/web/ContextMenu';
import { isReactionsButtonEnabled, shouldDisplayReactionsButtons } from '../../../reactions/functions.web';
import { isCCTabEnabled } from '../../../subtitles/functions.any';
import { isTranscribing } from '../../../transcribing/functions';
import {
    setHangupMenuVisible,
    setOverflowMenuVisible,
    setToolbarHovered,
    setToolboxVisible
} from '../../actions.web';
import {
    getJwtDisabledButtons,
    getVisibleButtons,
    isButtonEnabled,
    isToolboxVisible
} from '../../functions.web';
import { useKeyboardShortcuts, useToolboxButtons } from '../../hooks.web';
import { IToolboxButton } from '../../types';
import HangupButton from '../HangupButton';

import { EndConferenceButton } from './EndConferenceButton';
import HangupMenuButton from './HangupMenuButton';
import { LeaveConferenceButton } from './LeaveConferenceButton';
import OverflowMenuButton from './OverflowMenuButton';
import Separator from './Separator';

// ⭐ NEW IMPORT — YOUR NOTEPAD
import NotepadPanel from '../../../notepad/NotepadPanel';

interface IProps {
    toolbarBackgroundColor?: string;
    toolbarButtons?: Array<string>;
}

const useStyles = makeStyles()(() => {
    return {
        hangupMenu: {
            position: 'relative',
            right: 'auto',
            display: 'flex',
            flexDirection: 'column',
            rowGap: '8px',
            margin: 0,
            padding: '16px',
            marginBottom: '8px'
        }
    };
});

export default function Toolbox({
    toolbarButtons,
    toolbarBackgroundColor: toolbarBackgroundColorProp
}: IProps) {
    const { classes, cx } = useStyles();
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const _toolboxRef = useRef<HTMLDivElement>(null);

    // ⭐ NEW: state for opening Notepad
    const [showNotepad, setShowNotepad] = useState(false);

    const conference = useSelector((state: IReduxState) => state['features/base/conference'].conference);
    const isNarrowLayout = useSelector((state: IReduxState) => state['features/base/responsive-ui'].isNarrowLayout);
    const videoSpaceWidth = useSelector((state: IReduxState) => state['features/base/responsive-ui'].videoSpaceWidth);
    const isModerator = useSelector(isLocalParticipantModerator);
    const customToolbarButtons = useSelector(
        (state: IReduxState) => state['features/base/config'].customToolbarButtons);
    const iAmRecorder = useSelector((state: IReduxState) => state['features/base/config'].iAmRecorder);
    const iAmSipGateway = useSelector((state: IReduxState) => state['features/base/config'].iAmSipGateway);
    const overflowDrawer = useSelector((state: IReduxState) => state['features/toolbox'].overflowDrawer);
    const shiftUp = useSelector((state: IReduxState) => state['features/toolbox'].shiftUp);
    const overflowMenuVisible = useSelector((state: IReduxState) => state['features/toolbox'].overflowMenuVisible);
    const hangupMenuVisible = useSelector((state: IReduxState) => state['features/toolbox'].hangupMenuVisible);
    const buttonsWithNotifyClick
        = useSelector((state: IReduxState) => state['features/toolbox'].buttonsWithNotifyClick);
    const reduxToolbarButtons = useSelector((state: IReduxState) => state['features/toolbox'].toolbarButtons);
    const toolbarButtonsToUse = toolbarButtons || reduxToolbarButtons;
    const isDialogVisible = useSelector((state: IReduxState) => Boolean(state['features/base/dialog'].component));
    const localParticipant = useSelector(getLocalParticipant);
    const transcribing = useSelector(isTranscribing);
    const _isCCTabEnabled = useSelector(isCCTabEnabled);

    const toolbarBackgroundColorFromConfig = useSelector((state: IReduxState) =>
        state['features/base/config'].toolbarConfig?.backgroundColor);
    const toolbarBackgroundColor = toolbarBackgroundColorProp || toolbarBackgroundColorFromConfig;

    const jwtDisabledButtons = getJwtDisabledButtons(transcribing, _isCCTabEnabled, localParticipant?.features);

    const reactionsButtonEnabled = useSelector(isReactionsButtonEnabled);
    const _shouldDisplayReactionsButtons = useSelector(shouldDisplayReactionsButtons);
    const toolbarVisible = useSelector(isToolboxVisible);
    const mainToolbarButtonsThresholds
        = useSelector((state: IReduxState) => state['features/toolbox'].mainToolbarButtonsThresholds);
    const allButtons = useToolboxButtons(customToolbarButtons);
    const isMobile = isMobileBrowser();
    const endConferenceSupported = Boolean(conference?.isEndConferenceSupported() && isModerator);

    useKeyboardShortcuts(toolbarButtonsToUse);

    useEffect(() => {
        if (!toolbarVisible) {
            if (document.activeElement instanceof HTMLElement
                && _toolboxRef.current?.contains(document.activeElement)) {
                document.activeElement.blur();
            }
        }
    }, [toolbarVisible]);

    const onSetHangupVisible = useCallback((visible: boolean) => {
        dispatch(setHangupMenuVisible(visible));
        dispatch(setToolbarHovered(visible));
    }, [dispatch]);

    const onSetOverflowVisible = useCallback((visible: boolean) => {
        dispatch(setOverflowMenuVisible(visible));
        dispatch(setToolbarHovered(visible));
    }, [dispatch]);

    useEffect(() => {
        if (endConferenceSupported && isMobile) {
            hangupMenuVisible && dispatch(setToolboxVisible(true));
        } else if (hangupMenuVisible && !toolbarVisible) {
            onSetHangupVisible(false);
            dispatch(setToolbarHovered(false));
        }
    }, [dispatch, hangupMenuVisible, toolbarVisible, onSetHangupVisible]);

    useEffect(() => {
        if (overflowMenuVisible && isDialogVisible) {
            onSetOverflowVisible(false);
            dispatch(setToolbarHovered(false));
        }
    }, [dispatch, overflowMenuVisible, isDialogVisible, onSetOverflowVisible]);

    const onEscKey = useCallback((e?: React.KeyboardEvent) => {
        if (e?.key === 'Escape') {
            e?.stopPropagation();
            hangupMenuVisible && dispatch(setHangupMenuVisible(false));
            overflowMenuVisible && dispatch(setOverflowMenuVisible(false));
        }
    }, [dispatch, hangupMenuVisible, overflowMenuVisible]);

    const onMouseOut = useCallback(() => {
        !overflowMenuVisible && dispatch(setToolbarHovered(false));
    }, [dispatch, overflowMenuVisible]);

    const onMouseOver = useCallback(() => {
        dispatch(setToolbarHovered(true));
    }, [dispatch]);

    const handleFocus = useCallback(() => {
        dispatch(setToolboxVisible(true));
    }, [dispatch]);

    const handleBlur = useCallback(() => {
        dispatch(setToolboxVisible(false));
    }, [dispatch]);

    if (iAmRecorder || iAmSipGateway) {
        return null;
    }

    const rootClassNames = `new-toolbox ${toolbarVisible ? 'visible' : ''} ${
        toolbarButtonsToUse.length ? '' : 'no-buttons'}`;

    const toolbarAccLabel = 'toolbar.accessibilityLabel.moreActionsMenu';
    const containerClassName = `toolbox-content${isMobile || isNarrowLayout ? ' toolbox-content-mobile' : ''}`;

    const { mainMenuButtons, overflowMenuButtons } = getVisibleButtons({
        allButtons,
        buttonsWithNotifyClick,
        toolbarButtons: toolbarButtonsToUse,
        clientWidth: videoSpaceWidth,
        jwtDisabledButtons,
        mainToolbarButtonsThresholds
    });
    const raiseHandInOverflowMenu = overflowMenuButtons.some(({ key }) => key === 'raisehand');
    const showReactionsInOverflowMenu = _shouldDisplayReactionsButtons
        && (
            (!reactionsButtonEnabled && (raiseHandInOverflowMenu || isNarrowLayout || isMobile))
            || overflowMenuButtons.some(({ key }) => key === 'reactions'));
    const showRaiseHandInReactionsMenu = showReactionsInOverflowMenu && raiseHandInOverflowMenu;

    return (
        <div
            className={cx(rootClassNames, shiftUp && 'shift-up')}
            id='new-toolbox'
            style={toolbarBackgroundColor ? { backgroundColor: toolbarBackgroundColor } : undefined}>
            <div className={containerClassName}>
                <div
                    className='toolbox-content-wrapper'
                    onBlur={handleBlur}
                    onFocus={handleFocus}
                    {...(isMobile ? {} : {
                        onMouseOut,
                        onMouseOver
                    })}>

                    <div
                        className='toolbox-content-items'
                        ref={_toolboxRef}>

                        {/* Render existing buttons */}
                        {mainMenuButtons.map(({ Content, key, ...rest }) => Content !== Separator && (
                            <Content
                                {...rest}
                                buttonKey={key}
                                key={key} />
                        ))}

                        {/* ⭐ NEW: Notepad Floating Button */}
                        <button
                            onClick={() => setShowNotepad(true)}
                            style={{
                                width: 40,
                                height: 40,
                                marginLeft: 8,
                                borderRadius: '50%',
                                border: 'none',
                                background: '#1e90ff',
                                color: 'white',
                                fontSize: 20,
                                cursor: 'pointer'
                            }}
                        >
                            📝
                        </button>

                        {Boolean(overflowMenuButtons.length) && (
                            <OverflowMenuButton
                                ariaControls='overflow-menu'
                                buttons={overflowMenuButtons.reduce<Array<IToolboxButton[]>>((acc, val) => {
                                    if (val.key === 'reactions' && showReactionsInOverflowMenu) {
                                        return acc;
                                    }
                                    if (val.key === 'raisehand' && showRaiseHandInReactionsMenu) {
                                        return acc;
                                    }
                                    if (acc.length) {
                                        const prev = acc[acc.length - 1];
                                        const group = prev[prev.length - 1].group;

                                        if (group === val.group) {
                                            prev.push(val);
                                        } else {
                                            acc.push([val]);
                                        }
                                    } else {
                                        acc.push([val]);
                                    }
                                    return acc;
                                }, [])}
                                isOpen={overflowMenuVisible}
                                key='overflow-menu'
                                onToolboxEscKey={onEscKey}
                                onVisibilityChange={onSetOverflowVisible}
                                showRaiseHandInReactionsMenu={showRaiseHandInReactionsMenu}
                                showReactionsMenu={showReactionsInOverflowMenu} />
                        )}

                        {isButtonEnabled('hangup', toolbarButtonsToUse) && (
                            endConferenceSupported
                                ? <HangupMenuButton
                                    ariaControls='hangup-menu'
                                    isOpen={hangupMenuVisible}
                                    key='hangup-menu'
                                    notifyMode={buttonsWithNotifyClick?.get('hangup-menu')}
                                    onVisibilityChange={onSetHangupVisible}>
                                    <ContextMenu
                                        accessibilityLabel={t(toolbarAccLabel)}
                                        className={classes.hangupMenu}
                                        hidden={false}
                                        inDrawer={overflowDrawer}
                                        onKeyDown={onEscKey}>
                                        <EndConferenceButton
                                            buttonKey='end-meeting'
                                            notifyMode={buttonsWithNotifyClick?.get('end-meeting')} />
                                        <LeaveConferenceButton
                                            buttonKey='hangup'
                                            notifyMode={buttonsWithNotifyClick?.get('hangup')} />
                                    </ContextMenu>
                                </HangupMenuButton>
                                : <HangupButton
                                    buttonKey='hangup'
                                    customClass='hangup-button'
                                    key='hangup-button'
                                    notifyMode={buttonsWithNotifyClick.get('hangup')}
                                    visible={isButtonEnabled('hangup', toolbarButtonsToUse)} />
                        )}
                    </div>
                </div>
            </div>

            {/* ⭐ NEW: Notepad Panel */}
            {showNotepad && (
                <NotepadPanel onClose={() => setShowNotepad(false)} />
            )}
        </div>
    );
}
