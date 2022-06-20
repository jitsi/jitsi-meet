import React, { Fragment } from 'react';
import { useSelector } from 'react-redux';


const BottomSheetContainer: () => JSX.Element = () => {
    const { sheet, sheetProps } = useSelector(state => state['features/base/dialog']);
    const { reducedUI } = useSelector(state => state['features/base/responsive-ui']);

    if (!sheet || reducedUI) {
        return null;
    }

    return (
        <Fragment>
            { React.createElement(sheet, sheetProps) }
        </Fragment>
    );
}

export default BottomSheetContainer;
