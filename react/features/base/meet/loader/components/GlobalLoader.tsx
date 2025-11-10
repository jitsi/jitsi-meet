import React from 'react';
import { connect } from 'react-redux';
import { IReduxState } from '../../../../app/types';
import { translate } from '../../../i18n/functions';

interface IProps {
    isVisible: boolean;
    text?: string;
    textKey?: string;
    t: Function;
}

const GlobalLoader: React.FC<IProps> = ({ isVisible, text, textKey, t }) => {
    if (!isVisible) {
        return null;
    }

    const displayText = textKey ? t(textKey) : text;

    return (
        <div
            role="status"
            aria-live="polite"
            className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-black/60"
        >
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-white" />
            {displayText && (
                <div className="mt-5 max-w-[80%] text-center text-base font-medium text-white">
                    {displayText}
                </div>
            )}
        </div>
    );
};

const mapStateToProps = (state: IReduxState) => {
    const loaderState = state['features/base/meet/loader'];

    return {
        isVisible: loaderState?.isVisible || false,
        text: loaderState?.text,
        textKey: loaderState?.textKey,
    };
};

export default translate(connect(mapStateToProps)(GlobalLoader));
