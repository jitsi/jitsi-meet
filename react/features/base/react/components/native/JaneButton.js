// @flow

import React from 'react';
import { TouchableOpacity } from 'react-native';

import { sizeHelper, JaneWeb } from '../../../styles';

import { FixedScaleText } from './index';

type Props = {
    content: React$Node,
    borderColor: string,
    textColor: string,
    marginBottom?: number,
    size?: number,
    onPress: Function
};

const styles = {
    buttonStyle: {
        borderRadius: 6,
        borderWidth: 1,
        width: '100%',
        height: sizeHelper.getActualSizeH(51),
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        maxWidth: sizeHelper.getActualSizeW(337)
    },
    textStyle: {
        ...JaneWeb.boldFont,
        fontSize: sizeHelper.getActualSizeH(18)
    }
};

const JaneButton = (props: Props) => (<TouchableOpacity
    onPress = { props.onPress }
    style = {{ ...styles.buttonStyle,
        borderColor: props.borderColor,
        marginBottom: sizeHelper.getActualSizeH(props.marginBottom)
    }}>
    <FixedScaleText
        style = {{ ...styles.textStyle,
            color: props.textColor,
            fontSize: props.size || sizeHelper.getActualSizeH(18) }}>
        {props.content}
    </FixedScaleText>
</TouchableOpacity>);

export default JaneButton;
