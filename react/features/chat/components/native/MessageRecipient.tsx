import React from "react";
import { Text, TouchableHighlight, View, ViewStyle } from "react-native";
import { connect } from "react-redux";

import { IReduxState, IStore } from "../../../app/types";
import { translate } from "../../../base/i18n/functions";
import Icon from "../../../base/icons/components/Icon";
import { IconCloseLarge, IconCloseCircle } from "../../../base/icons/svg";
import { ILocalParticipant } from "../../../base/participants/types";
import { setParams } from "../../../mobile/navigation/components/conference/ConferenceNavigationContainerRef";
import { setLobbyChatActiveState, setPrivateMessageRecipient, setReplyDraft } from "../../actions.any";
import AbstractMessageRecipient, {
    IProps as AbstractProps,
    _mapStateToProps as _mapStateToPropsAbstract,
} from "../AbstractMessageRecipient";

import styles from "./styles";

interface IProps extends AbstractProps {
    /**
     * The Redux dispatch function.
     */
    dispatch: IStore["dispatch"];

    /**
     * Is lobby messaging active.
     */
    isLobbyChatActive: boolean;

    /**
     * The participant string for lobby chat messaging.
     */
    lobbyMessageRecipient?:
        | {
              id: string;
              name: string;
          }
        | ILocalParticipant;

    /**
     * The message being replied to.
     */
    _replyingTo: any;
}

/**
 * Class to implement the displaying of the recipient of the next message.
 */
class MessageRecipient extends AbstractMessageRecipient<IProps> {
    /**
     * Constructor of the component.
     *
     * @param {IProps} props - The props of the component.
     */
    constructor(props: IProps) {
        super(props);

        this._onResetPrivateMessageRecipient = this._onResetPrivateMessageRecipient.bind(this);
        this._onResetLobbyMessageRecipient = this._onResetLobbyMessageRecipient.bind(this);
        this._onDismissReply = this._onDismissReply.bind(this);
    }

    /**
     * Dismisses the reply draft.
     *
     * @returns {void}
     */
    _onDismissReply() {
        const { dispatch } = this.props;

        dispatch(setReplyDraft(undefined));
    }

    /**
     * Resets lobby message recipient from state.
     *
     * @returns {void}
     */
    _onResetLobbyMessageRecipient() {
        const { dispatch } = this.props;

        dispatch(setLobbyChatActiveState(false));
    }

    /**
     * Resets private message recipient from state.
     *
     * @returns {void}
     */
    _onResetPrivateMessageRecipient() {
        const { dispatch } = this.props;

        dispatch(setPrivateMessageRecipient());

        setParams({
            privateMessageRecipient: undefined,
        });
    }

    /**
     * Implements {@code PureComponent#render}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    override render() {
        const { isLobbyChatActive, lobbyMessageRecipient, _privateMessageRecipient, _isVisitor, _replyingTo, t } =
            this.props;

        return (
            <View>
                {isLobbyChatActive && (
                    <View id="chat-recipient" style={styles.lobbyMessageRecipientContainer as ViewStyle}>
                        <Text style={styles.messageRecipientText}>
                            {t("chat.lobbyChatMessageTo", {
                                recipient: lobbyMessageRecipient?.name,
                            })}
                        </Text>
                        <TouchableHighlight onPress={this._onResetLobbyMessageRecipient}>
                            <Icon src={IconCloseLarge} style={styles.messageRecipientCancelIcon} />
                        </TouchableHighlight>
                    </View>
                )}

                {_privateMessageRecipient && (
                    <View id="message-recipient" style={styles.messageRecipientContainer as ViewStyle}>
                        <Text style={styles.messageRecipientText}>
                            {t("chat.messageTo", {
                                recipient: `${_privateMessageRecipient}${
                                    _isVisitor ? ` ${t("visitors.chatIndicator")}` : ""
                                }`,
                            })}
                        </Text>
                        <TouchableHighlight
                            id="message-recipient-cancel-button"
                            onPress={this._onResetPrivateMessageRecipient}
                            underlayColor={"transparent"}
                        >
                            <Icon src={IconCloseLarge} style={styles.messageRecipientCancelIcon} />
                        </TouchableHighlight>
                    </View>
                )}

                {_replyingTo && (
                    <View
                        style={{
                            backgroundColor: "#f0f0f0",
                            padding: 8,
                            marginHorizontal: 16,
                            marginVertical: 4,
                            borderRadius: 8,
                            borderLeftWidth: 3,
                            borderLeftColor: "#0376da",
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                        }}
                    >
                        <View style={{ flex: 1 }}>
                            <Text
                                style={{
                                    fontSize: 12,
                                    fontWeight: "bold",
                                    color: "#0376da",
                                    marginBottom: 2,
                                }}
                            >
                                {t("chat.replyingTo", { name: _replyingTo.displayName })}
                            </Text>
                            <Text
                                style={{
                                    fontSize: 12,
                                    color: "#666",
                                    fontStyle: "italic",
                                }}
                                numberOfLines={1}
                            >
                                {_replyingTo.snippet}
                            </Text>
                        </View>
                        <TouchableHighlight
                            onPress={this._onDismissReply}
                            style={{
                                marginLeft: 8,
                                padding: 4,
                            }}
                            underlayColor="transparent"
                        >
                            <Icon
                                src={IconCloseCircle}
                                style={{
                                    width: 16,
                                    height: 16,
                                    tintColor: "#666",
                                }}
                            />
                        </TouchableHighlight>
                    </View>
                )}
            </View>
        );
    }
}

/**
 * Maps part of the redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @param {any} _ownProps - Component's own props.
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState, _ownProps: any) {
    const { lobbyMessageRecipient, isLobbyChatActive, replyingTo } = state["features/chat"];

    return {
        ..._mapStateToPropsAbstract(state, _ownProps),
        isLobbyChatActive,
        lobbyMessageRecipient,
        _replyingTo: replyingTo,
    };
}

export default translate(connect(_mapStateToProps)(MessageRecipient));
