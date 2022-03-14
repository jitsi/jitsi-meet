export function getPopoutVideoElement(popout) {
    return popout.window.document.getElementById('video');
}

export function createPopoutWindow(participantId, participantDisplayName, avatarHtml) {
    const popoutHtml = `<html><head></head>
        <body style='margin:0;background:black;'>
            <video id='video' autoplay muted style='height:100%;width:100%;'></video>
            ${avatarHtml}
        </body>
    </html>`;
    const popout = window.open(
        "",
        participantId,
        "width=890,height=540"
    );
    popout.window.document.write(popoutHtml);
    popout.window.document.title = participantDisplayName;
    return popout;
}

export function displayPopoutVideo(popout) {
    getPopoutVideoElement(popout).style.display = 'block';
    getPopoutAvatar(popout).style.display = 'none';
}

export function displayPopoutAvatar(popout) {
    getPopoutVideoElement(popout).style.display = 'none';
    getPopoutAvatar(popout).style.display = 'flex';
}

function getPopoutAvatar(popout) {
    return popout.window.document.getElementById('avatar');
}

export function isPopoutOpen(popout) {
    return popout && !popout.closed;
}

export function isPopoutClosedButNotMarked(popout) {
    return popout && popout.closed;
}

export function getPopoutAvatarHtmlFromThumbnail(participantId) {
    const avatar = window.document.getElementById(`avatar-${participantId}`)?.cloneNode(true);
    if (!avatar) return '';
    
    avatar.id = 'avatar';
    avatar.style.fontFamily = '-apple-system,BlinkMacSystemFont,AvenirNextP2ForBBG,open_sanslight,"Helvetica Neue",Helvetica,Arial,sans-serif';
    avatar.style.fontSize = "12px";
    avatar.style.fontWeight = "100";
    avatar.style.width = "100%";
    avatar.style.height = "100%";
    avatar.style.justifyContent = "center";
    avatar.style.alignItems = "center";
    const _avatar = avatar.getElementsByClassName("avatar")[0];
    _avatar.style.borderRadius = "50%";
    _avatar.style.height = "min(50vh, 50vw)";
    _avatar.style.width = "min(50vh, 50vw)";

    return avatar.outerHTML;
}
