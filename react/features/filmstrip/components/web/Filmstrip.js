/* @flow */

import React, { Component } from 'react';
import type { Dispatch } from 'redux';

import {
    createShortcutEvent,
    createToolbarEvent,
    sendAnalytics
} from '../../../analytics';
import { getToolbarButtons } from '../../../base/config';
import { translate } from '../../../base/i18n';
import { Icon, IconMenuDown, IconMenuUp } from '../../../base/icons';
import { getLocalParticipant } from '../../../base/participants';
import { connect } from '../../../base/redux';
import { isButtonEnabled } from '../../../toolbox/functions.web';
import { LAYOUTS, getCurrentLayout } from '../../../video-layout';
import { setFilmstripVisible } from '../../actions';
import { shouldRemoteVideosBeVisible } from '../../functions';

import Thumbnail from './Thumbnail';

declare var APP: Object;
declare var interfaceConfig: Object;

/**
 * The type of the React {@code Component} props of {@link Filmstrip}.
 */
type Props = {

    /**
     * Additional CSS class names top add to the root.
     */
    _className: string,

    /**
     * The current layout of the filmstrip.
     */
    _currentLayout: string,

    /**
     * The number of columns in tile view.
     */
    _columns: number,

    /**
     * The width of the filmstrip.
     */
    _filmstripWidth: number,

    /**
     * Whether the filmstrip scrollbar should be hidden or not.
     */
    _hideScrollbar: boolean,

    /**
     * Whether the filmstrip toolbar should be hidden or not.
     */
    _hideToolbar: boolean,

    /**
     * Whether the filmstrip button is enabled.
     */
    _isFilmstripButtonEnabled: boolean,

    /**
     * The participants in the call.
     */
    _participants: Array<Object>,

    /**
     * The number of rows in tile view.
     */
    _rows: number,

    /**
     * Additional CSS class names to add to the container of all the thumbnails.
     */
    _videosClassName: string,

    /**
     * Whether or not the filmstrip videos should currently be displayed.
     */
    _visible: boolean,

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Dispatch<any>,

    /**
     * Invoked to obtain translated strings.
     */
    t: Function
};

/**
 * Implements a React {@link Component} which represents the filmstrip on
 * Web/React.
 *
 * @extends Component
 */
class Filmstrip extends Component <Props> {

    /**
     * Initializes a new {@code Filmstrip} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: Props) {
        super(props);

        // Bind event handlers so they are only bound once for every instance.
        this._onShortcutToggleFilmstrip = this._onShortcutToggleFilmstrip.bind(this);
        this._onToolbarToggleFilmstrip = this._onToolbarToggleFilmstrip.bind(this);
    }

    /**
     * Implements React's {@link Component#componentDidMount}.
     *
     * @inheritdoc
     */
    componentDidMount() {
        APP.keyboardshortcut.registerShortcut(
            'F',
            'filmstripPopover',
            this._onShortcutToggleFilmstrip,
            'keyboardShortcuts.toggleFilmstrip'
        );
    }

