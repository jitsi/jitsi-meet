// @flow
/* eslint-disable react-native/no-inline-styles */
import _ from 'lodash';
import React from 'react';
import { View } from 'react-native';
import { ColorPalette } from '../../base/styles/components/styles';
import { sizeHelper } from '../../base/styles';

type Props = {
    count: number,
    currentIndex: number,
};

const styles = {
    indicatorContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        width: '100%'
    },
    indicator: {
        width: sizeHelper.getActualFontSize(11),
        height: sizeHelper.getActualFontSize(11),
        backgroundColor: ColorPalette.jane,
        marginRight: sizeHelper.getActualSizeW(7),
        borderRadius: 40
    }
};

export const Indicator = (props: Props) => {
    if (!props.count) {
        return null;
    }

    return (<View
        style = { styles.indicatorContainer }>
        {
            _.times(props.count, index => (<View
                key = { index }
                style = {{
                    ...styles.indicator,
                    opacity: index === props.currentIndex ? 1 : 0.28
                }} />))
        }
    </View>);
};
