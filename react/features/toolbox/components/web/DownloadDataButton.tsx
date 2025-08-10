import { WithTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { IReduxState, IStore } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
import { IconDownload } from '../../../base/icons/svg';
import { getLocalParticipant, getRemoteParticipants, isLocalParticipantModerator } from '../../../base/participants/functions';
import { IParticipant } from '../../../base/participants/types';
import AbstractButton from '../../../base/toolbox/components/AbstractButton';
import { IMessage } from '../../../chat/types';
import { IPoll } from '../../../polls/types';

/**
 * The type of the React {@code Component} props of {@link DownloadDataButton}.
 */
interface IProps extends WithTranslation {
    _allParticipants: IParticipant[];
    _localParticipant?: IParticipant;
    _messages: IMessage[];
    _polls: { [pollId: string]: IPoll; };
    _room?: string;
    _visible: boolean;
    dispatch: IStore['dispatch'];
}

/**
 * A helper function to trigger the download of a text file.
 *
 * @param {string} content - The content to be saved in the file.
 * @param {string} filename - The name for the downloaded file.
 * @returns {void}
 */
const downloadTextFile = (content: string, filename: string) => {
    const element = document.createElement('a');

    const file = new Blob([ content ]);

    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
};

class DownloadDataButton extends AbstractButton<IProps> {
    override accessibilityLabel = 'toolbar.accessibilityLabel.downloadDataTooltip';
    override icon = IconDownload;
    override label = 'toolbar.accessibilityLabel.downloadData';
    override tooltip = 'toolbar.accessibilityLabel.downloadDataTooltip';

    /**
     * Handles clicking the button, and gathers and downloads the data.
     *
     * @returns {void}
     */
    override _handleClick() {
        const { _room, _localParticipant, _allParticipants, _messages, _polls } = this.props;

        const participantNameMap = new Map(_allParticipants.map(p => [ p.id, p.name ]));

        let dataString = `Meeting Data for: ${_room}\n`;

        dataString += `Date: ${new Date().toLocaleString()}\n\n`;

        // 1. Format Attendance List
        dataString += '--- Attendance ---\n';
        _allParticipants.forEach(p => {
            const isLocal = p.id === _localParticipant?.id;

            dataString += `${p.name}${isLocal ? ' (Me)' : ''}\n`;
        });
        dataString += '\n';

        // 2. Format Chat History
        dataString += '--- Chat History ---\n';
        _messages.forEach(msg => {
            const displayName = participantNameMap.get((msg as any).participantId) || 'Unknown User';
            const timestamp = new Date(msg.timestamp).toLocaleTimeString();

            dataString += `[${timestamp}] ${displayName}: ${msg.message}\n`;
        });
        dataString += '\n';

        // 3. Format Poll Results
        dataString += '--- Polls ---\n';
        if (Object.keys(_polls).length > 0) {
            Object.values(_polls).forEach((poll, index) => {
                dataString += `Poll ${index + 1}: ${poll.question}\n`;
                (poll.answers || []).forEach(answer => {
                    const voteCount = answer.voters.length;
                    const voterNames = answer.voters
                        .map(voterId => participantNameMap.get(voterId) || 'Unknown User')
                        .join(', ');

                    dataString += `  - ${answer.name} (${voteCount} votes): [${voterNames}]\n`;
                });
                dataString += '\n';
            });
        } else {
            dataString += 'No polls were conducted.\n\n';
        }

        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${day}`;

        downloadTextFile(dataString, `${_room}_${dateString}.txt`);
    }

    /**
     * Overrides the parent's render method to hide the button if not visible.
     *
     * @returns {React.ReactNode|null}
     */
    override render() {
        return this.props._visible ? super.render() : null;
    }
}

/**
 * Maps (parts of) the Redux state to the associated props.
 *
 * @param {IReduxState} state - The Redux state.
 * @returns {Object} The mapped props.
 */
function _mapStateToProps(state: IReduxState) {
    const localParticipant = getLocalParticipant(state);

    const remoteParticipants = getRemoteParticipants(state);

    const allParticipants: IParticipant[] = [];

    if (localParticipant) {
        allParticipants.push(localParticipant);
    }
    allParticipants.push(...Array.from(remoteParticipants.values()));


    return {
        _visible: isLocalParticipantModerator(state),
        _room: state['features/base/conference']?.room,
        _localParticipant: localParticipant,
        _allParticipants: allParticipants,
        _messages: state['features/chat'].messages,
        _polls: state['features/polls']?.polls ?? {}
    };
}

export default translate(connect(_mapStateToProps)(DownloadDataButton));
