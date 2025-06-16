import { StyleSheet } from 'react-native';

import { ColorPalette } from '../../../styles/components/styles/ColorPalette';
import { PRESENCE_AVAILABLE_COLOR, PRESENCE_AWAY_COLOR, PRESENCE_BUSY_COLOR, PRESENCE_IDLE_COLOR } from '../styles';

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

    badge: (size: number = DEFAULT_SIZE, status: string) => {
        let color;

        switch (status) {
        case 'available':
            color = PRESENCE_AVAILABLE_COLOR;
            break;
        case 'away':
            color = PRESENCE_AWAY_COLOR;
            break;
        case 'busy':
            color = PRESENCE_BUSY_COLOR;
            break;
        case 'idle':
            color = PRESENCE_IDLE_COLOR;
            break;
        }

        return {
            backgroundColor: color,
            borderRadius: size / 2,
            bottom: 0,
            height: size * 0.3,
            position: 'absolute',
            width: size * 0.3
        };
    },

    badgeContainer: {
        ...StyleSheet.absoluteFillObject
    },

    initialsContainer: {
        alignItems: 'center',
        alignSelf: 'stretch',
        flex: 1,
        justifyContent: 'center'
    },

    initialsText: (size: number = DEFAULT_SIZE) => {
        return {
            color: 'white',
            fontSize: size * 0.45,
            fontWeight: '100'
        };
    },

    staticAvatar: {
        backgroundColor: ColorPalette.lightGrey,
        opacity: 0.4
    }
};
