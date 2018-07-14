import {
    BoxModel,
    ColorPalette,
    createStyleSheet
} from '../../../base/styles';

export const CALLER_AVATAR_SIZE = 135;

const _text = {
    color: ColorPalette.white,
    margin: BoxModel.margin,
    fontSize: 16
};

const _button = {
    alignSelf: 'center'
};

const _responseButton = {
    ..._button,
    justifyContent: 'center',
    borderRadius: 30,
    borderWidth: 0,
    height: 60,
    width: 60
};

export default createStyleSheet({

    pageContainer: {
        padding: 50,
        flex: 1,
        alignItems: 'center',
        backgroundColor: ColorPalette.blue
    },

    title: {
        ..._text
    },

    callerName: {
        ..._text,
        fontSize: 36
    },

    avatar: {
        marginVertical: 50
    },

    buttonContainer: {
        flex: 1,
        alignSelf: 'stretch',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end'
    },

    buttonText: {
        ..._button,
        ..._text
    },

    buttonIcon: {
        ..._button,
        color: ColorPalette.white,
        fontSize: 24
    },

    declineButton: {
        ..._responseButton,
        backgroundColor: '#FC4D36'
    },

    answerButton: {
        ..._responseButton,
        backgroundColor: '#36A874',
        transform: [
            { rotateZ: '130deg' }
        ]
    }
});
