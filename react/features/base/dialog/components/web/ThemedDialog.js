// @flow

import {
    Dialog,
    FillScreen,
    dialogWidth,
    dialogHeight,
    PositionerAbsolute,
    PositionerRelative
} from '@atlaskit/modal-dialog/dist/es2019/styled/Modal.js';
import { N0, DN50 } from '@atlaskit/theme/colors';
import { themed } from '@atlaskit/theme/components';
import React from 'react';

type Props = {
    isChromeless: boolean
}

const ThemedDialog = (props: Props) => {
    const style = { backgroundColor: props.isChromeless ? 'transparent' : themed({ light: N0,
        dark: DN50 })({ theme: { mode: 'dark' } }) };

    return (<Dialog
        { ...props }
        aria-modal = { true }
        style = { style }
        theme = {{ mode: 'dark' }} />);
};


export { ThemedDialog as Dialog, FillScreen, dialogWidth, dialogHeight, PositionerAbsolute, PositionerRelative };
