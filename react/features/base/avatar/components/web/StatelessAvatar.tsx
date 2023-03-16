import { Theme } from '@mui/material';
import { withStyles } from '@mui/styles';
import clsx from 'clsx';
import React from 'react';

import Icon from '../../../icons/components/Icon';
import { IconUser } from '../../../icons/svg';
import { withPixelLineHeight } from '../../../styles/functions.web';
import AbstractStatelessAvatar, { type IProps as AbstractProps } from '../AbstractStatelessAvatar';
import { PRESENCE_AVAILABLE_COLOR, PRESENCE_AWAY_COLOR, PRESENCE_BUSY_COLOR, PRESENCE_IDLE_COLOR } from '../styles';

interface IProps extends AbstractProps {

    /**
     * External class name passed through props.
     */
    className?: string;

    /**
     * An object containing the CSS classes.
     */
    classes: any;

    /**
     * The default avatar URL if we want to override the app bundled one (e.g. AlwaysOnTop).
     */
    defaultAvatar?: string;

    /**
     * ID of the component to be rendered.
     */
    id?: string;

    /**
     * One of the expected status strings (e.g. 'available') to render a badge on the avatar, if necessary.
     */
    status?: string;

    /**
     * TestId of the element, if any.
     */
    testId?: string;

    /**
     * Indicates whether to load the avatar using CORS or not.
     */
    useCORS?: boolean;
}

/**
 * Creates the styles for the component.
 *
 * @param {Theme} theme - The MUI theme.
 * @returns {Object}
 */
const styles = (theme: Theme) => {
    return {
        avatar: {
            backgroundColor: '#AAA',
            borderRadius: '50%',
            fontWeight: '600',
            color: theme.palette?.text01 || '#fff',
            ...withPixelLineHeight(theme.typography?.heading1 ?? {}),
            fontSize: 'inherit',
            objectFit: 'cover' as const,
            textAlign: 'center' as const,
            overflow: 'hidden',

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

        initialsContainer: {
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
        },

        badge: {
            position: 'relative' as const,

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
class StatelessAvatar extends AbstractStatelessAvatar<IProps> {

    /**
     * Instantiates a new {@code Component}.
     *
     * @inheritdoc
     */
    constructor(props: IProps) {
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
                    <div className = { this.props.classes.initialsContainer }>
                        {initials}
                    </div>
                </div>
            );
        }

        // default avatar
        return (
            <div
                className = { clsx(this._getAvatarClassName('defaultAvatar'), this._getBadgeClassName()) }
                data-testid = { this.props.testId }
                id = { this.props.id }
                style = { this._getAvatarStyle() }>
                <Icon
                    size = { '50%' }
                    src = { IconUser } />
            </div>
        );
    }

    /**
     * Constructs a style object to be used on the avatars.
     *
     * @param {string} color - The desired background color.
     * @returns {Object}
     */
    _getAvatarStyle(color?: string) {
        const { size } = this.props;

        return {
            background: color || undefined,
            fontSize: size ? size * 0.4 : '180%',
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
    _getAvatarClassName(additional?: string) {
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
