import React, { Component } from 'react';
import { WithTranslation } from 'react-i18next';

import { translate } from '../../base/i18n/functions';
import Platform from '../../base/react/Platform.web';
import Checkbox from '../../base/ui/components/web/Checkbox';
import Spinner from '../../base/ui/components/web/Spinner';

import DesktopSourcePreview from './DesktopSourcePreview';

/**
 * The type of the React {@code Component} props of {@link DesktopPickerPane}.
 */
interface IProps extends WithTranslation {

    /**
     * The handler to be invoked when a DesktopSourcePreview is clicked.
     */
    onClick: Function;

    /**
     * The handler to be invoked when a DesktopSourcePreview is double clicked.
     */
    onDoubleClick: Function;

    /**
     * The handler to be invoked if the users checks the audio screen sharing checkbox.
     */
    onShareAudioChecked: Function;

    /**
     * The id of the DesktopCapturerSource that is currently selected.
     */
    selectedSourceId: string;

    /**
     * An array of DesktopCapturerSources.
     */
    sources: Array<any>;

    /**
     * The source type of the DesktopCapturerSources to display.
     */
    type: string;
}

/**
 * React component for showing a grid of DesktopSourcePreviews.
 *
 * @augments Component
 */
class DesktopPickerPane extends Component<IProps> {

    /**
     * Initializes a new DesktopPickerPane instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: IProps) {
        super(props);

        this._onShareAudioCheck = this._onShareAudioCheck.bind(this);
    }

    /**
     * Function to be called when the Checkbox is used.
     *
     * @param {boolean} checked - Checkbox status (checked or not).
     * @returns {void}
     */
    _onShareAudioCheck({ target: { checked } }: { target: { checked: boolean; }; }) {
        this.props.onShareAudioChecked(checked);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    override render() {
        const {
            onClick,
            onDoubleClick,
            selectedSourceId,
            sources,
            type,
            t
        } = this.props;

        const classNames
            = `desktop-picker-pane default-scrollbar source-type-${type}`;
        const previews
            = sources
                ? sources.map(source => (
                    <DesktopSourcePreview
                        key = { source.id }
                        onClick = { onClick }
                        onDoubleClick = { onDoubleClick }
                        selected = { source.id === selectedSourceId }
                        source = { source }
                        type = { type } />))
                : (
                    <div className = 'desktop-picker-pane-spinner'>
                        <Spinner />
                    </div>
                );

        let checkBox;

        // Only display the share audio checkbox if we're on windows and on
        // desktop sharing tab.
        // App window and Mac OS screen sharing doesn't work with system audio.
        if (type === 'screen' && Platform.OS === 'windows') {
            checkBox = (<Checkbox
                label = { t('dialog.screenSharingAudio') }
                name = 'share-system-audio'
                onChange = { this._onShareAudioCheck } />);
        }

        return (
            <div className = { classNames }>
                { previews }
                { checkBox }
            </div>
        );
    }
}

export default translate(DesktopPickerPane);
