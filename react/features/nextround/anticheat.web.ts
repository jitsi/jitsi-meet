// @ts-expect-error - jwt-decode ships without matching type declarations here.
import jwtDecode from 'jwt-decode';

import { IReduxState } from '../app/types';

/**
 * NextRound anti-cheat integration (migrated from the root `custom.js` fork hook
 * into the `nextround` feature).
 *
 * The candidate joins an interview through an invite link with no account
 * (NextRound NFR-2), so inside the Jitsi call we cannot lean on Clerk to know
 * who they are. Instead the API stamps a `context.nextround` block into the
 * Jitsi JWT it mints:
 *
 *   context.nextround = { interviewId, role, apiBase, eventsToken }.
 *
 *   Role 'candidate' -> the unauthorized invite-joiner we monitor. This reports
 *                       tab focus, paste/copy, and shortcut activity to
 *                       POST {apiBase}/api/interviews/{interviewId}/events.
 *   Role 'staff'     -> the interviewer. This subscribes to the SSE stream and
 *                       shows each event live as an in-call toast.
 *
 * Everything is best-effort and wrapped so a failure here can never break the
 * meeting.
 */

/**
 * The NextRound context carried inside the Jitsi JWT.
 */
export interface INextRoundContext {
    apiBase: string;
    eventsToken: string;
    interviewId: string;
    role: string;
}

/**
 * A single candidate activity event, as returned by the events backlog/stream.
 */
interface INextRoundEvent {
    actor?: string;
    created_at?: string;
    event_type?: string;
    id?: string;
}

const EVENT_LABELS = {
    BACKGROUND: 'Interview tab went to background',
    FOREGROUND: 'Returned to interview tab',
    PASTE: 'Candidate pasted (Ctrl/Cmd+V)',
    COPY: 'Candidate copied (Ctrl/Cmd+C)'
};

// Guards against double-init; replaces the old `window.__nrAntiCheatStarted`.
let started = false;

// The always-visible activity log, created lazily for staff.
let panel: { addRow: (text: string, when?: string) => void; } | undefined;

/**
 * Reads the NextRound context out of the Jitsi JWT held in redux.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {INextRoundContext | null}
 */
export function readNextRoundContext(state: IReduxState): INextRoundContext | null {
    try {
        const jwt = state['features/base/jwt']?.jwt;

        if (!jwt) {
            return null;
        }

        const payload = jwtDecode(jwt) as { context?: { nextround?: INextRoundContext; }; } | undefined;
        const nr = payload?.context?.nextround;

        if (nr?.interviewId && nr.apiBase && nr.eventsToken) {
            return nr;
        }
    } catch (e) {
        /* fall through */
    }

    return null;
}

// --- candidate side: emit events -------------------------------------

/**
 * Starts reporting the candidate's activity to the NextRound API.
 *
 * @param {INextRoundContext} nr - The NextRound context.
 * @returns {void}
 */
