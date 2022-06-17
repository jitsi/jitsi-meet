import React from 'react';
import { StyleSheet } from 'react-native';
import { FullWindowOverlay } from 'react-native-screens';
import { useSelector } from 'react-redux';


const BottomSheetContainer: () => JSX.Element = () => {
    const { sheet, sheetProps } = useSelector(state => state['features/base/dialog']);
    const { reducedUI } = useSelector(state => state['features/base/responsive-ui']);

    if (!sheet || reducedUI) {
        return null;
    }

    return (
        <FullWindowOverlay style={StyleSheet.absoluteFill}>
            { React.createElement(sheet, sheetProps) }
        </FullWindowOverlay>
    );
}

export default BottomSheetContainer;
