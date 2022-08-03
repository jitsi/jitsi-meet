/* eslint-disable lines-around-comment */
import React from 'react';

// @ts-ignore
import { Dialog } from '../../../base/dialog';
import { translate } from '../../../base/i18n/functions';
import { connect } from '../../../base/redux/functions';
import Switch from '../../../base/ui/components/web/Switch';
import AbstractMuteEveryonesVideoDialog, { abstractMapStateToProps, type Props }
// @ts-ignore
    from '../AbstractMuteEveryonesVideoDialog';

/**
 * A React Component with the contents for a dialog that asks for confirmation
 * from the user before disabling all remote participants cameras.
 *
 * @augments AbstractMuteEveryonesVideoDialog
 */
class MuteEveryonesVideoDialog extends AbstractMuteEveryonesVideoDialog<Props> {

    /**
     * Toggles advanced moderation switch.
     *
     * @returns {void}
     */
    _onToggleModeration() {
        // @ts-ignore
        this.setState(state => {
            return {
                moderationEnabled: !state.moderationEnabled,
                // @ts-ignore
                content: this.props.t(state.moderationEnabled
                    ? 'dialog.muteEveryonesVideoDialog' : 'dialog.muteEveryonesVideoDialogModerationOn'
                )
            };
        });
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <Dialog
                okKey = 'dialog.muteParticipantsVideoButton'
                onSubmit = { this._onSubmit }
                // @ts-ignore
                titleString = { this.props.title }
                width = 'small'>
                <div className = 'mute-dialog'>
                    {/* @ts-ignore */}
                    {this.state.content}
                    {/* @ts-ignore */}
                    { this.props.isModerationSupported && this.props.exclude.length === 0 && (
                        <>
                            <div className = 'separator-line' />
                            <div className = 'control-row'>
                                <label htmlFor = 'moderation-switch'>
                                    {/* @ts-ignore */}
                                    {this.props.t('dialog.moderationVideoLabel')}
                                </label>
                                <Switch
                                    // @ts-ignore
                                    checked = { !this.state.moderationEnabled }
                                    id = 'moderation-switch'
                                    onChange = { this._onToggleModeration } />
                            </div>
                        </>
                    )}
                </div>
            </Dialog>
        );
    }

    _onSubmit: () => boolean;
}

// @ts-ignore
export default translate(connect(abstractMapStateToProps)(MuteEveryonesVideoDialog));
