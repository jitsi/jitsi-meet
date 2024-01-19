import { withStyles } from '@mui/styles';
import React from 'react';
import { WithTranslation } from 'react-i18next';

import AbstractDialogTab, {
    IProps as AbstractDialogTabProps
} from '../../../base/dialog/components/web/AbstractDialogTab';
import { translate } from '../../../base/i18n/functions';
import VirtualBackgrounds from '../../../virtual-background/components/VirtualBackgrounds';
import { IVirtualBackground } from '../../../virtual-background/reducer';

/**
 * The type of the React {@code Component} props of {@link VirtualBackgroundTab}.
 */
export interface IProps extends AbstractDialogTabProps, WithTranslation {

    /**
     * CSS classes object.
     */
    classes: any;

    /**
     * Virtual background options.
     */
    options: IVirtualBackground;

    /**
     * The id of the selected video device.
     */
    selectedVideoInputId: string;
}

const styles = () => {
    return {
        container: {
            width: '100%',
            display: 'flex',
            flexDirection: 'column' as const
        }
    };
};

/**
 * React {@code Component} for modifying language and moderator settings.
 *
 * @augments Component
 */
class VirtualBackgroundTab extends AbstractDialogTab<IProps, any> {
    /**
     * Initializes a new {@code ModeratorTab} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: IProps) {
        super(props);

        // Bind event handler so it is only bound once for every instance.
        this._onOptionsChanged = this._onOptionsChanged.bind(this);
    }

    /**
     * Callback invoked to select if follow-me mode
     * should be activated.
     *
     * @param {Object} options - The new background options.
     *
     * @returns {void}
     */
    _onOptionsChanged(options: any) {
        super._onChange({ options });
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            classes,
            options,
            selectedVideoInputId
        } = this.props;

        return (
            <div
                className = { classes.container }
                id = 'virtual-background-dialog'
                key = 'virtual-background'>
                <VirtualBackgrounds
                    onOptionsChange = { this._onOptionsChanged }
                    options = { options }
                    selectedThumbnail = { options.selectedThumbnail ?? '' }
                    selectedVideoInputId = { selectedVideoInputId } />
            </div>
        );
    }
}

export default withStyles(styles)(translate(VirtualBackgroundTab));
