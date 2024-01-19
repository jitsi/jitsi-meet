import React, { Component } from 'react';

// We need to reference these files directly to avoid loading things that are not available
// in this environment (e.g. JitsiMeetJS or interfaceConfig)
import StatelessAvatar from '../base/avatar/components/web/StatelessAvatar';
import { getAvatarColor, getInitials } from '../base/avatar/functions';
import { DEFAULT_ICON } from '../base/icons/svg/constants';

import Toolbar from './Toolbar';

const { api } = window.alwaysOnTop;

/**
 * The timeout in ms for hiding the toolbar.
 */
const TOOLBAR_TIMEOUT = 4000;

/**
 * The type of the React {@code Component} state of {@link AlwaysOnTop}.
 */
interface IState {
    avatarURL: string;
    customAvatarBackgrounds: Array<string>;
    displayName: string;
    formattedDisplayName: string;
    isVideoDisplayed: boolean;
    userID: string;
    visible: boolean;
}

/**
 * Represents the always on top page.
 *
 * @class AlwaysOnTop
 * @augments Component
 */
export default class AlwaysOnTop extends Component<any, IState> {
    _hovered: boolean;

    /**
     * Initializes a new {@code AlwaysOnTop} instance.
     *
     * @param {*} props - The read-only properties with which the new instance
     * is to be initialized.
     */
    constructor(props: any) {
        super(props);

        this.state = {
            avatarURL: '',
            customAvatarBackgrounds: [],
            displayName: '',
            formattedDisplayName: '',
            isVideoDisplayed: true,
            userID: '',
            visible: true
        };

        // Bind event handlers so they are only bound once per instance.
        this._avatarChangedListener = this._avatarChangedListener.bind(this);
        this._displayNameChangedListener
            = this._displayNameChangedListener.bind(this);
        this._videoChangedListener
            = this._videoChangedListener.bind(this);
        this._mouseMove = this._mouseMove.bind(this);
        this._onMouseOut = this._onMouseOut.bind(this);
        this._onMouseOver = this._onMouseOver.bind(this);
    }

    /**
     * Handles avatar changed api events.
     *
     * @returns {void}
     */
    _avatarChangedListener({ avatarURL, id }: { avatarURL: string; id: string; }) {
        if (api._getOnStageParticipant() === id
                && avatarURL !== this.state.avatarURL) {
            this.setState({ avatarURL });
        }
    }

    /**
     * Handles display name changed api events.
     *
     * @returns {void}
     */
    _displayNameChangedListener({ displayname, formattedDisplayName, id }: { displayname: string;
        formattedDisplayName: string; id: string; }) {
        if (api._getOnStageParticipant() === id
                && (formattedDisplayName !== this.state.formattedDisplayName
                    || displayname !== this.state.displayName)) {
            // I think the API has a typo using lowercase n for the displayname
            this.setState({
                displayName: displayname,
                formattedDisplayName
            });
        }
    }

    /**
     * Hides the toolbar after a timeout.
     *
     * @returns {void}
     */
    _hideToolbarAfterTimeout() {
        setTimeout(
            () => {
                if (this._hovered) {
                    this._hideToolbarAfterTimeout();
                } else {
                    this.setState({ visible: false });
                }
            },
            TOOLBAR_TIMEOUT);
    }

    /**
     * Handles large video changed api events.
     *
     * @returns {void}
     */
    _videoChangedListener() {
        const userID = api._getOnStageParticipant();
        const avatarURL = api.getAvatarURL(userID);
        const displayName = api.getDisplayName(userID);
        const formattedDisplayName = api._getFormattedDisplayName(userID);
        const isVideoDisplayed = Boolean(api._getPrejoinVideo?.() || api._getLargeVideo());

        this.setState({
            avatarURL,
            displayName,
            formattedDisplayName,
            isVideoDisplayed,
            userID
        });
    }

    /**
     * Handles mouse move events.
     *
     * @returns {void}
     */
    _mouseMove() {
        this.state.visible || this.setState({ visible: true });
    }

    /**
     * Toolbar mouse out handler.
     *
     * @returns {void}
     */
    _onMouseOut() {
        this._hovered = false;
    }

    /**
     * Toolbar mouse over handler.
     *
     * @returns {void}
     */
    _onMouseOver() {
        this._hovered = true;
    }

    /**
     * Renders display name and avatar for the on stage participant.
     *
     * @returns {ReactElement}
     */
    _renderVideoNotAvailableScreen() {
        const {
            avatarURL,
            customAvatarBackgrounds,
            displayName,
            formattedDisplayName,
            isVideoDisplayed
        } = this.state;

        if (isVideoDisplayed) {
            return null;
        }

        return (
            <div id = 'videoNotAvailableScreen'>
                <div id = 'avatarContainer'>
                    <StatelessAvatar
                        color = { getAvatarColor(displayName, customAvatarBackgrounds) }
                        iconUser = { DEFAULT_ICON.IconUser }
                        id = 'avatar'
                        initials = { getInitials(displayName) }
                        url = { avatarURL } />)
                </div>
                <div
                    className = 'displayname'
                    id = 'displayname'>
                    { formattedDisplayName }
                </div>
            </div>
        );
    }

    /**
     * Sets mouse move listener and initial toolbar timeout.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        api.on('avatarChanged', this._avatarChangedListener);
        api.on('displayNameChange', this._displayNameChangedListener);
        api.on('largeVideoChanged', this._videoChangedListener);
        api.on('prejoinVideoChanged', this._videoChangedListener);
        api.on('videoConferenceJoined', this._videoChangedListener);

        this._videoChangedListener();

        window.addEventListener('mousemove', this._mouseMove);

        this._hideToolbarAfterTimeout();
        api.getCustomAvatarBackgrounds()
            .then((res: { avatarBackgrounds?: string[]; }) =>
                this.setState({
                    customAvatarBackgrounds: res.avatarBackgrounds || []
                }))
            .catch(console.error);
    }

    /**
     * Sets a timeout to hide the toolbar when the toolbar is shown.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidUpdate(_prevProps: any, prevState: IState) {
        if (!prevState.visible && this.state.visible) {
            this._hideToolbarAfterTimeout();
        }
    }

    /**
     * Removes all listeners.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentWillUnmount() {
        api.removeListener('avatarChanged', this._avatarChangedListener);
        api.removeListener(
            'displayNameChange',
            this._displayNameChangedListener);
        api.removeListener(
            'largeVideoChanged',
            this._videoChangedListener);
        api.removeListener(
            'prejoinVideoChanged',
            this._videoChangedListener);
        api.removeListener(
            'videoConferenceJoined',
            this._videoChangedListener);

        window.removeEventListener('mousemove', this._mouseMove);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <div id = 'alwaysOnTop'>
                <Toolbar
                    className = { this.state.visible ? 'fadeIn' : 'fadeOut' }
                    onMouseOut = { this._onMouseOut }
                    onMouseOver = { this._onMouseOver } />
                { this._renderVideoNotAvailableScreen() }
            </div>
        );
    }
}
