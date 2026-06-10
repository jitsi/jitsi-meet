import React from 'react';

import PiPControls from './controls/PiPControls';
import CompactLayout from './layouts/CompactLayout';

/**
 * Root component for Document PiP content.
 * Renders the appropriate layout based on Redux state.
 *
 * @returns The Document PiP view element.
 */
const DocumentPiPView: React.FC = () => {

    const renderLayout = () => {
        // TODO: add switch case for adding more layouts in future
        return <CompactLayout />;
    };

    return (
        <div className = 'doc-pip-container'>
            <div className = 'doc-pip-video-area'>
                <div className = 'doc-pip-videos-container'>
                    {renderLayout()}
                </div>
            </div>
            <PiPControls />
        </div>
    );
};

export default DocumentPiPView;
