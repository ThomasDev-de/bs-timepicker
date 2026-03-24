# bsTimepicker v1.0.2

`bsTimepicker` is a jQuery time picker plugin with a Bootstrap 5 styled trigger and dropdown UI. It supports 12-hour and 24-hour display modes, stores values in a database-friendly 24-hour format, and works with `input` and `div` elements.

The picker uses a circular clock-style selector inspired by mobile alarm/time picker interfaces while staying easy to drop into existing Bootstrap-based forms.

## Features

- jQuery plugin exposed as `$.fn.bsTimepicker`
- Bootstrap 5 styled trigger button and dropdown
- 12h and 24h display modes
- Database-friendly value handling via `val()`
- Supports `input` and `div` root elements
- Optional hidden field support with `nameField`
- Touch-friendly circular dial with pointer support
- Public API for show, hide, toggle, set, get, and value access
- Event hooks for initialization, visibility changes, and value changes
- Bootstrap Icons support for trigger, confirm, and cancel icons

## Requirements

- jQuery 3.x
- Bootstrap 5.x
- Bootstrap Icons for the default icons shown in the trigger and action buttons
- Bootstrap bundle JS must be loaded because the plugin uses the Bootstrap dropdown component

## Installation

Include your vendor assets and the plugin script.

```html
<link rel="stylesheet" href="vendor/twbs/bootstrap/dist/css/bootstrap.min.css">
<link rel="stylesheet" href="vendor/twbs/bootstrap-icons/font/bootstrap-icons.css">

<script src="vendor/components/jquery/jquery.min.js"></script>
<script src="vendor/twbs/bootstrap/dist/js/bootstrap.bundle.min.js"></script>
<script src="dist/bs-timepicker.js"></script>
```

## Quick start

### 24-hour input

```html
<input type="text" id="time24" value="07:15">
```

```javascript
$("#time24").bsTimepicker({
    format: "24h"
});
```

### 12-hour input

```html
<input type="text" id="time12" value="08:45 PM">
```

```javascript
$("#time12").bsTimepicker({
    format: "12h"
});
```

### Div with generated hidden field

```html
<div id="appointmentTime"></div>
```

```javascript
$("#appointmentTime").bsTimepicker({
    format: "24h",
    defaultTime: "13:20",
    nameField: "appointment_time",
    btnClass: "btn btn-outline-primary",
    btnWidth: "220px"
});
```

## Supported root elements

### Input

When initialized on an `input`, the original input becomes the internal value field and the visible trigger button is rendered after it.

This is the best choice when the value should already exist in a normal form field.

### Div

When initialized on a `div`, the plugin renders the trigger inside that element. If `nameField` is provided, a hidden input is created so the value can be submitted with a form.

## Value model

The plugin separates a display format from a stored value format.

- The UI may display either 12h or 24h time.
- The stored value is intended to be a 24-hour string in `HH:mm` format.
- Empty values are returned as `null` through `val()`.

Examples:

- Visible UI: `12:30 AM` → stored value: `00:30`
- Visible UI: `12:30 PM` → stored value: `12:30`
- Visible UI: `03:45 PM` → stored value: `15:45`

## Options

```json
{
    "format": "24h",
    "defaultTime": null,
    "nameField": null,
    "title": "Select time",
    "closeOnSelect": false,
    "btnClass": "btn btn-outline-secondary",
    "btnWidth": null,
    "btnEmptyText": "Select time",
    "icons": {
        "trigger": "bi bi-clock",
        "cancel": "bi bi-x-lg",
        "ok": "bi bi-check-lg"
    }
}
```

### `format`

Type: `string`

Allowed values:

- `"24h"`
- `"12h"`

Controls how the time is displayed in the picker and trigger.

### `defaultTime`

Type: `string | Date | object | null`

Examples:

- `"13:45"`
- `"01:45 PM"`
- `new Date()`
- `{ hour24: 13, minute: 45 }`

Used when no initial value is already present on the source element.

### `nameField`

Type: `string | null`

Only relevant when the plugin is initialized on a `div`. Creates a hidden input with the provided `name`.

### `title`

Type: `string | null`

Optional title is displayed at the top of the dropdown panel. Set it to `null` or an empty string to hide the title.

### `closeOnSelect`

Type: `boolean`

When `true`, the picker closes automatically after selecting minutes.

### `btnClass`

Type: `string`

Bootstrap classes are applied to the visible trigger button.

Example:

```javascript
btnClass: "btn btn-outline-primary"
```

### `btnWidth`

Type: `string | null`

Optional width for the trigger button.

Example:

