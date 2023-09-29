import React, { useCallback, useEffect, useRef } from 'react';
import { WithTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState, IStore } from '../../../app/types';
import { NotifyClickButton } from '../../../base/config/configType';
import { VISITORS_MODE_BUTTONS } from '../../../base/config/constants';
import {
    getButtonNotifyMode,
    getButtonsWithNotifyClick,
    getToolbarButtons,
    isToolbarButtonEnabled
} from '../../../base/config/functions.web';
import { isMobileBrowser } from '../../../base/environment/utils';
import { translate } from '../../../base/i18n/functions';
import { isLocalParticipantModerator } from '../../../base/participants/functions';
import ContextMenu from '../../../base/ui/components/web/ContextMenu';
import { isReactionsButtonEnabled, isReactionsEnabled } from '../../../reactions/functions.web';
import { iAmVisitor } from '../../../visitors/functions';
import {
    setHangupMenuVisible,
    setOverflowMenuVisible,
    setToolbarHovered,
    showToolbox
} from '../../actions.web';
import { NOT_APPLICABLE, THRESHOLDS } from '../../constants';
import {
    getAllToolboxButtons,
    getJwtDisabledButtons,
    isToolboxVisible
} from '../../functions.web';
import { useKeyboardShortcuts } from '../../hooks.web';
import { IToolboxButton } from '../../types';
import HangupButton from '../HangupButton';

import { EndConferenceButton } from './EndConferenceButton';
import HangupMenuButton from './HangupMenuButton';
import { LeaveConferenceButton } from './LeaveConferenceButton';
import OverflowMenuButton from './OverflowMenuButton';
import Separator from './Separator';

/**
 * The type of the React {@code Component} props of {@link Toolbox}.
 */
interface IProps extends WithTranslation {

    /**
     * Toolbar buttons which have their click exposed through the API.
     */
    _buttonsWithNotifyClick?: NotifyClickButton[];

    /**
     * Whether or not the chat feature is currently displayed.
     */
    _chatOpen: boolean;

    /**
     * The width of the client.
     */
    _clientWidth: number;

    /**
     * Custom Toolbar buttons.
     */
    _customToolbarButtons?: Array<{ backgroundColor?: string; icon: string; id: string; text: string; }>;

    /**
     * Whether or not a dialog is displayed.
     */
    _dialog: boolean;

    /**
     * Whether or not the toolbox is disabled. It is for recorders.
     */
    _disabled: boolean;

    /**
     * Whether the end conference feature is supported.
     */
    _endConferenceSupported: boolean;

    /**
     * Whether the hangup menu is visible.
     */
    _hangupMenuVisible: boolean;

    /**
     * Whether or not the app is running in mobile browser.
     */
    _isMobile: boolean;

    /**
     * Whether we are in narrow layout mode.
     */
    _isNarrowLayout: boolean;

    /**
     * The array of toolbar buttons disabled through jwt features.
     */
    _jwtDisabledButtons: string[];

    /**
     * Whether or not the overflow menu is displayed in a drawer drawer.
     */
    _overflowDrawer: boolean;

    /**
     * Whether or not the overflow menu is visible.
     */
    _overflowMenuVisible: boolean;

    /**
     * Whether or not to display reactions in separate button.
     */
    _reactionsButtonEnabled: boolean;

    /**
     * Whether or not reactions feature is enabled.
     */
    _reactionsEnabled: boolean;

    /**
     * Whether the toolbox should be shifted up or not.
     */
    _shiftUp: boolean;

    /**
     * The enabled buttons.
     */
    _toolbarButtons: Array<string>;

    /**
     * Flag showing whether toolbar is visible.
     */
    _visible: boolean;

    /**
     * Invoked to active other features of the app.
     */
    dispatch: IStore['dispatch'];

    /**
     * Explicitly passed array with the buttons which this Toolbox should display.
     */
    toolbarButtons: Array<string>;
}

