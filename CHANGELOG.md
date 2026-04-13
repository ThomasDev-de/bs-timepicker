# Changelog

All notable changes to this project are documented in this file.

## [1.0.3] - 2026-04-13

### Added
- New options `showClearButton` and `clearLabel` for a configurable clear button in the dropdown.
- New public method `clear()` to explicitly reset the value to empty.
- New event `clear.bs.timepicker`, triggered when a value is cleared.
- New `isEmpty` field in the `getTime()` return object.
- New configuration options `okLabel` and `cancelLabel` with HTML support (for example, icon + text combinations).
- New `_confirmed` state flag to distinguish explicit confirmation from cancel/close actions (for example, clicking outside).
- Support for reverting to the original time when the picker is closed without confirmation.
- Automatic storage of `originalState` when opening the picker.

### Changed
- `btnEmptyText` now defaults to `--:--` instead of `Select time`.
- Empty state is now tracked internally as a dedicated state (`hasValue`), so `getTime()` returns consistent `null` fields when empty.
- `changeHour.bs.timepicker` and `changeMinutes.bs.timepicker` now also react to transitions between empty and set states.
- **Design update:** the timepicker UI was made more compact.
- Dropdown width was reduced from `360px` to `260px`.
- Dial size was reduced from `280px` to `220px`.
- Internal radii, coordinates, and font sizes were adjusted proportionally.
- `icons.ok` and `icons.cancel` options were removed. Icons are now part of `okLabel` and `cancelLabel` defaults.
- AM/PM toggle styling in 12h mode was refined for the compact layout.
- `closeOnSelect` now correctly marks selections as confirmed.

### Deprecated
- Configuration via `icons.ok` and `icons.cancel` is no longer supported. Use `okLabel` and `cancelLabel` instead.
