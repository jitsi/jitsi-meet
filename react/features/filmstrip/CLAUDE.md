# filmstrip

## Tile view size

- `calculateThumbnailSizeForTileView()` (`functions.web.ts`) computes the tile size. For one row of N tiles with `disableTileEnlargement: true`:
  - width = `(clientWidth - N*4 - 14) / N` (`TILE_HORIZONTAL_MARGIN`, `TILE_VIEW_GRID_HORIZONTAL_MARGIN`)
  - height = `min(width / aspectRatio, clientHeight - 14 - 4)` (`TILE_VIEW_GRID_VERTICAL_MARGIN`, `TILE_VERTICAL_MARGIN`)
  - Example: two 1280x720 tiles need a 2582x748 area. A 2560x720 area gives 1269x702 tiles, which get 360p (see `react/features/video-quality/`).
- `disableTileEnlargement: true` sets `objectFit: contain` instead of `cover` (`components/web/Thumbnail.tsx`). The video keeps its aspect ratio, with letterboxing instead of a crop. It can be set in the URL: `#config.disableTileEnlargement=true`.

## Automatic tile view and reordering

- Automatic tile view needs `getParticipantCount(state) >= 3` (`react/features/video-layout/functions.any.ts`). `getParticipantCount` does not count fake participants or virtual screenshare participants, so a participant that sends two video sources counts as one.
- `updateRemoteParticipants()` (`functions.any.ts`) skips reordering when the filmstrip does not scroll and no remote virtual screenshare participant exists. When one exists, the full reorder runs on each update and active-speaker promotion is live again. A test with only single-stream participants does not show this.
