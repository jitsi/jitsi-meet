import { ColorPalette, createStyleSheet } from '../../../base/styles';

const BUTTON_SIZE = 56;

const CALLER_AVATAR_BORDER_WIDTH = 3;

export const CALLER_AVATAR_SIZE = 128;

const CALLER_AVATAR_CIRCLE_SIZE
    = CALLER_AVATAR_SIZE + (2 * CALLER_AVATAR_BORDER_WIDTH);

const LINE_SPACING = 8;

const PAGE_PADDING = 48;

const _icon = {
    alignSelf: 'center',
    color: ColorPalette.white,
    fontSize: 32
};

const _responseButton = {
    alignSelf: 'center',
    borderRadius: BUTTON_SIZE / 2,
    borderWidth: 0,
    flex: 0,
    flexDirection: 'row',
    height: BUTTON_SIZE,
    justifyContent: 'center',
    width: BUTTON_SIZE
};

const _text = {
    color: ColorPalette.white,
    fontSize: 16
};

export default createStyleSheet({
    answerButtonStyles: {
        iconStyle: {
            ..._icon,
            transform: [
                { rotateZ: '130deg' }
            ]
        },
        style: {
            ..._responseButton,
            backgroundColor: ColorPalette.green
        },
        underlayColor: ColorPalette.buttonUnderlay
    },

    avatar: {
        marginLeft: CALLER_AVATAR_BORDER_WIDTH,
        marginTop: CALLER_AVATAR_BORDER_WIDTH,
        position: 'absolute'
    },

    avatarBorder: {
        borderRadius: CALLER_AVATAR_CIRCLE_SIZE / 2,
        height: CALLER_AVATAR_CIRCLE_SIZE,
        position: 'absolute',
        width: CALLER_AVATAR_CIRCLE_SIZE
    },

    avatarContainer: {
        height: CALLER_AVATAR_CIRCLE_SIZE,
        marginTop: LINE_SPACING * 4,
        width: CALLER_AVATAR_CIRCLE_SIZE
    },

    backgroundAvatar: {
        bottom: 0,
        left: 0,
        position: 'absolute',
        right: 0,
        top: 0
    },

    backgroundAvatarImage: {
        flex: 1
    },

    buttonsContainer: {
        alignItems: 'flex-end',
        flex: 1,
        flexDirection: 'row'
    },

    buttonText: {
        ..._text,
        alignSelf: 'center',
        marginTop: 1.5 * LINE_SPACING
    },

    buttonWrapper: {
        flex: 1
    },

    callerName: {
        ..._text,
        fontSize: 36,
        marginBottom: LINE_SPACING,
        marginLeft: PAGE_PADDING,
        marginRight: PAGE_PADDING,
        marginTop: LINE_SPACING,
        textAlign: 'center'
    },

    declineButtonStyles: {
        iconStyle: _icon,
        style: {
            ..._responseButton,
            backgroundColor: ColorPalette.red
        },
        underlayColor: ColorPalette.buttonUnderlay
    },

    pageContainer: {
        alignItems: 'center',
        flex: 1,
        paddingBottom: PAGE_PADDING,
        paddingTop: PAGE_PADDING
    },

    productLabel: {
        ..._text
    },

    title: {
        ..._text
    }
});
