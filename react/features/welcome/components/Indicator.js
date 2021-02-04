// @flow
/* eslint-disable react-native/no-inline-styles */
import _ from 'lodash';
import React from 'react';
import { View } from 'react-native';
import { ColorPalette } from '../../base/styles/components/styles';
import { calcPixelByWidthRatio, calcFontSize } from '../../base/styles';

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
        width: calcFontSize(11),
        height: calcFontSize(11),
        backgroundColor: ColorPalette.jane,
        marginRight: calcPixelByWidthRatio(7),
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
