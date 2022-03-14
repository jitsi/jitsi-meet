import { OPEN_POPOUT, CLOSE_POPOUT, UPDATE_POPOUT_VIDEO_STREAM, SET_POPOUT_DISPLAY_MODE, SET_POPOUT_AVATAR } from "./actionTypes"

export function openPopout(participantId) {
  return {
    type: OPEN_POPOUT,
    participantId,
    popout: null
  };
}

export function closePopout(participantId) {
  return {
    type: CLOSE_POPOUT,
    participantId
  };
}

export function updatePopoutVideoStream(participantId) {
  return {
    type: UPDATE_POPOUT_VIDEO_STREAM,
    participantId
  }
}

export function setPopoutDisplayMode(participantId, displayMode) {
  return {
    type: SET_POPOUT_DISPLAY_MODE,
    participantId,
    displayMode
  }
}

export function setPopoutAvatar(participantId, avatarHtml) {
  return {
    type: SET_POPOUT_AVATAR,
    participantId,
    avatarHtml
  }
}
