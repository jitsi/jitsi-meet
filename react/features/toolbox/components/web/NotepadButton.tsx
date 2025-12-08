import React from 'react';
import { useDispatch } from 'react-redux';
import ToolbarButton from '../../../base/ui/components/web/ToolbarButton';

import { openDialog } from '../../../base/dialog/actions';
import NotepadDialog from './NotepadDialog';

export default function NotepadButton() {
    const dispatch = useDispatch();

    const onClick = () => {
        dispatch(openDialog(NotepadDialog));
    };

    return (
        <ToolbarButton
            accessibilityLabel="Open Notepad"
            icon="icon-more" // replace with a better icon if you have
            label="Notes"
            onClick={onClick} />
    );
}
