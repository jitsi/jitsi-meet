// @flow

import React, { PureComponent } from 'react';

import { getParticipantById } from '../../participants';
import { connect } from '../../redux';
import { getAvatarColor, getInitials } from '../functions';

import { StatelessAvatar } from '.';

export type Props = {

    /**
     * Custom avatar backgrounds from branding.
     */
    _customAvatarBackgrounds: Array<string>,

    /**
     * The string we base the initials on (this is generated from a list of precedences).
     */
    _initialsBase: ?string,

    /**
     * An URL that we validated that it can be loaded.
     */
    _loadableAvatarUrl: ?string,

    /**
     * A prop to maintain compatibility with web.
     */
    className?: string,

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
     * Whether or not to update the background color of the avatar
     */
    dynamicColor?: Boolean,

    /**
     * ID of the element, if any.
     */
    id?: string,

    /**
     * The ID of the participant to render an avatar for (if it's a participant avatar).
     */
    participantId?: string,

    /**
     * The size of the avatar.
     */
    size: number,

    /**
     * One of the expected status strings (e.g. 'available') to render a badge on the avatar, if necessary.
     */
    status?: ?string,

    /**
     * TestId of the element, if any.
     */
    testId?: string,

    /**
     * URL of the avatar, if any.
     */
    url: ?string,
}

type State = {
    avatarFailed: boolean
}

export const DEFAULT_SIZE = 65;

/**
 * Implements a class to render avatars in the app.
 */
class Avatar<P: Props> extends PureComponent<P, State> {
    /**
     * Default values for {@code Avatar} component's properties.
     *
     * @static
     */
    static defaultProps = {
        dynamicColor: true
    };

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
        if (prevProps.url !== this.props.url) {

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
            _customAvatarBackgrounds,
            _initialsBase,
            _loadableAvatarUrl,
            className,
            colorBase,
            dynamicColor,
            id,
            size,
            status,
            testId,
            url
        } = this.props;
        const { avatarFailed } = this.state;

        const avatarProps = {
            className,
            color: undefined,
            id,
            initials: undefined,
            onAvatarLoadError: undefined,
            size,
            status,
            testId,
            url: undefined
        };

        // _loadableAvatarUrl is validated that it can be loaded, but uri (if present) is not, so
        // we still need to do a check for that. And an explicitly provided URI is higher priority than
        // an avatar URL anyhow.
        const effectiveURL = (!avatarFailed && url) || _loadableAvatarUrl;

        if (effectiveURL) {
            avatarProps.onAvatarLoadError = this._onAvatarLoadError;
            avatarProps.url = effectiveURL;
        }

        const initials = getInitials(_initialsBase);

        if (initials) {
            if (dynamicColor) {
                avatarProps.color = getAvatarColor(colorBase || _initialsBase, _customAvatarBackgrounds);
            }

            avatarProps.initials = initials;
        }

        return (
            <StatelessAvatar
                { ...avatarProps } />
        );
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
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @param {Props} ownProps - The own props of the component.
 * @returns {Props}
 */
export function _mapStateToProps(state: Object, ownProps: Props) {
    const { colorBase, displayName, participantId } = ownProps;
    const _participant: ?Object = participantId && getParticipantById(state, participantId);
    const _initialsBase = _participant?.name ?? displayName;

    return {
        _customAvatarBackgrounds: state['features/dynamic-branding'].avatarBackgrounds,
        _initialsBase,
        _loadableAvatarUrl: _participant?.loadableAvatarUrl,
        colorBase
    };
}

export default connect(_mapStateToProps)(Avatar);
