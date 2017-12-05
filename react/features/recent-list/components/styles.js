import { StyleSheet } from 'react-native';
import {
    createStyleSheet
} from '../../base/styles';

const AVATAR_SIZE = 60;

export const UNDERLAY_COLOR = 'rgba(255, 255, 255, 0.2)';

/**
 * The styles of the React {@code Components} of the feature: recent list
 * {@code RecentList}.
 */
export default createStyleSheet({

    /**
    * This is the top level container style of the list
    */
    container: {
        flex: 1
    },

    /**
    * The style of one single row in the list
    */
    row: {
        padding: 14,
        flex: 1
    },

    /**
    * Row separator style for the built-on separator support
    * of the {@code ListView}
    */
    separator: {
        flex: 1,
        height: StyleSheet.hairlineWidth,
        backgroundColor: '#303030'
    },

    /**
    * The style of the avatar container that makes the avatar rounded.
    */
    avatarContainer: {
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        flex: 1,
        alignItems: 'center',
        backgroundColor: 'rgba(23, 160, 219, 0.2)',
        alignSelf: 'stretch',
        justifyContent: 'center',
        position: 'absolute',
        top: 7,
        left: 7,
        right: 0,
        bottom: 0,
        borderRadius: AVATAR_SIZE
    },

    /**
    * Simple {@code Text} content of the avatar (the actual initials)
    */
    avatarContent: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: 32,
        fontWeight: '100',
        backgroundColor: 'rgba(0, 0, 0, 0)',
        textAlign: 'center'
    },

    /**
    * First line of the list (room name)
    */
    roomName: {
        position: 'relative',
        left: AVATAR_SIZE,
        fontSize: 18,
        fontWeight: 'bold',
        color: 'rgba(255, 255, 255, 0.6)'
    },

    /**
    * Second line of the list (date).
    * May be extended with server name later.
    */
    date: {
        position: 'relative',
        left: AVATAR_SIZE,
        color: 'rgba(255, 255, 255, 0.6)'
    }

});
