// @flow

import { PureComponent } from 'react';

import { getParticipantById } from '../../participants';

import { getAvatarColor, getInitials } from '../functions';

export type Props = {

    /**
     * The string we base the initials on (this is generated from a list of precendences).
     */
    _initialsBase: ?string,

    /**
     * An URL that we validated that it can be loaded.
     */
    _loadableAvatarUrl: ?string,

    /**
     * A string to override the initials to generate a color of. This is handy if you don't want to make
     * the background color match the string that the initials are generated from.
     */
    colorBase?: string,

    /**
     * Display name of the entity to render an avatar for (if any). This is handy when we need
     * an avatar for a non-participasnt entity (e.g. a recent list item).
     */
    displayName?: string,

    /**
     * The ID of the participant to render an avatar for (if it's a participant avatar).
     */
    participantId?: string,

    /**
     * The size of the avatar.
     */
    size: number,

    /**
     * URI of the avatar, if any.
     */
    uri: ?string,
}

type State = {
    avatarFailed: boolean
}

export const DEFAULT_SIZE = 65;

/**
 * Implements an abstract class to render avatars in the app.
 */
export default class AbstractAvatar<P: Props> extends PureComponent<P, State> {
    /**
     * Instantiates a new {@code Component}.
     *
     * @inheritdoc
     */
    constructor(props: P) {
        super(props);

        this.state = {
            avatarFailed: false
        };

        this._onAvatarLoadError = this._onAvatarLoadError.bind(this);
    }

    /**
     * Implements {@code Component#componentDidUpdate}.
     *
     * @inheritdoc
     */
    componentDidUpdate(prevProps: P) {
        if (prevProps.uri !== this.props.uri) {

            // URI changed, so we need to try to fetch it again.
            // Eslint doesn't like this statement, but based on the React doc, it's safe if it's
            // wrapped in a condition: https://reactjs.org/docs/react-component.html#componentdidupdate

            // eslint-disable-next-line react/no-did-update-set-state
            this.setState({
                avatarFailed: false
            });
        }
    }

    /**
     * Implements {@code Componenr#render}.
     *
     * @inheritdoc
     */
    render() {
        const {
            _initialsBase,
            _loadableAvatarUrl,
            colorBase,
            uri
        } = this.props;
        const { avatarFailed } = this.state;

        // _loadableAvatarUrl is validated that it can be loaded, but uri (if present) is not, so
        // we still need to do a check for that. And an explicitly provided URI is higher priority than
        // an avatar URL anyhow.
        if ((uri && !avatarFailed) || _loadableAvatarUrl) {
            return this._renderURLAvatar((!avatarFailed && uri) || _loadableAvatarUrl);
        }

        const _initials = getInitials(_initialsBase);

        if (_initials) {
            return this._renderInitialsAvatar(_initials, getAvatarColor(colorBase || _initialsBase));
        }

        return this._renderDefaultAvatar();
    }

    _onAvatarLoadError: () => void;

    /**
     * Callback to handle the error while loading of the avatar URI.
     *
     * @returns {void}
     */
    _onAvatarLoadError() {
        this.setState({
            avatarFailed: true
        });
    }

    /**
     * Function to render the actual, platform specific default avatar component.
     *
     * @returns {React$Element<*>}
     */
    _renderDefaultAvatar: () => React$Element<*>

    /**
     * Function to render the actual, platform specific initials-based avatar component.
     *
     * @param {string} initials - The initials to use.
     * @param {string} color - The color to use.
     * @returns {React$Element<*>}
     */
    _renderInitialsAvatar: (string, string) => React$Element<*>

    /**
     * Function to render the actual, platform specific URL-based avatar component.
     *
     * @param {string} uri - The URI of the avatar.
     * @returns {React$Element<*>}
     */
    _renderURLAvatar: ?string => React$Element<*>
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @param {Props} ownProps - The own props of the component.
 * @returns {Props}
 */
export function _mapStateToProps(state: Object, ownProps: Props) {
    const { displayName, participantId } = ownProps;
    const _participant = participantId && getParticipantById(state, participantId);
    const _initialsBase = (_participant && (_participant.name || _participant.email)) || displayName;

    return {
        _initialsBase,
        _loadableAvatarUrl: _participant && _participant.loadableAvatarUrl
    };
}
