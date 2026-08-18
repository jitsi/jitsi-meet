# Second screen — manual test checklist

Companion to `secondScreen.spec.ts`. That spec covers the contract the External
API owes an embedder: that a command is answered, with which code, and that a
failure leaves no window behind. Everything below is what an automated run cannot
reach, and it is not a small set, so it is written to be reproducible rather than
left to whoever last touched the feature.

## Why these are not automated

CI runs headless with a single display. Two things follow, and only the second is
the obvious one.

Headless Chrome **does** expose `getScreenDetails`, so the feature reports itself
as supported and a command gets past the enablement gate. It is not the
"unsupported browser" case it is often assumed to be. What it cannot do is reach
the permission: `navigator.permissions.query` reports `prompt`, but no prompt is
ever raised, because a command arriving over the external API carries no
transient user activation and Chromium refuses to ask without one. The call
rejects with `NotAllowedError` in ~2ms (verified on HeadlessChrome/151), so an
enabled command in CI lands on `window-management-unavailable` almost at once,
not on `second-screen-disabled`.

That also means a prompt left unanswered is only reachable from an in-app
trigger in a real browser, which is why cases A3 and A5 below cannot be
approximated in CI at all.

And with one display there is no second screen to place a window on, so placement,
fullscreen, occupancy and every multi-display behaviour below are unreachable
regardless of permissions. Stubbing `getScreenDetails` would test the stub.

## Setup

- Chromium-based browser. The Window Management API is Chromium-only, so Firefox
  and Safari are only useful for confirming the feature stays off (case A6).
- At least two physical displays. Cases D1 to D4 need one that can be undocked or
  unplugged.
- `secondScreen: { enabled: true }`, either in `config.js` or as
  `#config.secondScreen.enabled=true` on the URL, since the option is in
  `configWhitelist`.
- For an iframe embed, the iframe needs `allow="window-management; fullscreen"`.
- **Allow popups for the origin.** A command arriving over the External API runs
  with no user activation, so the popup blocker refuses the window and every such
  case reports `popup-blocked` instead of what it was meant to test. An in-app
  trigger is a real click and does not need this.
- **Grant window-management out of band for the API cases.** For the same reason,
  Chromium will not raise the permission prompt for an API-driven open: it rejects
  immediately, and the case reports `window-management-unavailable`. Grant it under
  the site settings padlock first, or drive the case from an in-app trigger.
- Start each permission case from a profile where window-management has not been
  answered yet. Reset it under the site settings padlock, or use a fresh profile;
  the permission is sticky per origin, so a second run of A2 tests nothing.

