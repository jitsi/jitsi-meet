import React, { PureComponent } from 'react';
import { connect } from 'react-redux';

import { IReduxState } from '../../../app/types';
import { IconUser } from '../../icons/svg';
import { getParticipantById } from '../../participants/functions';
import { IParticipant } from '../../participants/types';
import { getAvatarColor, getInitials, isCORSAvatarURL } from '../functions';
import { IAvatarProps as AbstractProps } from '../types';

import { StatelessAvatar } from './';

export interface IProps {

    /**
     * The URL patterns for URLs that needs to be handled with CORS.
     */
    _corsAvatarURLs?: Array<string>;

    /**
     * Custom avatar backgrounds from branding.
     */
    _customAvatarBackgrounds?: Array<string>;

    /**
     * The string we base the initials on (this is generated from a list of precedences).
     */
    _initialsBase?: string;

    /**
     * An URL that we validated that it can be loaded.
     */
    _loadableAvatarUrl?: string;

    /**
     * Indicates whether _loadableAvatarUrl should use CORS or not.
     */
    _loadableAvatarUrlUseCORS?: boolean;

    /**
     * A prop to maintain compatibility with web.
     */
    className?: string;

    /**
     * A string to override the initials to generate a color of. This is handy if you don't want to make
     * the background color match the string that the initials are generated from.
     */
    colorBase?: string;

    /**
     * Display name of the entity to render an avatar for (if any). This is handy when we need
     * an avatar for a non-participant entity (e.g. A recent list item).
     */
    displayName?: string;

    /**
     * Whether or not to update the background color of the avatar.
     */
    dynamicColor?: boolean;

    /**
     * ID of the element, if any.
     */
    id?: string;

    /**
     * The ID of the participant to render an avatar for (if it's a participant avatar).
     */
    participantId?: string;

    /**
     * The size of the avatar.
     */
    size?: number;

    /**
     * One of the expected status strings (e.g. 'available') to render a badge on the avatar, if necessary.
     */
    status?: string;

    /**
     * TestId of the element, if any.
     */
    testId?: string;

    /**
     * URL of the avatar, if any.
     */
    url?: string;

    /**
     * Indicates whether to load the avatar using CORS or not.
     */
    useCORS?: boolean;
}

interface IState {
    avatarFailed: boolean;
    isUsingCORS: boolean;
}

export const DEFAULT_SIZE = 65;

/**
 * Implements a class to render avatars in the app.
 */
class Avatar<P extends IProps> extends PureComponent<P, IState> {
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

        const {
            _corsAvatarURLs,
            url,
            useCORS
        } = props;

        this.state = {
            avatarFailed: false,
            isUsingCORS: Boolean(useCORS) || Boolean(url && isCORSAvatarURL(url, _corsAvatarURLs))
        };

        this._onAvatarLoadError = this._onAvatarLoadError.bind(this);
    }

    /**
     * Implements {@code Component#componentDidUpdate}.
     *
     * @inheritdoc
     */
    componentDidUpdate(prevProps: P) {
        const { _corsAvatarURLs, url } = this.props;

        if (prevProps.url !== url) {

            // URI changed, so we need to try to fetch it again.
            // Eslint doesn't like this statement, but based on the React doc, it's safe if it's
            // wrapped in a condition: https://reactjs.org/docs/react-component.html#componentdidupdate

            // eslint-disable-next-line react/no-did-update-set-state
            this.setState({
                avatarFailed: false,
                isUsingCORS: Boolean(this.props.useCORS) || Boolean(url && isCORSAvatarURL(url, _corsAvatarURLs))
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
            _loadableAvatarUrlUseCORS,
            className,
            colorBase,
            dynamicColor,
            id,
            size,
            status,
            testId,
            url
        } = this.props;
        const { avatarFailed, isUsingCORS } = this.state;

        const avatarProps: AbstractProps & {
            className?: string;
            iconUser?: any;
            id?: string;
            status?: string;
            testId?: string;
            url?: string;
            useCORS?: boolean;
        } = {
            className,
            color: undefined,
            id,
            initials: undefined,
            onAvatarLoadError: undefined,
            onAvatarLoadErrorParams: undefined,
            size,
            status,
            testId,
            url: undefined,
            useCORS: isUsingCORS
        };

        // _loadableAvatarUrl is validated that it can be loaded, but uri (if present) is not, so
        // we still need to do a check for that. And an explicitly provided URI is higher priority than
        // an avatar URL anyhow.
        const useReduxLoadableAvatarURL = avatarFailed || !url;
        const effectiveURL = useReduxLoadableAvatarURL ? _loadableAvatarUrl : url;

        if (effectiveURL) {
            avatarProps.onAvatarLoadError = this._onAvatarLoadError;
            if (useReduxLoadableAvatarURL) {
                avatarProps.onAvatarLoadErrorParams = { dontRetry: true };
                avatarProps.useCORS = _loadableAvatarUrlUseCORS;
            }
            avatarProps.url = effectiveURL;
        }

        const initials = getInitials(_initialsBase);

        if (initials) {
            if (dynamicColor) {
                avatarProps.color = getAvatarColor(colorBase || _initialsBase, _customAvatarBackgrounds ?? []);
            }

            avatarProps.initials = initials;
        }

        if (navigator.product !== 'ReactNative') {
            avatarProps.iconUser = IconUser;
        }

        return (
            <StatelessAvatar
                { ...avatarProps } />
        );
    }

    /**
     * Callback to handle the error while loading of the avatar URI.
     *
     * @param {Object} params - An object with parameters.
     * @param {boolean} params.dontRetry - If false we will retry to load the Avatar with different CORS mode.
     * @returns {void}
     */
    _onAvatarLoadError(params: { dontRetry?: boolean; } = {}) {
        const { dontRetry = false } = params;

        if (Boolean(this.props.useCORS) === this.state.isUsingCORS && !dontRetry) {
            // try different mode of loading the avatar.
            this.setState({
                isUsingCORS: !this.state.isUsingCORS
            });
        } else {
            // we already have tried loading the avatar with and without CORS and it failed.
            this.setState({
                avatarFailed: true
            });
        }
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @param {IProps} ownProps - The own props of the component.
 * @returns {IProps}
 */
export function _mapStateToProps(state: IReduxState, ownProps: IProps) {
    const { colorBase, displayName, participantId } = ownProps;
    const _participant: IParticipant | undefined = participantId ? getParticipantById(state, participantId) : undefined;
    const _initialsBase = _participant?.name ?? displayName;
    const { corsAvatarURLs } = state['features/base/config'];

    return {
        _customAvatarBackgrounds: state['features/dynamic-branding'].avatarBackgrounds,
        _corsAvatarURLs: corsAvatarURLs,
        _initialsBase,
        _loadableAvatarUrl: _participant?.loadableAvatarUrl,
        _loadableAvatarUrlUseCORS: _participant?.loadableAvatarUrlUseCORS,
        colorBase
    };
}

export default connect(_mapStateToProps)(Avatar);
