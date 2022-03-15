// @flow

import { withStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import React from 'react';

import { Icon } from '../../../icons';
import AbstractStatelessAvatar, { type Props as AbstractProps } from '../AbstractStatelessAvatar';
import { PRESENCE_AVAILABLE_COLOR, PRESENCE_AWAY_COLOR, PRESENCE_BUSY_COLOR, PRESENCE_IDLE_COLOR } from '../styles';

type Props = AbstractProps & {

    /**
     * An object containing the CSS classes.
     */
    classes: Object,

    /**
     * External class name passed through props.
     */
    className?: string,

    /**
     * The default avatar URL if we want to override the app bundled one (e.g. AlwaysOnTop).
     */
    defaultAvatar?: string,

    /**
     * ID of the component to be rendered.
     */
    id?: string,

    /**
     * One of the expected status strings (e.g. 'available') to render a badge on the avatar, if necessary.
     */
    status?: ?string,

    /**
     * TestId of the element, if any.
     */
    testId?: string,

    /**
     * Indicates whether to load the avatar using CORS or not.
     */
    useCORS?: ?boolean
};

/**
 * Creates the styles for the component.
 *
 * @returns {Object}
 */
const styles = () => {
    return {
        avatar: {
            backgroundColor: '#AAA',
            borderRadius: '50%',
            color: 'rgba(255, 255, 255, 1)',
            fontWeight: '100',
            objectFit: 'cover',

            '&.avatar-small': {
                height: '28px !important',
                width: '28px !important'
            },

            '&.avatar-xsmall': {
                height: '16px !important',
                width: '16px !important'
            },

            '& .jitsi-icon': {
                transform: 'translateY(50%)'
            },

            '& .avatar-svg': {
                height: '100%',
                width: '100%'
            }
        },

        badge: {
            position: 'relative',

            '&.avatar-badge:after': {
                borderRadius: '50%',
                content: '""',
                display: 'block',
                height: '35%',
                position: 'absolute',
                bottom: 0,
                width: '35%'
            },

            '&.avatar-badge-available:after': {
                backgroundColor: PRESENCE_AVAILABLE_COLOR
            },

            '&.avatar-badge-away:after': {
                backgroundColor: PRESENCE_AWAY_COLOR
            },

            '&.avatar-badge-busy:after': {
                backgroundColor: PRESENCE_BUSY_COLOR
            },

            '&.avatar-badge-idle:after': {
                backgroundColor: PRESENCE_IDLE_COLOR
            }
        }
    };
};

/**
 * Implements a stateless avatar component that renders an avatar purely from what gets passed through
 * props.
 */
class StatelessAvatar extends AbstractStatelessAvatar<Props> {

    /**
     * Instantiates a new {@code Component}.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._onAvatarLoadError = this._onAvatarLoadError.bind(this);
    }

    /**
     * Implements {@code Component#render}.
     *
     * @inheritdoc
     */
    render() {
        const { initials, url, useCORS } = this.props;

        if (this._isIcon(url)) {
            return (
                <div
                    className = { clsx(this._getAvatarClassName(), this._getBadgeClassName()) }
                    data-testid = { this.props.testId }
                    id = { this.props.id }
                    style = { this._getAvatarStyle(this.props.color) }>
                    <Icon
                        size = '50%'
                        src = { url } />
                </div>
            );
        }

        if (url) {
            return (
                <div className = { this._getBadgeClassName() }>
                    <img
                        alt = 'avatar'
                        className = { this._getAvatarClassName() }
                        crossOrigin = { useCORS ? '' : undefined }
                        data-testid = { this.props.testId }
                        id = { this.props.id }
                        onError = { this._onAvatarLoadError }
                        src = { url }
                        style = { this._getAvatarStyle() } />
                </div>
            );
        }

        if (initials) {
            return (
                <div
                    className = { clsx(this._getAvatarClassName(), this._getBadgeClassName()) }
                    data-testid = { this.props.testId }
                    id = { this.props.id }
                    style = { this._getAvatarStyle(this.props.color) }>
                    <svg
                        className = 'avatar-svg'
                        viewBox = '0 0 100 100'
                        xmlns = 'http://www.w3.org/2000/svg'
                        xmlnsXlink = 'http://www.w3.org/1999/xlink'>
                        <text
                            dominantBaseline = 'central'
                            fill = 'rgba(255,255,255,1)'
                            fontSize = '40pt'
                            textAnchor = 'middle'
                            x = '50'
                            y = '50'>
                            { initials }
                        </text>
                    </svg>
                </div>
            );
        }

        // default avatar
        return (
            <div className = { this._getBadgeClassName() }>
                <img
                    alt = 'avatar'
                    className = { this._getAvatarClassName('defaultAvatar') }
                    data-testid = { this.props.testId }
                    id = { this.props.id }
                    src = { this.props.defaultAvatar || 'images/avatar.png' }
                    style = { this._getAvatarStyle() } />
            </div>
        );
    }

    /**
     * Constructs a style object to be used on the avatars.
     *
     * @param {string?} color - The desired background color.
     * @returns {Object}
     */
    _getAvatarStyle(color) {
        const { size } = this.props;

        return {
            background: color || undefined,
            fontSize: size ? size * 0.5 : '180%',
            height: size || '100%',
            width: size || '100%'
        };
    }

    /**
     * Constructs a list of class names required for the avatar component.
     *
     * @param {string} additional - Any additional class to add.
     * @returns {string}
     */
    _getAvatarClassName(additional) {
        return clsx('avatar', additional, this.props.className, this.props.classes.avatar);
    }

    /**
     * Generates a class name to render a badge on the avatar, if necessary.
     *
     * @returns {string}
     */
    _getBadgeClassName() {
        const { status } = this.props;

        if (status) {
            return clsx('avatar-badge', `avatar-badge-${status}`, this.props.classes.badge);
        }

        return '';
    }

    _isIcon: (?string | ?Object) => boolean;

    _onAvatarLoadError: () => void;

    /**
     * Handles avatar load errors.
     *
     * @returns {void}
     */
    _onAvatarLoadError() {
        const { onAvatarLoadError, onAvatarLoadErrorParams } = this.props;

        if (typeof onAvatarLoadError === 'function') {
            onAvatarLoadError(onAvatarLoadErrorParams);
        }
    }
}

export default withStyles(styles)(StatelessAvatar);
