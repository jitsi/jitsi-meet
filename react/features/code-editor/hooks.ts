import { useSelector } from 'react-redux';

import CodeEditorButton from './components/web/CodeEditorButton';
import { isCodeEditorButtonVisible } from './functions';

const codeEditor = {
    key: 'codeEditor',
    Content: CodeEditorButton,
    group: 3
};

/**
 * A hook that returns the code editor button if the feature is enabled, and
 * undefined otherwise.
 *
 * @returns {Object | undefined}
 */
export function useCodeEditorButton() {
    const _visible = useSelector(isCodeEditorButtonVisible);

    if (_visible) {
        return codeEditor;
    }
}