function startCandidateTracking(nr: INextRoundContext): void {
    const endpoint = `${nr.apiBase.replace(/\/$/, '')}/api/interviews/${
        encodeURIComponent(nr.interviewId)}/events`;

    // A single user action can reach us twice — e.g. Cmd+V fires both `keydown`
    // and the `paste` event. Drop a repeat of the same signal inside a short
    // window so the interviewer sees one row per action.
    const lastSent: Record<string, number> = {};

    function sendEvent(eventType: string) {
        const now = Date.now();

        if (lastSent[eventType] && now - lastSent[eventType] < 600) {
            return;
        }
        lastSent[eventType] = now;

        try {
            fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${nr.eventsToken}`
                },
                body: JSON.stringify({ event_type: eventType }),
                keepalive: true
            }).catch(() => { /* best-effort */ });
        } catch (e) {
            /* best-effort */
        }
    }

    // Coalesce visibility + focus into one background/foreground signal, so we
    // emit once per real transition rather than a burst.
    let lastVisibility = document.hidden || !document.hasFocus() ? 'hidden' : 'visible';

    function onVisibilityOrFocusChange() {
        const next = document.hidden || !document.hasFocus() ? 'hidden' : 'visible';

        if (next === lastVisibility) {
            return;
        }
        lastVisibility = next;
        sendEvent(next === 'hidden' ? EVENT_LABELS.BACKGROUND : EVENT_LABELS.FOREGROUND);
    }

    function onKeyDown(e: KeyboardEvent) {
        const mod = e.ctrlKey || e.metaKey;

        if (mod && (e.key === 'v' || e.key === 'V')) {
            sendEvent(EVENT_LABELS.PASTE);

            return;
        }
        if (mod && (e.key === 'c' || e.key === 'C')) {
            sendEvent(EVENT_LABELS.COPY);

            return;
        }
        if (mod && e.key === '\\') {
            sendEvent('Candidate used shortcut: Ctrl/Cmd + \\');

            return;
        }
        if (mod && '123456789'.indexOf(e.key) !== -1) {
            sendEvent(`Candidate used shortcut: Ctrl/Cmd + ${e.key}`);

            return;
        }
        if (e.altKey && e.key === 'Tab') {
            sendEvent('Candidate used Alt+Tab');

            return;
        }
        if (e.metaKey && e.key === 'Tab') {
            sendEvent('Candidate used Cmd+Tab');
        }
    }

    // Fallbacks for menu / right-click copy & paste.
    function onCopy() {
        sendEvent(EVENT_LABELS.COPY);
    }
    function onPaste() {
        sendEvent(EVENT_LABELS.PASTE);
    }

    document.addEventListener('visibilitychange', onVisibilityOrFocusChange);
    window.addEventListener('blur', onVisibilityOrFocusChange);
    window.addEventListener('focus', onVisibilityOrFocusChange);
    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('copy', onCopy);
    document.addEventListener('paste', onPaste);

    // eslint-disable-next-line no-console
    console.log('[NextRound] anti-cheat tracking active for interview', nr.interviewId);
}

// --- staff side: watch events live -----------------------------------
//
// Two surfaces for the interviewer:
//   1. A persistent panel (top-right) with a running log of everything the
//      candidate did — readable at any point during the interview.
//   2. A brief toast per new event, so a fresh signal grabs attention even when
//      the interviewer is looking at the video.

/**
 * Escapes HTML-special characters for safe insertion into innerHTML.
 *
 * @param {string} s - The raw string.
 * @returns {string}
 */
function escapeHtml(s: string): string {
    return String(s).replace(/[&<>"]/g, (c: string) =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' } as Record<string, string>)[c]);
}

/**
 * Formats a timestamp (or now) as a local time string.
 *
 * @param {string} [when] - An ISO timestamp, or falsy for "now".
 * @returns {string}
 */
function fmtTime(when?: string): string {
    return (when ? new Date(when) : new Date()).toLocaleTimeString();
}

/**
 * Lazily creates the always-visible candidate activity log.
 *
 * @returns {Object} An object exposing {@code addRow}.
 */
function ensurePanel() {
    if (panel) {
        return panel;
    }

    const panelEl = document.createElement('div');

    panelEl.id = 'nr-activity-panel';
    panelEl.style.cssText = [
        'position:fixed', 'top:16px', 'right:16px', 'z-index:2147483646',
        'width:300px', 'max-height:60vh', 'display:flex', 'flex-direction:column',
        'background:rgba(24,26,29,0.94)', 'color:#e8eaed', 'border-radius:10px',
        'box-shadow:0 6px 22px rgba(0,0,0,0.45)', 'overflow:hidden',
        'font:13px/1.4 system-ui,-apple-system,sans-serif',
        'backdrop-filter:blur(4px)'
    ].join(';');

    const header = document.createElement('div');

    header.style.cssText = [
        'display:flex', 'align-items:center', 'gap:8px', 'cursor:grab',
        'padding:10px 12px', 'background:rgba(234,67,53,0.18)',
        'border-bottom:1px solid rgba(255,255,255,0.08)', 'user-select:none'
    ].join(';');
    header.innerHTML
        = '<span style="font-size:15px">&#128373;</span>'
        + '<b style="flex:1">Candidate activity</b>'
        + '<span id="nr-count" style="background:#ea4335;color:#fff;border-radius:10px;'
        + 'padding:1px 8px;font-size:12px;font-weight:600">0</span>'
        + '<span id="nr-caret" style="opacity:.7">&#9650;</span>';

    const list = document.createElement('div');

    list.id = 'nr-list';
    list.style.cssText = [
        'overflow-y:auto', 'padding:6px 0', 'flex:1'
    ].join(';');
    list.innerHTML
        = '<div id="nr-empty" style="padding:14px 12px;opacity:.6">'
        + 'No activity yet. Tab switches, paste and shortcuts will appear here.</div>';

    function toggleCollapse() {
        const collapsed = list.style.display === 'none';

        list.style.display = collapsed ? 'block' : 'none';

        const caret = panelEl.querySelector('#nr-caret');

        if (caret) {
            caret.innerHTML = collapsed ? '&#9650;' : '&#9660;';
        }
    }

    // The interviewer can drag the panel by its header to place it anywhere; the
    // position persists across reloads. A press that doesn't move is treated as
    // a click and toggles collapse instead.
    const POS_KEY = 'nr_activity_panel_pos';
    let drag: { moved: boolean; origLeft: number; origTop: number; startX: number; startY: number; } | null = null;

    function onDragMove(e: MouseEvent) {
        if (!drag) {
            return;
        }
        const dx = e.clientX - drag.startX;
        const dy = e.clientY - drag.startY;

        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
            drag.moved = true;
        }
        const left = Math.max(0, Math.min(drag.origLeft + dx, window.innerWidth - panelEl.offsetWidth));
        const top = Math.max(0, Math.min(drag.origTop + dy, window.innerHeight - panelEl.offsetHeight));

        panelEl.style.left = `${left}px`;
        panelEl.style.top = `${top}px`;
    }

    function onDragEnd() {
        if (!drag) {
            return;
        }
        document.removeEventListener('mousemove', onDragMove, true);
        document.removeEventListener('mouseup', onDragEnd, true);
        header.style.cursor = 'grab';

        if (drag.moved) {
            try {
                localStorage.setItem(POS_KEY, JSON.stringify({
                    left: parseInt(panelEl.style.left, 10),
                    top: parseInt(panelEl.style.top, 10)
                }));
            } catch (e) { /* ignore */ }
        } else {
            toggleCollapse();
        }
        drag = null;
    }

    header.addEventListener('mousedown', (e: MouseEvent) => {
        if (e.button !== 0) {
            return;
        }
        const rect = panelEl.getBoundingClientRect();

        // Switch from right-anchored to absolute left/top so dragging is smooth.
        panelEl.style.left = `${rect.left}px`;
        panelEl.style.top = `${rect.top}px`;
        panelEl.style.right = 'auto';

        drag = { startX: e.clientX, startY: e.clientY, origLeft: rect.left, origTop: rect.top, moved: false };
        header.style.cursor = 'grabbing';
        document.addEventListener('mousemove', onDragMove, true);
        document.addEventListener('mouseup', onDragEnd, true);
        e.preventDefault();
    });

    panelEl.appendChild(header);
    panelEl.appendChild(list);
    document.body.appendChild(panelEl);

    // Restore a previously dragged position.
    try {
        const saved = JSON.parse(localStorage.getItem(POS_KEY) || 'null');

        if (saved && typeof saved.left === 'number' && typeof saved.top === 'number') {
            panelEl.style.left = `${saved.left}px`;
            panelEl.style.top = `${saved.top}px`;
            panelEl.style.right = 'auto';
        }
    } catch (e) { /* ignore */ }

    let count = 0;

    panel = {
        addRow(text: string, when?: string) {
            const empty = list.querySelector('#nr-empty');

            if (empty) {
                empty.remove();
            }
            const row = document.createElement('div');

            row.style.cssText = [
                'padding:8px 12px', 'border-bottom:1px solid rgba(255,255,255,0.05)',
                'display:flex', 'gap:8px', 'align-items:baseline',
                'background:rgba(234,67,53,0.22)', 'transition:background .8s ease'
            ].join(';');
            row.innerHTML
                = '<span style="color:#f28b82;font-size:11px;white-space:nowrap">'
                + `${fmtTime(when)}</span>`
                + `<span style="flex:1">${escapeHtml(text)}</span>`;
            list.insertBefore(row, list.firstChild);

            // Fade the "new" highlight after a moment.
            setTimeout(() => {
                row.style.background = 'transparent';
            }, 900);

            count += 1;

            const countEl = panelEl.querySelector('#nr-count');

            if (countEl) {
                countEl.textContent = String(count);
            }
        }
    };

    return panel;
}

/**
 * Lazily creates the host element for staff integrity toasts.
 *
 * @returns {HTMLElement}
 */
function ensureToastHost(): HTMLElement {
    const existing = document.getElementById('nr-anticheat-toasts');

    if (existing) {
        return existing;
    }
    const host = document.createElement('div');

    host.id = 'nr-anticheat-toasts';
    host.style.cssText = [
        'position:fixed', 'top:16px', 'right:332px', 'z-index:2147483647',
        'display:flex', 'flex-direction:column', 'gap:8px',
        'max-width:300px', 'pointer-events:none',
        'font:13px/1.4 system-ui,-apple-system,sans-serif'
    ].join(';');
    document.body.appendChild(host);

    return host;
}

/**
 * Shows a transient integrity toast for the interviewer.
 *
 * @param {string} text - The event label.
 * @param {string} [when] - An ISO timestamp, or falsy for "now".
 * @returns {void}
 */
function showToast(text: string, when?: string): void {
    const host = ensureToastHost();
    const toast = document.createElement('div');

    toast.style.cssText = [
        'background:rgba(234,67,53,0.96)', 'color:#fff',
        'padding:10px 12px', 'border-radius:8px',
        'box-shadow:0 4px 14px rgba(0,0,0,0.35)',
        'opacity:0', 'transform:translateX(12px)',
        'transition:opacity .2s ease,transform .2s ease'
    ].join(';');

    toast.innerHTML = `${'<b>&#9888; Integrity event</b><br>'
        + `${escapeHtml(text)}`
        + '<br><span style="opacity:.8;font-size:11px">'}${fmtTime(when)}</span>`;
    host.appendChild(toast);

    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(0)';
    });

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(12px)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 250);
    }, 8000);
}

/**
 * Starts watching the candidate's activity stream for the interviewer.
 *
 * @param {INextRoundContext} nr - The NextRound context.
 * @returns {void}
 */
function startStaffWatching(nr: INextRoundContext): void {
    const base = `${nr.apiBase.replace(/\/$/, '')}/api/interviews/${
        encodeURIComponent(nr.interviewId)}/events`;
    const activityPanel = ensurePanel();

    // The backlog GET and the SSE stream can both carry an event that lands
    // right as we join. De-dupe by id so it renders once.
    const seen: Record<string, boolean> = {};

    // `live` = show a toast; the backlog fill on join stays quiet.
    function handleEvent(evt: INextRoundEvent, live: boolean) {
        if (!evt || evt.actor !== 'candidate' || !evt.event_type) {
            return;
        }
        if (evt.id) {
            if (seen[evt.id]) {
                return;
            }
            seen[evt.id] = true;
        }
        activityPanel.addRow(evt.event_type, evt.created_at);
        if (live) {
            showToast(evt.event_type, evt.created_at);
        }
    }

    // Read the recent backlog once so a late-joining interviewer sees what
    // already happened, then follow the live stream.
    fetch(`${base}?limit=20`, {
        headers: { 'Authorization': `Bearer ${nr.eventsToken}` }
    })
        .then(r => (r.ok ? r.json() : { events: [] }))
        .then(data => {
            (data.events || []).slice().reverse()
                .forEach((e: INextRoundEvent) => {
                    handleEvent(e, false);
                });
        })
        .catch(() => { /* ignore */ });

    let closed = false;

    window.addEventListener('beforeunload', () => {
        closed = true;
    });

    // EventSource cannot send an Authorization header, so stream via fetch.
    (function connect() {
        fetch(`${base}/stream`, {
            headers: {
                'Accept': 'text/event-stream',
                'Authorization': `Bearer ${nr.eventsToken}`
            }
        }).then(res => {
            if (!res.ok || !res.body) {
                return undefined;
            }
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            function pump(): Promise<void> {
                return reader.read().then(result => {
                    if (result.done || closed) {
                        return undefined;
                    }
                    buffer += decoder.decode(result.value, { stream: true });
                    const lines = buffer.split('\n');

                    buffer = lines.pop() || '';
                    lines.forEach(line => {
                        if (line.indexOf('data: ') === 0) {
                            try {
                                handleEvent(JSON.parse(line.slice(6)), true);
                            } catch (e) { /* ignore */ }
                        }
                    });

                    return pump();
                });
            }

            return pump();
        }).catch(() => {
            /* network hiccup — retry below */
        }).then(() => {
            // Reconnect while the meeting is still open.
            if (!closed) {
                setTimeout(connect, 3000);
            }
        });
    })();

    // eslint-disable-next-line no-console
    console.log('[NextRound] watching candidate events for interview', nr.interviewId);
}

/**
 * Initializes anti-cheat tracking for the current role. Safe to call more than
 * once — only the first call with a valid context takes effect.
 *
 * @param {INextRoundContext} nr - The NextRound context.
 * @returns {void}
 */
export function startAntiCheat(nr: INextRoundContext): void {
    if (started) {
        return;
    }
    started = true;

    // Visible confirmation that detection worked — eyeball this in the console
    // when you join a real invite.
    // eslint-disable-next-line no-console
    console.log(
        `%c[NextRound] joined as ${nr.role.toUpperCase()
        } — interview ${nr.interviewId
        }${nr.role === 'candidate'
            ? ' (activity tracking ON)'
            : ' (watching candidate activity)'}`,
        'color:#1a73e8;font-weight:bold'
    );

    try {
        if (nr.role === 'candidate') {
            startCandidateTracking(nr);
        } else if (nr.role === 'staff') {
            startStaffWatching(nr);
        }
    } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[NextRound] anti-cheat init failed', e);
    }
}
