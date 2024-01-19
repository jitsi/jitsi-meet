import React, { useCallback } from 'react';
import { makeStyles } from 'tss-react/mui';

import Icon from '../../../icons/components/Icon';
import { withPixelLineHeight } from '../../../styles/functions.web';
import { isIcon } from '../../functions';
import { IAvatarProps } from '../../types';
import { PRESENCE_AVAILABLE_COLOR, PRESENCE_AWAY_COLOR, PRESENCE_BUSY_COLOR, PRESENCE_IDLE_COLOR } from '../styles';

interface IProps extends IAvatarProps {

    /**
     * External class name passed through props.
     */
    className?: string;

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
     * The URL of the avatar to render.
     */
    url?: string | Function;

    /**
     * Indicates whether to load the avatar using CORS or not.
     */
    useCORS?: boolean;
}

const useStyles = makeStyles()(theme => {
    return {
        avatar: {
            backgroundColor: '#AAA',
            borderRadius: '50%',
            fontWeight: '600',
            color: theme.palette?.text01 || '#fff',
            ...withPixelLineHeight(theme.typography?.heading1 ?? {}),
            fontSize: 'inherit',
            objectFit: 'cover',
            textAlign: 'center',
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
});

const StatelessAvatar = ({
    className,
    color,
    iconUser,
    id,
    initials,
    onAvatarLoadError,
    onAvatarLoadErrorParams,
    size,
    status,
    testId,
    url,
    useCORS
}: IProps) => {
    const { classes, cx } = useStyles();

    const _getAvatarStyle = (backgroundColor?: string) => {
        return {
            background: backgroundColor || undefined,
            fontSize: size ? size * 0.4 : '180%',
            height: size || '100%',
            width: size || '100%'
        };
    };

    const _getAvatarClassName = (additional?: string) => cx('avatar', additional, className, classes.avatar);

    const _getBadgeClassName = () => {
        if (status) {
            return cx('avatar-badge', `avatar-badge-${status}`, classes.badge);
        }

        return '';
    };

    const _onAvatarLoadError = useCallback(() => {
        if (typeof onAvatarLoadError === 'function') {
            onAvatarLoadError(onAvatarLoadErrorParams);
        }
    }, [ onAvatarLoadError, onAvatarLoadErrorParams ]);

    if (isIcon(url)) {
        return (
            <div
                className = { cx(_getAvatarClassName(), _getBadgeClassName()) }
                data-testid = { testId }
                id = { id }
                style = { _getAvatarStyle(color) }>
                <Icon
                    size = '50%'
                    src = { url } />
            </div>
        );
    }

    if (url) {
        return (
            <div className = { _getBadgeClassName() }>
                <img
                    alt = 'avatar'
                    className = { _getAvatarClassName() }
                    crossOrigin = { useCORS ? '' : undefined }
                    data-testid = { testId }
                    id = { id }
                    onError = { _onAvatarLoadError }
                    src = { url }
                    style = { _getAvatarStyle() } />
            </div>
        );
    }

    if (initials) {
        return (
            <div
                className = { cx(_getAvatarClassName(), _getBadgeClassName()) }
                data-testid = { testId }
                id = { id }
                style = { _getAvatarStyle(color) }>
                <div className = { classes.initialsContainer }>
                    {initials}
                </div>
            </div>
        );
    }

    // default avatar
    return (
        <div
            className = { cx(_getAvatarClassName('defaultAvatar'), _getBadgeClassName()) }
            data-testid = { testId }
            id = { id }
            style = { _getAvatarStyle() }>
            <Icon
                size = { '50%' }
                src = { iconUser } />
        </div>
    );
};


export default StatelessAvatar;
