import React from 'react';
import AKButton from '@atlaskit/button';

/**
 * Inline dialog failure.
 *
 * @param {Object} props - The properties for the inline dialog.
 * @returns {XML}
 */
function InlineDialogFailure(props) {
    return (
        <div className = 'inline-dialog-error'>
            <div className = 'inline-dialog-error-text'>
                { 'Neshto failna Part 1' }
            </div>
            <div className = 'inline-dialog-error-text'>
                <span>{'Neshto failna part 2'}</span>
                <span>
                    <a
                        href = { '#supportLink' }
                        target = '_blank'>
                        { 'Neshto failna part 3' }
                    </a>
                </span>
                <span>{ 'Neshto failna part 4' }</span>
            </div>
            <AKButton
                className = 'inline-dialog-error-button'
                onClick = { props.retry } >
                { 'Retry' }
            </AKButton>
        </div>
    );
}

export default InlineDialogFailure;
