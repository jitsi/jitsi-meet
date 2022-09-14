import React, { Fragment } from 'react';
import { useSelector } from 'react-redux';

import { IState } from '../../../../app/types';


const BottomSheetContainer: () => JSX.Element | null = (): JSX.Element | null => {
    const { sheet, sheetProps } = useSelector((state: IState) => state['features/base/dialog']);
    const { reducedUI } = useSelector((state: IState) => state['features/base/responsive-ui']);

    if (!sheet || reducedUI) {
        return null;
    }

    return (
        <Fragment>
            { React.createElement(sheet, sheetProps) }
        </Fragment>
    );
};

export default BottomSheetContainer;
