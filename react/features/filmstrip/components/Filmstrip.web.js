/* @flow */

import React, { Component } from 'react';
import { connect } from 'react-redux';

import { Toolbox } from '../../toolbox';

import { setFilmstripVisibility } from '../actions';

declare var APP: Object;

/**
 * Implements a React {@link Component} which represents the filmstrip on
 * Web/React.
 *
 * @extends Component
 */
class Filmstrip extends Component {
    _onToggleFilmstripVisibility: Function;

    /**
     * {@code Filmstrip} component's property types.
     *
     * @static
     */
    static propTypes = {
        /**
         * Whether or not the remote videos should be visible. Will toggle
         * a class for hiding the videos.
         */
        _remoteVideosVisible: React.PropTypes.bool,

        /**
         * Whether or not the filmstrip is currently set to be visible.
         */
        _visible: React.PropTypes.bool,

        /**
         * Invoked to notify the store of filmstrip visibility changes.
         */
        dispatch: React.PropTypes.func,

        /**
         * Whether or not the app is in filmstrip only mode. If true, the
         * toolbox will also be displayed. If false, a visibility toggle will
         * display.
         */
        filmstripOnly: React.PropTypes.bool
    };

    /**
     * Initializes a new {@code Filmstrip} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this._onToggleFilmstripVisibility
            = this._onToggleFilmstripVisibility.bind(this);
    }

    /**
     * Sets a keyboard shortcut for toggling filmstrip visibility if not in
     * filmstrip only mode, which should have no visibility toggling
     * functionality.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        if (!this.props.filmstripOnly) {
            APP.keyboardshortcut.registerShortcut(
                'F',
                'filmstripPopover',
                this._onToggleFilmstripVisibility,
                'keyboardShortcuts.toggleFilmstrip'
            );
        }
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        /**
         * Note: Appending of {@code RemoteVideo} views is handled through
         * VideoLayout. The views do not get blown away on render() because
         * ReactDOMComponent is only aware of the given JSX and not new appended
         * DOM. As such, when updateDOMProperties gets called, only attributes
         * will get updated without replacing the DOM. If the known DOM gets
         * modified, then the views will get blown away.
         */

        const { _remoteVideosVisible, _visible, filmstripOnly } = this.props;
        const filmstripClassNames = `filmstrip${_remoteVideosVisible ? ''
            : ' hide-videos'}`;
        const remoteVideosClassNames = `filmstrip__videos${_visible ? ''
            : ' hidden'}${filmstripOnly ? ' filmstrip__videos-filmstripOnly'
            : ''}`;

        return (
            <div className = { filmstripClassNames }>
                { filmstripOnly ? <Toolbox /> : this._renderToggle() }
                <div
                    className = { remoteVideosClassNames }
                    id = 'remoteVideos'>
                    <div
                        className = 'filmstrip__videos'
                        id = 'filmstripLocalVideo' />
                    <div
                        className = 'filmstrip__videos'
                        id = 'filmstripRemoteVideos'>
                        {/**
                          * This extra video container is needed for scrolling
                          * thumbnails in Firefox; otherwise, the flex
                          * thumbnails resize instead of causing overflow.
                          */}
                        <div
                            className = 'remote-videos-container'
                            id = 'filmstripRemoteVideosContainer' />
                    </div>
                    <audio
                        id = 'userJoined'
                        preload = 'auto'
                        src = 'sounds/joined.wav' />
                    <audio
                        id = 'userLeft'
                        preload = 'auto'
                        src = 'sounds/left.wav' />
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
    _onToggleFilmstripVisibility() {
        const { _visible, dispatch } = this.props;

        dispatch(setFilmstripVisibility(!_visible));
    }

    /**
     * Creates a React Element for changing the visibility of the filmstrip when
     * clicked.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderToggle() {
        const iconDirection = this.props._visible ? 'down' : 'up';

        return (
            <div className = 'filmstrip__toolbar'>
                <button
                    id = 'toggleFilmstripButton'
                    onClick = { this._onToggleFilmstripVisibility }>
                    <i className = { `icon-menu-${iconDirection}` } />
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
 * @returns {{
 *     _remoteVideosVisible: boolean,
 *     _visible: boolean
 * }}
 */
function _mapStateToProps(state) {
    const { remoteVideosVisible, visible } = state['features/filmstrip'];
    const { disable1On1Mode } = state['features/base/config'];

    return {
        _remoteVideosVisible: Boolean(remoteVideosVisible || disable1On1Mode),
        _visible: visible
    };
}

export default connect(_mapStateToProps)(Filmstrip);
