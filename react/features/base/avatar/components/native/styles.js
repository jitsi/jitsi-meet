// @flow

import { ColorPalette } from '../../../styles';

const DEFAULT_SIZE = 65;

/**
 * The styles of the feature base/participants.
 */
export default {

    avatarContainer: (size: number = DEFAULT_SIZE) => {
        return {
            alignItems: 'center',
            borderRadius: size / 2,
            height: size,
            justifyContent: 'center',
            overflow: 'hidden',
            width: size
        };
    },

    avatarContent: (size: number = DEFAULT_SIZE) => {
        return {
            height: size,
            width: size
        };
    },

    initialsContainer: {
        alignItems: 'center',
        alignSelf: 'stretch',
        flex: 1,
        justifyContent: 'center'
    },

    initialsText: (size: number = DEFAULT_SIZE) => {
        return {
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: size * 0.5,
            fontWeight: '100'
        };
    },

    staticAvatar: {
        backgroundColor: ColorPalette.lightGrey,
        opacity: 0.4
    }
};
