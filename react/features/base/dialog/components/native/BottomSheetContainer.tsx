import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { FullWindowOverlay } from 'react-native-screens';
import { useSelector } from 'react-redux';

const Wrapper =  Platform.select({
    ios: FullWindowOverlay,
    default: View
});

const BottomSheetContainer: () => JSX.Element = () => {
    const { sheet, sheetProps } = useSelector(state => state['features/base/dialog']);
    const { reducedUI } = useSelector(state => state['features/base/responsive-ui']);

    if (!sheet || reducedUI) {
        return null;
    }

    return (
        <Wrapper style={StyleSheet.absoluteFill}>
            { React.createElement(sheet, sheetProps) }
        </Wrapper>
    );
}

export default BottomSheetContainer;