```javascript
btnWidth: "220px"
```

### `btnEmptyText`

Type: `string`

Text shown in the trigger when no value is set.

### `icons`

Type: `object`

Controls the Bootstrap Icon classes used by the trigger and action buttons.

Example:

```json
{
    "icons": {
        "trigger": "bi bi-clock",
        "cancel": "bi bi-x-lg",
        "ok": "bi bi-check-lg"
    }
}
```

## Public API

### Initialize

```javascript
$("#time24").bsTimepicker({
    format: "24h"
});
```

### `getTime()`

Returns a structured object with display and normalized values.

```javascript
const data = $("#time24").bsTimepicker("getTime");
```

Example result:

```json
{
    "hour24": 13,
    "minute": 40,
    "hour12": 1,
    "meridiem": "PM",
    "formatted24": "13:40",
    "formatted12": "01:40 PM",
    "formatted": "13:40"
}
```

### `setTime(value)`

Sets the current time.

```javascript
$("#time24").bsTimepicker("setTime", "06:30");
$("#time12").bsTimepicker("setTime", "09:45 PM");
```

### `val()`

Returns the stored raw value as a string in `HH:mm` format, or `null` if empty.

```javascript
const raw = $("#time24").bsTimepicker("val");
```

Examples:

- `"06:30"`
- `"00:30"`
- `null`

### `val(value)`

Sets the stored value using a string.

```javascript
$("#time24").bsTimepicker("val", "12:30");
$("#time12").bsTimepicker("val", "12:30 PM");
$("#time24").bsTimepicker("val", "");
```

Passing `""` or `null` clears the value and restores the empty trigger label.

### `show()`

Opens the dropdown picker.

```javascript
$("#time24").bsTimepicker("show");
```

### `hide()`

Closes the dropdown picker.

```javascript
$("#time24").bsTimepicker("hide");
```

### `toggle()`

Toggles the dropdown picker.

```javascript
$("#time24").bsTimepicker("toggle");
```

### `destroy()`

Destroys the plugin instance and removes the generated UI.

```javascript
$("#time24").bsTimepicker("destroy");
```

## Events

The plugin can emit the following events on the original root element.

### Initialization and visibility

- `init.bs.timepicker`
- `show.bs.timepicker`
- `shown.bs.timepicker`
- `hide.bs.timepicker`
- `hidden.bs.timepicker`

### Value changes

- `change.bs.timepicker`
- `changeHour.bs.timepicker`
- `changeMinutes.bs.timepicker`
- `timeChange.bsTimepicker`

### Example

```javascript
$("#time24").on("shown.bs.timepicker", function (e, data) {
    console.log("Picker opened", data);
});

$("#time24").on("change.bs.timepicker", function (e, data) {
    console.log("Time changed", data);
});

$("#time24").on("changeHour.bs.timepicker", function (e, data) {
    console.log("Hour changed", data.hour24);
});

$("#time24").on("changeMinutes.bs.timepicker", function (e, data) {
    console.log("Minutes changed", data.minute);
});
```

## Database usage

For most applications, store the value returned by `val()`.

```javascript
const dbValue = $("#time24").bsTimepicker("val");
```

Typical values:

- `"06:30"`
- `"14:45"`
- `"00:05"`
- `null`

In most systems there is no need to store `AM` or `PM` separately. That is usually presentation logic only.

## Example form integration

### Input-based field

```html
<form>
    <input type="text" id="startTime" name="start_time" value="08:30">
</form>
```

```javascript
$("#startTime").bsTimepicker({
    format: "24h"
});
```

### Div-based field with hidden input

```html
<form>
    <div id="alarmTime"></div>
</form>
```

```javascript
$("#alarmTime").bsTimepicker({
    format: "12h",
    nameField: "alarm_time",
    btnEmptyText: "Please select a time"
});
```

## Notes

- `val()` is intended for the database-friendly raw value.
- `getTime()` is intended for richer UI information.
- The plugin currently works with hours and minutes, not seconds.
- If your backend uses a database `TIME` column with seconds, you can still store the returned value and append `:00` server-side if needed.

## Example demo setup

```html
<link rel="stylesheet" href="../vendor/twbs/bootstrap/dist/css/bootstrap.min.css">
<link rel="stylesheet" href="../vendor/twbs/bootstrap-icons/font/bootstrap-icons.css">

<script src="../vendor/components/jquery/jquery.min.js"></script>
<script src="../vendor/twbs/bootstrap/dist/js/bootstrap.bundle.min.js"></script>
<script src="../dist/bs-timepicker.js"></script>
```

## License

MIT License