    /**
     * Implements React's {@link Component#componentDidUpdate}.
     *
     * @inheritdoc
     */
    componentWillUnmount() {
        APP.keyboardshortcut.unregisterShortcut('F');
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const filmstripStyle = { };
        const filmstripRemoteVideosContainerStyle = {};
        let remoteVideoContainerClassName = 'remote-videos-container';
        const { _currentLayout, _participants } = this.props;
        const remoteParticipants = _participants.filter(p => !p.local);
        const localParticipant = getLocalParticipant(_participants);
        const tileViewActive = _currentLayout === LAYOUTS.TILE_VIEW;

        switch (_currentLayout) {
        case LAYOUTS.VERTICAL_FILMSTRIP_VIEW:
            // Adding 18px for the 2px margins, 2px borders on the left and right and 5px padding on the left and right.
            // Also adding 7px for the scrollbar.
            filmstripStyle.maxWidth = (interfaceConfig.FILM_STRIP_MAX_HEIGHT || 120) + 25;
            break;
        case LAYOUTS.TILE_VIEW: {
            // The size of the side margins for each tile as set in CSS.
            const { _columns, _rows, _filmstripWidth } = this.props;

            if (_rows > _columns) {
                remoteVideoContainerClassName += ' has-overflow';
            }

            filmstripRemoteVideosContainerStyle.width = _filmstripWidth;
            break;
        }
        }

        let remoteVideosWrapperClassName = 'filmstrip__videos';

        if (this.props._hideScrollbar) {
            remoteVideosWrapperClassName += ' hide-scrollbar';
        }

        let toolbar = null;

        if (!this.props._hideToolbar && this.props._isFilmstripButtonEnabled) {
            toolbar = this._renderToggleButton();
        }

        return (
            <div
                className = { `filmstrip ${this.props._className}` }
                style = { filmstripStyle }>
                { toolbar }
                <div
                    className = { this.props._videosClassName }
                    id = 'remoteVideos'>
                    <div
                        className = 'filmstrip__videos'
                        id = 'filmstripLocalVideo'>
                        <div id = 'filmstripLocalVideoThumbnail'>
                            {
                                !tileViewActive && <Thumbnail
                                    key = 'local'
                                    participantID = { localParticipant.id } />
                            }
                        </div>
                    </div>
                    <div
                        className = { remoteVideosWrapperClassName }
                        id = 'filmstripRemoteVideos'>
                        {/*
                          * XXX This extra video container is needed for
                          * scrolling thumbnails in Firefox; otherwise, the flex
                          * thumbnails resize instead of causing overflow.
                          */}
                        <div
                            className = { remoteVideoContainerClassName }
                            id = 'filmstripRemoteVideosContainer'
                            style = { filmstripRemoteVideosContainerStyle }>
                            {
                                remoteParticipants.map(
                                    p => (
                                        <Thumbnail
                                            key = { `remote_${p.id}` }
                                            participantID = { p.id } />
                                    ))
                            }
                            <div id = 'localVideoTileViewContainer'>
                                {
                                    tileViewActive && <Thumbnail
                                        key = 'local'
                                        participantID = { localParticipant.id } />
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    /**
     * Dispatches an action to change the visibility of the filmstrip.
     *
     * @private
     * @returns {void}
     */
    _doToggleFilmstrip() {
        this.props.dispatch(setFilmstripVisible(!this.props._visible));
    }

    _onShortcutToggleFilmstrip: () => void;

    /**
     * Creates an analytics keyboard shortcut event and dispatches an action for
     * toggling filmstrip visibility.
     *
     * @private
     * @returns {void}
     */
    _onShortcutToggleFilmstrip() {
        sendAnalytics(createShortcutEvent(
            'toggle.filmstrip',
            {
                enable: this.props._visible
            }));

        this._doToggleFilmstrip();
    }

    _onToolbarToggleFilmstrip: () => void;

    /**
     * Creates an analytics toolbar event and dispatches an action for opening
     * the speaker stats modal.
     *
     * @private
     * @returns {void}
     */
    _onToolbarToggleFilmstrip() {
        sendAnalytics(createToolbarEvent(
            'toggle.filmstrip.button',
            {
                enable: this.props._visible
            }));

        this._doToggleFilmstrip();
    }

    /**
     * Creates a React Element for changing the visibility of the filmstrip when
     * clicked.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderToggleButton() {
        const icon = this.props._visible ? IconMenuDown : IconMenuUp;
        const { t } = this.props;

        return (
            <div className = 'filmstrip__toolbar'>
                <button
                    aria-label = { t('toolbar.accessibilityLabel.toggleFilmstrip') }
                    id = 'toggleFilmstripButton'
                    onClick = { this._onToolbarToggleFilmstrip }>
                    <Icon src = { icon } />
                </button>
            </div>
        );
    }
}

/**
 * Maps (parts of) the Redux state to the associated {@code Filmstrip}'s props.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state) {
    const { iAmSipGateway } = state['features/base/config'];
    const toolbarButtons = getToolbarButtons(state);
    const { visible } = state['features/filmstrip'];
    const reduceHeight
        = state['features/toolbox'].visible && toolbarButtons.length;
    const remoteVideosVisible = shouldRemoteVideosBeVisible(state);
    const { isOpen: shiftRight } = state['features/chat'];
    const className = `${remoteVideosVisible ? '' : 'hide-videos'} ${
        reduceHeight ? 'reduce-height' : ''
    } ${shiftRight ? 'shift-right' : ''}`.trim();
    const videosClassName = `filmstrip__videos${visible ? '' : ' hidden'}`;
    const { gridDimensions = {}, filmstripWidth } = state['features/filmstrip'].tileViewDimensions;

    return {
        _className: className,
        _columns: gridDimensions.columns,
        _currentLayout: getCurrentLayout(state),
        _filmstripWidth: filmstripWidth,
        _hideScrollbar: Boolean(iAmSipGateway),
        _hideToolbar: Boolean(iAmSipGateway),
        _isFilmstripButtonEnabled: isButtonEnabled('filmstrip', state),
        _participants: state['features/base/participants'],
        _rows: gridDimensions.rows,
        _videosClassName: videosClassName,
        _visible: visible
    };
}

export default translate(connect(_mapStateToProps)(Filmstrip));
