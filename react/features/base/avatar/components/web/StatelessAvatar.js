// @flow

import React from 'react';

import AbstractStatelessAvatar, { type Props as AbstractProps } from '../AbstractStatelessAvatar';

type Props = AbstractProps & {

    /**
     * External class name passed through props.
     */
    className?: string,

    /**
     * The default avatar URL if we want to override the app bundled one (e.g. AlwaysOnTop)
     */
    defaultAvatar?: string,

    /**
     * ID of the component to be rendered.
     */
    id?: string
};

/**
 * Implements a stateless avatar component that renders an avatar purely from what gets passed through
 * props.
 */
export default class StatelessAvatar extends AbstractStatelessAvatar<Props> {
    /**
     * Implements {@code Component#render}.
     *
     * @inheritdoc
     */
    render() {
        const { initials, url } = this.props;

        if (url) {
            return (
                <img
                    className = { this._getAvatarClassName() }
                    id = { this.props.id }
                    onError = { this.props.onAvatarLoadError }
                    src = { url }
                    style = { this._getAvatarStyle() } />
            );
        }

        if (initials) {
            return (
                <div
                    className = { this._getAvatarClassName() }
                    id = { this.props.id }
                    style = { this._getAvatarStyle(this.props.color) }>
                    { initials }
                </div>
            );
        }

        // default avatar
        return (
            <img
                className = { this._getAvatarClassName('defaultAvatar') }
                id = { this.props.id }
                src = { this.props.defaultAvatar || 'images/avatar.png' }
                style = { this._getAvatarStyle() } />
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
            backgroundColor: color || undefined,
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
        return `avatar ${additional || ''} ${this.props.className || ''}`;
    }
}
