// @flow

import React from 'react';

import { connect } from '../../../redux';

import AbstractAvatar, {
    _mapStateToProps,
    type Props as AbstractProps
} from '../AbstractAvatar';

type Props = AbstractProps & {
    className?: string,
    id: string
};

/**
 * Implements an avatar as a React/Web {@link Component}.
 */
class Avatar extends AbstractAvatar<Props> {
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

    _onAvatarLoadError: () => void;

    /**
     * Implements {@code AbstractAvatar#_renderDefaultAvatar}.
     *
     * @inheritdoc
     */
    _renderDefaultAvatar() {
        return (
            <img
                className = { this._getAvatarClassName('defaultAvatar') }
                id = { this.props.id }
                src = 'images/avatar.png'
                style = { this._getAvatarStyle() } />
        );
    }

    /**
     * Implements {@code AbstractAvatar#_renderGravatar}.
     *
     * @inheritdoc
     */
    _renderInitialsAvatar(initials, color) {
        return (
            <div
                className = { this._getAvatarClassName() }
                id = { this.props.id }
                style = { this._getAvatarStyle(color) }>
                { initials }
            </div>
        );
    }

    /**
     * Implements {@code AbstractAvatar#_renderGravatar}.
     *
     * @inheritdoc
     */
    _renderURLAvatar(uri) {
        return (
            <img
                className = { this._getAvatarClassName() }
                id = { this.props.id }
                onError = { this._onAvatarLoadError }
                src = { uri }
                style = { this._getAvatarStyle() } />
        );
    }
}

export default connect(_mapStateToProps)(Avatar);