Cases marked **[#17666]** need the in-app triggers branch. The rest work against
master.

---

## A. Opening, permissions and placement

**A2 to A5c have to be driven by an in-app trigger, not by the External API**, and
are therefore **[#17666]** cases whatever else they test. Only a real click carries
the user activation Chromium requires before it will raise the permission prompt;
over the API the call rejects at once and the case never reaches what it was
written for. On master the prompt is unreachable altogether, since there are no
in-app triggers there.

| # | Steps | Expected |
|---|---|---|
| A1 | On a granted profile, `setSecondScreen` with `{ id: 'a', source: { role: 'stage' } }` | Window opens on an external display, fullscreen, showing the active speaker. `secondScreenSourceChanged` fires with `id: 'a'`. |
| A2 | On an ungranted profile, click an in-app trigger and press **Allow** promptly | Prompt appears, window opens and moves onto the external display. One `secondScreenSourceChanged`. |
| A3 | Same as A2, but wait ~30s before pressing Allow | The window still opens and places correctly. It must not be blocked by the popup blocker, and no error is reported. This is the transient-activation case: the open runs before anything is awaited. **[#17666]** The window renders its content on the meeting's own screen while the prompt is up, and jumps to the external display on Allow; it is not blank while waiting. |
| A4 | Same as A2, but press **Block** | `secondScreenError` with `window-management-unavailable`, and nothing after it. No window is left on screen, and no `secondScreenClosed` follows the error: reporting the error alone is master's contract for a failed open, and an embedder that reopens on `secondScreenClosed` would loop on the extra event. **[#17666]** |
| A5 | Same as A2, but dismiss nothing and leave the prompt open | **[#17666]** The window renders on the meeting's own screen meanwhile, so it looks like it worked; after 30s `secondScreenError` with `window-management-unavailable`, the window closes, and again no `secondScreenClosed` follows. The case does not exist on master, which has no in-app trigger to raise a prompt from; the bound is what keeps an unanswered prompt from parking the open forever. |
| A5b | During A5, while the prompt is still up, click the trigger again to cancel | **[#17666]** The window closes at once and `secondScreenClosed` is reported. It must not stay up until the prompt is answered, and the trigger must not stay inverted. |
| A5c | During A5, while the prompt is still up, send the same id again | **[#17666]** The existing window re-sources in place. It must not open a second window and must not return silently. |
| A6 | Repeat A1 in Firefox or Safari | `secondScreenError` with `second-screen-disabled`. No window. |
| A7 | With popups blocked for the site, repeat A1 | `secondScreenError` with `popup-blocked`. |
| A8 | On a profile where window-management was previously **denied**, click an in-app trigger | **[#17666]** `secondScreenError` with `window-management-unavailable`, and no window is left behind. Expect a brief flash: the rejection is not acted on until the window is registered, so it opens, loads and renders before being torn down. Shortening that needs the denied state to be known before the open, which `preloadScreenDetails` could cache. |

## B. Sources and live behaviour

| # | Steps | Expected |
|---|---|---|
| B1 | `{ role: 'stage' }`, then have a different participant speak | The window follows the new active speaker without a re-send. A `secondScreenSourceChanged` fires per change, with the new `participantId`. |
| B2 | `{ role: 'tile' }`, then have someone join and someone leave | The grid re-lays out both times. |
| B3 | `{ role: 'screenshare' }` while one person shares | The share renders full-bleed. |
| B4 | `{ role: 'screenshare', participant: X }` with **two** shares live | Specifically X's share, not the stage layout. Note this differs from pre-#17666 behaviour, where the participant was ignored. |
| B5 | `{ role: 'whiteboard' }` | The whiteboard renders and is drawable from the meeting window, updating on the second screen. |
| B6 | `{ role: 'sharedvideo' }` while a video is shared | The video plays. **Audio must come from the meeting window only** — confirm it is not doubled or echoed. |
| B7 | Pause the shared video from the meeting | The second screen keeps showing it; the window must not tear down. |
| B8 | `{ participant: X }` for a participant with video, then mute their camera | Video, then their avatar. No blank window. |
| B9 | `{ participant: X, media: 'desktop' }` | Their screen rather than their camera. |
| B10 | Reuse the same `id` with a different `source` | The window updates in place. It must not close and reopen, and must not move screens. |

## C. Closing

| # | Steps | Expected |
|---|---|---|
| C1 | `setSecondScreen` with the same `id` and no `source` | Window closes, `secondScreenClosed` fires once. |
| C2 | Close the popup by hand on the other display | `secondScreenClosed` fires. Re-sending the same id opens a fresh window. |
| C3 | End the conference with a window open | Window closes, `secondScreenClosed` fires. |
| C4 | Reload the meeting tab with a window open | The orphan window closes rather than being left on the display. |
| C5 | Send a close for an id that was never opened | Nothing happens, and no `secondScreenClosed` is fabricated. |

## D. Multiple displays and occupancy — **[#17666]**

These are the cases the positional occupancy logic exists for. Three displays are
ideal; two will exercise D1 and D2.

| # | Steps | Expected |
|---|---|---|
| D1 | Meeting on A, externals B and C. Trigger a send twice | The two windows land on B and C, one each, never stacked. |
| D2 | With windows on B and C, close B's popup by hand, then undock B. Send again | The send re-sources the surviving window rather than opening a second one on top of it. |
| D3 | With windows on B and C, undock C (its window relocates onto A), then redock C. Send again | A window opens on the now-free C. It must **not** silently re-source the window sitting over the meeting. |
| D4 | Undock C so its window relocates onto A, leaving no free external screen. Send again | The send takes over the window on B, not the one overlapping the meeting. |
| D5 | Start with only the laptop panel, send once, then dock an external monitor and send again | The second send opens on the newly attached monitor, not over the first window. |
| D6 | Drag a second-screen window to a different display by hand, then send again | Occupancy follows where the window actually is, not where it was opened. |

## E. In-app triggers — **[#17666]**

| # | Steps | Expected |
|---|---|---|
| E1 | With the feature **disabled**, hover a screenshare tile and the shared-video tile | No trigger, and no invisible hit area: clicking the top-right corner of the tile still pins as it always did. |
| E2 | Hover a screenshare tile with the feature enabled | Trigger appears; clicking sends that share to a second screen. |
| E3 | Click the same trigger again | The window closes. |
| E4 | Send a screenshare, then have the sharer stop sharing | The window closes on its own and reports `secondScreenClosed`, about 5s later. The tile and its trigger are gone, so nothing else could have closed it. |
| E5 | Send a participant, then have them leave | Same as E4, including the delay. |
| E6 | Send the shared video, then stop the share | The window closes at once: the shared video is not participant-backed, so it does not wait. |
| E7 | Send the whiteboard from its context menu, then close the whiteboard | Same as E6, at once. The window must not be left showing the whiteboard placeholder. |
| E7b | Send a participant, then take their tab offline in DevTools for ~2s and let it recover | The window survives. This is the case the 5s grace exists for: the participant is briefly absent, and closing on absence alone would destroy a window with no way to get it back. Best-effort, since it needs the client to resume the same session rather than rejoin as a new one; a full reload is a new id and the window closes correctly after the grace. |
| E8 | Start a send, and while the permission prompt is still open, click the trigger again to cancel | The window closes. It must not first fly to the other display and then vanish. |
| E9 | Open a window through the External API, then use an in-app trigger | The trigger opens its own window; it must never take over or close the embedder's. |

## F. Sanity

| # | Steps | Expected |
|---|---|---|
| F1 | With a second screen open, check the participant count in the meeting | Unchanged. The window is a view, not a second join. |
| F2 | Watch bandwidth/stats with a stage window open | No duplicated media subscription for the same source. |
| F3 | Leave a window open for several minutes | No drift, no memory growth, no repeated re-mounts in the console. |
