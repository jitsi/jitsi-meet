// @flow

import { StyleSheet } from 'react-native';

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

    badge: (size: number = DEFAULT_SIZE, status: string) => {
        let color;

        switch (status) {
        case 'available':
            color = 'rgb(110, 176, 5)';
            break;
        case 'away':
            color = 'rgb(250, 201, 20)';
            break;
        case 'busy':
            color = 'rgb(233, 0, 27)';
            break;
        case 'idle':
            color = 'rgb(172, 172, 172)';
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