const useStyles = makeStyles()(() => {
    return {
        contextMenu: {
            position: 'relative',
            right: 'auto',
            margin: 0,
            marginBottom: '8px',
            maxHeight: 'calc(100dvh - 100px)',
            minWidth: '240px'
        },

        hangupMenu: {
            position: 'relative',
            right: 'auto',
            display: 'flex',
            flexDirection: 'column',
            rowGap: '8px',
            margin: 0,
            padding: '16px',
            marginBottom: '4px'
        }
    };
});

const Toolbox = ({
    _buttonsWithNotifyClick,
    _chatOpen,
    _clientWidth,
    _customToolbarButtons,
    _dialog,
    _disabled,
    _endConferenceSupported,
    _hangupMenuVisible,
    _isMobile,
    _isNarrowLayout,
    _jwtDisabledButtons,
    _overflowDrawer,
    _overflowMenuVisible,
    _reactionsButtonEnabled,
    _reactionsEnabled,
    _shiftUp,
    _toolbarButtons,
    _visible,
    dispatch,
    t,
    toolbarButtons
}: IProps) => {
    const { classes, cx } = useStyles();
    const _toolboxRef = useRef<HTMLDivElement>(null);

    useKeyboardShortcuts(toolbarButtons);

    useEffect(() => {
        if (!_visible) {
            if (document.activeElement instanceof HTMLElement
                && _toolboxRef.current?.contains(document.activeElement)) {
                document.activeElement.blur();
            }
        }
    }, [ _visible ]);

    /**
     * Sets the visibility of the hangup menu.
     *
     * @param {boolean} visible - Whether or not the hangup menu should be
     * displayed.
     * @private
     * @returns {void}
     */
    const onSetHangupVisible = useCallback((visible: boolean) => {
        dispatch(setHangupMenuVisible(visible));
        dispatch(setToolbarHovered(visible));
    }, []);

    /**
     * Sets the visibility of the overflow menu.
     *
     * @param {boolean} visible - Whether or not the overflow menu should be
     * displayed.
     * @private
     * @returns {void}
     */
    const onSetOverflowVisible = useCallback((visible: boolean) => {
        dispatch(setOverflowMenuVisible(visible));
        dispatch(setToolbarHovered(visible));
    }, []);

    useEffect(() => {
        if (_hangupMenuVisible && !_visible) {
            onSetHangupVisible(false);
            dispatch(setToolbarHovered(false));
        }
    }, [ _hangupMenuVisible, _visible ]);

    useEffect(() => {
        if (_overflowMenuVisible && _dialog) {
            onSetOverflowVisible(false);
            dispatch(setToolbarHovered(false));
        }
    }, [ _overflowMenuVisible, _dialog ]);

    /**
     * Key handler for overflow/hangup menus.
     *
     * @param {KeyboardEvent} e - Esc key click to close the popup.
     * @returns {void}
     */
    const onEscKey = useCallback((e?: React.KeyboardEvent) => {
        if (e?.key === 'Escape') {
            e?.stopPropagation();
            _hangupMenuVisible && dispatch(setHangupMenuVisible(false));
            _overflowMenuVisible && dispatch(setOverflowMenuVisible(false));
        }
    }, [ _hangupMenuVisible, _overflowMenuVisible ]);

    /**
     * Sets the notify click mode for the buttons.
     *
     * @param {Object} buttons - The list of toolbar buttons.
     * @returns {void}
     */
    function setButtonsNotifyClickMode(buttons: Object) {
        if (typeof APP === 'undefined' || !_buttonsWithNotifyClick?.length) {
            return;
        }

        Object.values(buttons).forEach((button: any) => {
            if (typeof button === 'object') {
                button.notifyMode = getButtonNotifyMode(button.key, _buttonsWithNotifyClick);
            }
        });
    }

    /**
     * Returns all buttons that need to be rendered.
     *
     * @param {Object} state - The redux state.
     * @returns {Object} The visible buttons arrays .
     */
    function getVisibleButtons() {
        const buttons = getAllToolboxButtons(_customToolbarButtons);

        setButtonsNotifyClickMode(buttons);
        const isHangupVisible = isToolbarButtonEnabled('hangup', _toolbarButtons);
        const { order } = THRESHOLDS.find(({ width }) => _clientWidth > width)
            || THRESHOLDS[THRESHOLDS.length - 1];

        const keys = Object.keys(buttons);

        const filtered = [
            ...order.map(key => buttons[key as keyof typeof buttons]),
            ...Object.values(buttons).filter((button, index) => !order.includes(keys[index]))
        ].filter(({ key, alias = NOT_APPLICABLE }) =>
            !_jwtDisabledButtons.includes(key)
            && (isToolbarButtonEnabled(key, _toolbarButtons) || isToolbarButtonEnabled(alias, _toolbarButtons))
        );

        let sliceIndex = _overflowDrawer || _reactionsButtonEnabled ? order.length + 2 : order.length + 1;

        if (isHangupVisible) {
            sliceIndex -= 1;
        }

        // This implies that the overflow button will be displayed, so save some space for it.
        if (sliceIndex < filtered.length) {
            sliceIndex -= 1;
        }

        return {
            mainMenuButtons: filtered.slice(0, sliceIndex),
            overflowMenuButtons: filtered.slice(sliceIndex)
        };
    }

    /**
     * Dispatches an action signaling the toolbar is not being hovered.
     *
     * @private
     * @returns {void}
     */
    function onMouseOut() {
        !_overflowMenuVisible && dispatch(setToolbarHovered(false));
    }

    /**
     * Dispatches an action signaling the toolbar is being hovered.
     *
     * @private
     * @returns {void}
     */
    function onMouseOver() {
        dispatch(setToolbarHovered(true));
    }

    /**
     * Toggle the toolbar visibility when tabbing into it.
     *
     * @returns {void}
     */
    const onTabIn = useCallback(() => {
        if (!_visible) {
            dispatch(showToolbox());
        }
    }, [ _visible ]);

    /**
     * Renders the toolbox content.
     *
     * @returns {ReactElement}
     */
    function renderToolboxContent() {
        const toolbarAccLabel = 'toolbar.accessibilityLabel.moreActionsMenu';
        const containerClassName = `toolbox-content${_isMobile || _isNarrowLayout ? ' toolbox-content-mobile' : ''}`;

        const { mainMenuButtons, overflowMenuButtons } = getVisibleButtons();
        const raiseHandInOverflowMenu = overflowMenuButtons.some(({ key }) => key === 'raisehand');
        const showReactionsInOverflowMenu
            = (_reactionsEnabled && !_reactionsButtonEnabled
                && (raiseHandInOverflowMenu || _isNarrowLayout || _isMobile))
            || overflowMenuButtons.some(({ key }) => key === 'reactions');
        const showRaiseHandInReactionsMenu = showReactionsInOverflowMenu && raiseHandInOverflowMenu;

        return (
            <div className = { containerClassName }>
                <div
                    className = 'toolbox-content-wrapper'
                    onFocus = { onTabIn }
                    { ...(_isMobile ? {} : {
                        onMouseOut,
                        onMouseOver
                    }) }>

                    <div
                        className = 'toolbox-content-items'
                        ref = { _toolboxRef }>
                        {mainMenuButtons.map(({ Content, key, ...rest }) => Content !== Separator && (
                            <Content
                                { ...rest }
                                buttonKey = { key }
                                key = { key } />))}

                        {Boolean(overflowMenuButtons.length) && (
                            <OverflowMenuButton
                                ariaControls = 'overflow-menu'
                                buttons = { overflowMenuButtons.reduce<Array<IToolboxButton[]>>((acc, val) => {
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
                                            acc.push([ val ]);
                                        }
                                    } else {
                                        acc.push([ val ]);
                                    }

                                    return acc;
                                }, []) }
                                isOpen = { _overflowMenuVisible }
                                key = 'overflow-menu'
                                onToolboxEscKey = { onEscKey }
                                onVisibilityChange = { onSetOverflowVisible }
                                showRaiseHandInReactionsMenu = { showRaiseHandInReactionsMenu }
                                showReactionsMenu = { showReactionsInOverflowMenu } />
                        )}

                        {isToolbarButtonEnabled('hangup', _toolbarButtons) && (
                            _endConferenceSupported
                                ? <HangupMenuButton
                                    ariaControls = 'hangup-menu'
                                    isOpen = { _hangupMenuVisible }
                                    key = 'hangup-menu'
                                    notifyMode = { getButtonNotifyMode('hangup-menu', _buttonsWithNotifyClick) }
                                    onVisibilityChange = { onSetHangupVisible }>
                                    <ContextMenu
                                        accessibilityLabel = { t(toolbarAccLabel) }
                                        className = { classes.hangupMenu }
                                        hidden = { false }
                                        inDrawer = { _overflowDrawer }
                                        onKeyDown = { onEscKey }>
                                        <EndConferenceButton
                                            buttonKey = 'end-meeting'
                                            notifyMode = { getButtonNotifyMode(
                                                'end-meeting',
                                                _buttonsWithNotifyClick
                                            ) } />
                                        <LeaveConferenceButton
                                            buttonKey = 'hangup'
                                            notifyMode = { getButtonNotifyMode('hangup', _buttonsWithNotifyClick) } />
                                    </ContextMenu>
                                </HangupMenuButton>
                                : <HangupButton
                                    buttonKey = 'hangup'
                                    customClass = 'hangup-button'
                                    key = 'hangup-button'
                                    notifyMode = { getButtonNotifyMode('hangup', _buttonsWithNotifyClick) }
                                    visible = { isToolbarButtonEnabled('hangup', _toolbarButtons) } />
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (_disabled) {
        return null;
    }

    const rootClassNames = `new-toolbox ${_visible ? 'visible' : ''} ${
        _toolbarButtons.length ? '' : 'no-buttons'} ${_chatOpen ? 'shift-right' : ''}`;

    return (
        <div
            className = { cx(rootClassNames, _shiftUp && 'shift-up') }
            id = 'new-toolbox'>
            {renderToolboxContent()}
        </div>
    );
};

/**
 * Maps (parts of) the redux state to {@link Toolbox}'s React {@code Component}
 * props.
 *
 * @param {Object} state - The redux store/state.
 * @param {Object} ownProps - The props explicitly passed.
 * @private
 * @returns {{}}
 */
function _mapStateToProps(state: IReduxState, ownProps: any) {
    const { conference } = state['features/base/conference'];
    const { isNarrowLayout } = state['features/base/responsive-ui'];
    const endConferenceSupported = conference?.isEndConferenceSupported() && isLocalParticipantModerator(state);

    const {
        customToolbarButtons,
        iAmRecorder,
        iAmSipGateway
    } = state['features/base/config'];
    const {
        hangupMenuVisible,
        overflowMenuVisible,
        overflowDrawer
    } = state['features/toolbox'];
    const { clientWidth } = state['features/base/responsive-ui'];
    let toolbarButtons = ownProps.toolbarButtons || getToolbarButtons(state);
    const _reactionsEnabled = isReactionsEnabled(state);

    if (iAmVisitor(state)) {
        toolbarButtons = VISITORS_MODE_BUTTONS.filter(e => toolbarButtons.indexOf(e) > -1);
    }

    return {
        _buttonsWithNotifyClick: getButtonsWithNotifyClick(state),
        _chatOpen: state['features/chat'].isOpen,
        _clientWidth: clientWidth,
        _customToolbarButtons: customToolbarButtons,
        _dialog: Boolean(state['features/base/dialog'].component),
        _disabled: Boolean(iAmRecorder || iAmSipGateway),
        _endConferenceSupported: Boolean(endConferenceSupported),
        _isMobile: isMobileBrowser(),
        _jwtDisabledButtons: getJwtDisabledButtons(state),
        _hangupMenuVisible: hangupMenuVisible,
        _isNarrowLayout: isNarrowLayout,
        _overflowMenuVisible: overflowMenuVisible,
        _overflowDrawer: overflowDrawer,
        _reactionsButtonEnabled: isReactionsButtonEnabled(state),
        _reactionsEnabled,
        _shiftUp: state['features/toolbox'].shiftUp,
        _toolbarButtons: toolbarButtons,
        _visible: isToolboxVisible(state)
    };
}

export default translate(connect(_mapStateToProps)(Toolbox));
