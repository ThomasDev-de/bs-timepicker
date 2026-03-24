/**
 * @version 1.0.2
 */
(function ($) {
    "use strict";

    const PLUGIN_NAME = "bsTimepicker";

    const DEFAULTS = {
        format: "24h",
        defaultTime: null,
        nameField: null,
        title: "Select time",
        closeOnSelect: false,
        btnClass: "btn btn-outline-secondary",
        btnWidth: null,
        btnEmptyText: "Select time",
        icons: {
            trigger: "bi bi-clock",
            cancel: "bi bi-x-lg",
            ok: "bi bi-check-lg"
        }
    };

    function pad(num) {
        return String(num).padStart(2, "0");
    }

    function parseTime(value) {
        if (value == null) return null;

        if (value instanceof Date) {
            return {
                hour24: value.getHours(),
                minute: value.getMinutes()
            };
        }

        if (typeof value === "object" && value.hour24 != null && value.minute != null) {
            return {
                hour24: Math.max(0, Math.min(23, parseInt(value.hour24, 10) || 0)),
                minute: Math.max(0, Math.min(59, parseInt(value.minute, 10) || 0))
            };
        }

        const str = String(value).trim().toUpperCase();

        let m;

        // 24h: HH:mm
        m = str.match(/^(\d{1,2}):(\d{2})$/);
        if (m) {
            const h = parseInt(m[1], 10);
            const min = parseInt(m[2], 10);

            if (h >= 0 && h <= 23 && min >= 0 && min <= 59) {
                return { hour24: h, minute: min };
            }
        }

        // 24h: HH:mm:ss
        m = str.match(/^(\d{1,2}):(\d{2}):(\d{2})$/);
        if (m) {
            const h = parseInt(m[1], 10);
            const min = parseInt(m[2], 10);
            const sec = parseInt(m[3], 10);

            if (h >= 0 && h <= 23 && min >= 0 && min <= 59 && sec >= 0 && sec <= 59) {
                return { hour24: h, minute: min };
            }
        }

        // 12h: h:mm AM/PM
        m = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
        if (m) {
            let h = parseInt(m[1], 10);
            const min = parseInt(m[2], 10);
            const meridiem = m[3];

            if (h >= 1 && h <= 12 && min >= 0 && min <= 59) {
                if (meridiem === "AM") {
                    h = h === 12 ? 0 : h;
                } else {
                    h = h === 12 ? 12 : h + 12;
                }

                return { hour24: h, minute: min };
            }
        }

        // 12h: h:mm:ss AM/PM
        m = str.match(/^(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)$/);
        if (m) {
            let h = parseInt(m[1], 10);
            const min = parseInt(m[2], 10);
            const sec = parseInt(m[3], 10);
            const meridiem = m[4];

            if (h >= 1 && h <= 12 && min >= 0 && min <= 59 && sec >= 0 && sec <= 59) {
                if (meridiem === "AM") {
                    h = h === 12 ? 0 : h;
                } else {
                    h = h === 12 ? 12 : h + 12;
                }

                return { hour24: h, minute: min };
            }
        }

        return null;
    }

    function formatTime(hour24, minute, format) {
        if (format === "12h") {
            const meridiem = hour24 >= 12 ? "PM" : "AM";
            let h = hour24 % 12;
            if (h === 0) h = 12;
            return `${pad(h)}:${pad(minute)} ${meridiem}`;
        }
        return `${pad(hour24)}:${pad(minute)}`;
    }

    function displayHour(hour24, format) {
        if (format === "12h") {
            let h = hour24 % 12;
            if (h === 0) h = 12;
            return pad(h);
        }
        return pad(hour24);
    }

    function getMeridiem(hour24) {
        return hour24 >= 12 ? "PM" : "AM";
    }

    function makeHour24From12(hour12, meridiem) {
        let h = parseInt(hour12, 10);
        if (meridiem === "AM") {
            return h === 12 ? 0 : h;
        }
        return h === 12 ? 12 : h + 12;
    }
    BsTimepicker.prototype._renderTriggerLabel = function (value) {
        const text = value == null || value === "" ? this.options.btnEmptyText : value;

        if (this.$triggerText && this.$triggerText.length) {
            this.$triggerText.text(text);
        } else if (this.$trigger && this.$trigger.length) {
            this.$trigger.text(text);
        }
    };
    function BsTimepicker(element, options) {
        this.$root = $(element);
        this.options = $.extend({}, DEFAULTS, options);

        this.isInput = this.$root.is("input");
        this.isButton = this.$root.is("button");
        this.isDiv = this.$root.is("div");

        if (!this.isInput && !this.isButton && !this.isDiv) {
            throw new Error("bsTimepicker unterstützt nur input, button oder div.");
        }

        this.uid = Math.random().toString(36).slice(2, 10);
        this.view = "hour";
        this.isOpen = false;

        this.$triggerText = null;
        this.$dropdownWrap = null;
        this.$panel = null;
        this.$trigger = null;
        this.$valueField = null;
        this.$hourBtn = null;
        this.$minuteBtn = null;
        this.$items = null;
        this.$meridiemWrap = null;
        this.$hand = null;
        this.$dial = null;
        this.dropdownInstance = null;

        this._pointerDragging = false;
        this._pointerId = null;

        const rawInitial = this._readInitialRawValue();

        this._render();
        this._mountIntoDom();
        this._initBootstrapDropdown();
        this._bindBase();

        const parsedInitial = parseTime(this.options.defaultTime) || parseTime(rawInitial);

        this.state = parsedInitial ? {
            hour24: parsedInitial.hour24,
            minute: parsedInitial.minute
        } : {
            hour24: 12,
            minute: 0
        };

        if (parsedInitial) {
            this._syncToField(false);
        } else {
            this._renderTriggerLabel("");
            this._writeRawValue("");
        }

        this._refreshHeader();
        this._renderDial();
        this.$root.trigger("init.bs.timepicker", [this.getTime()]);
    }

    BsTimepicker.prototype._readInitialRawValue = function () {
        if (this.isInput) {
            return this.$root.val() || null;
        }

        if (this.isButton) {
            return $.trim(this.$root.text()) || null;
        }

        if (this.isDiv) {
            return $.trim(this.$root.text()) || null;
        }

        return null;
    };

    BsTimepicker.prototype._render = function () {
        const panelId = `bs-timepicker-panel-${this.uid}`;
        const widthStyle = this.options.btnWidth != null ? `width:${this.options.btnWidth};` : "";
        let title = "";
        if (this.options.hasOwnProperty('title') && this.options.title !== null && this.options.title !== "") {
            title = `<div class="small d-block text-center text-body-secondary mb-2">${this.options.title}</div>`;
        }

        const html =
            `<div class="dropdown bs-timepicker-dropdown d-inline-block" style="${widthStyle}">
                <button type="button"
                        class="bs-timepicker-trigger ${this.options.btnClass}"
                        style="${widthStyle}"
                        data-bs-toggle="dropdown"
                        data-bs-auto-close="outside"
                        aria-expanded="false">
                    <span class="d-inline-flex align-items-center gap-2">
                        <i class="bs-tp-trigger-icon ${this.options.icons.trigger}"></i>
                        <span class="bs-tp-trigger-text"></span>
                    </span>
                </button>

                <div id="${panelId}"
                     class="dropdown-menu p-3 border-0 shadow rounded-4 bg-body"
                     style="width:360px;max-width:calc(100vw - 24px);">
                    
                    ${title}

                    <div class="d-flex align-items-center justify-content-center mb-1">
                        <div class="d-flex align-items-center">
                            <button type="button"
                                    class="bs-tp-select-hour btn border-0 rounded-4 d-flex align-items-center justify-content-center"
                                    style="width:68px;height:54px;padding:0;font-size:2rem;line-height:1;letter-spacing:-0.04em;box-shadow:none;">
                                07
                            </button>

                            <div class="d-flex align-items-center justify-content-center text-body"
                                 style="width:18px;height:84px;font-size:1.8rem;line-height:1;">
                                :
                            </div>

                            <button type="button"
                                    class="bs-tp-select-minute btn border-0 rounded-4 d-flex align-items-center justify-content-center"
                                    style="width:68px;height:54px;padding:0;font-size:2rem;line-height:1;letter-spacing:-0.04em;box-shadow:none;">
                                00
                            </button>
                        </div>

                        <div class="bs-tp-meridiem-wrap ms-2" style="width:56px;height:84px;"></div>
                    </div>

                    <div class="bs-tp-dial position-relative rounded-circle mx-auto"
                         style="width:280px;height:280px;overflow:hidden;touch-action:none;background:rgba(0,0,0,.035);">
                        
                        <div class="bs-tp-hand position-absolute top-50 start-50"
                             style="height:2px;width:0;transform:translateY(-50%);transform-origin:0 50%;background:var(--bs-primary);z-index:1;pointer-events:none;transition:transform 120ms ease,width 120ms ease;">
                        </div>

                        <div class="bs-tp-center-dot position-absolute top-50 start-50 translate-middle rounded-circle"
                             style="width:10px;height:10px;background:var(--bs-primary);z-index:3;">
                        </div>

                        <div class="bs-tp-items position-absolute top-0 start-0 w-100 h-100" style="z-index:2;"></div>
                    </div>

                    <div class="d-flex justify-content-end gap-3 mt-3">
                        <button type="button"
                                class="btn btn-link text-decoration-none p-0 bs-tp-cancel"
                                style="box-shadow:none;">
                            <i class="${this.options.icons.cancel}"></i>
                        </button>

                        <button type="button"
                                class="btn btn-link text-decoration-none p-0 bs-tp-ok"
                                style="box-shadow:none;">
                            <i class="${this.options.icons.ok}"></i>
                        </button>
                    </div>
                </div>
            </div>`;

        this.$dropdownWrap = $(html);
        this.$trigger = this.$dropdownWrap.find(".bs-timepicker-trigger");
        this.$triggerText = this.$trigger.find(".bs-tp-trigger-text");
        this.$panel = this.$dropdownWrap.find(".dropdown-menu");

        this.$hourBtn = this.$panel.find(".bs-tp-select-hour");
        this.$minuteBtn = this.$panel.find(".bs-tp-select-minute");
        this.$items = this.$panel.find(".bs-tp-items");
        this.$meridiemWrap = this.$panel.find(".bs-tp-meridiem-wrap");
        this.$hand = this.$panel.find(".bs-tp-hand");
        this.$dial = this.$panel.find(".bs-tp-dial");

        this.$panel.data(PLUGIN_NAME, this);

        this._renderMeridiem();
        this._bindPanel();
    };

    BsTimepicker.prototype._mountIntoDom = function () {
        if (this.isInput) {
            this.$root.attr("type", "hidden");
            this.$valueField = this.$root;
            this.$root.after(this.$dropdownWrap);
            return;
        }

        if (this.isDiv) {
            this.$root.empty().append(this.$dropdownWrap);

            if (this.options.nameField) {
                this.$valueField = $('<input type="hidden" class="bs-timepicker-hidden">')
                    .attr("name", this.options.nameField);
                this.$root.append(this.$valueField);
            }
            return;
        }

        if (this.isButton) {
            const originalText = $.trim(this.$root.text());
            const $placeholder = $('<span class="bs-timepicker-placeholder"></span>');

            this.$root.after($placeholder);

            this.$dropdownWrap.find(".bs-timepicker-trigger").replaceWith(this.$root);
            this.$trigger = this.$root;

            this.$trigger.attr({
                "data-bs-toggle": "dropdown",
                "data-bs-auto-close": "outside",
                "aria-expanded": "false"
            });

            if (this.options.btnWidth != null) {
                this.$trigger.css("width", this.options.btnWidth);
            }

            this.$trigger.addClass(this.options.btnClass);

            $placeholder.replaceWith(this.$dropdownWrap);

            if (this.options.nameField) {
                this.$valueField = $('<input type="hidden" class="bs-timepicker-hidden">')
                    .attr("name", this.options.nameField);
                this.$dropdownWrap.append(this.$valueField);
            }

            if (originalText && !this.options.defaultTime) {
                if (!parseTime(originalText)) {
                    this.options.btnEmptyText = originalText;
                }
            }
        }
    };

    BsTimepicker.prototype.val = function (value) {
        if (arguments.length === 0) {
            const raw = this._readRawValue();
            return raw == null || raw === "" ? null : raw;
        }

        if (value == null || value === "") {
            this._writeRawValue("");
            this._renderTriggerLabel("");
            return this;
        }

        return this.setTime(value);
    };

    BsTimepicker.prototype._initBootstrapDropdown = function () {
        if (!this.$trigger || !this.$trigger.length) return;

        if (typeof bootstrap === "undefined" || !bootstrap.Dropdown) {
            throw new Error("Bootstrap Dropdown ist nicht verfügbar. Bitte bootstrap.bundle.min.js laden.");
        }

        const self = this;

        this.dropdownInstance = bootstrap.Dropdown.getOrCreateInstance(this.$trigger[0], {
            autoClose: "outside"
        });

        this.$trigger.on(`show.bs.dropdown.${PLUGIN_NAME}`, function () {
            self.$root.trigger("show.bs.timepicker", [self.getTime()]);
        });

        this.$trigger.on(`shown.bs.dropdown.${PLUGIN_NAME}`, function () {
            self.isOpen = true;
            self.$root.trigger("shown.bs.timepicker", [self.getTime()]);
        });

        this.$trigger.on(`hide.bs.dropdown.${PLUGIN_NAME}`, function () {
            self.$root.trigger("hide.bs.timepicker", [self.getTime()]);
        });

        this.$trigger.on(`hidden.bs.dropdown.${PLUGIN_NAME}`, function () {
            self.isOpen = false;
            self.$root.trigger("hidden.bs.timepicker", [self.getTime()]);
        });
    };

    BsTimepicker.prototype._triggerChangeEvents = function (previousState) {
        const current = this.getTime();

        this.$root.trigger("change.bs.timepicker", [current]);

        if (!previousState || previousState.hour24 !== this.state.hour24) {
            this.$root.trigger("changeHour.bs.timepicker", [current]);
        }

        if (!previousState || previousState.minute !== this.state.minute) {
            this.$root.trigger("changeMinutes.bs.timepicker", [current]);
        }
    };

    BsTimepicker.prototype._renderMeridiem = function () {
        if (this.options.format !== "12h") {
            this.$meridiemWrap.empty().hide();
            return;
        }

        this.$meridiemWrap.show().html(
            '<div class="d-flex flex-column h-100 overflow-hidden rounded-4 border" style="border-color:rgba(0,0,0,.15) !important;">' +
            '<button type="button" class="btn border-0 rounded-0 flex-fill bs-tp-am" style="font-size:1rem;box-shadow:none;">AM</button>' +
            '<div style="height:1px;background:rgba(0,0,0,.15);"></div>' +
            '<button type="button" class="btn border-0 rounded-0 flex-fill bs-tp-pm" style="font-size:1rem;box-shadow:none;">PM</button>' +
            '</div>'
        );
    };

    BsTimepicker.prototype._bindBase = function () {
        const self = this;

        this.$trigger.on(`keydown.${PLUGIN_NAME}`, function (e) {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                self.show();
            }

            if (e.key === "Escape") {
                e.preventDefault();
                self.hide();
            }
        });
    };

    BsTimepicker.prototype._bindPanel = function () {
        const self = this;

        this.$hourBtn.on(`click.${PLUGIN_NAME}`, function (e) {
            e.preventDefault();
            self.view = "hour";
            self._refreshHeader();
            self._renderDial();
        });

        this.$minuteBtn.on(`click.${PLUGIN_NAME}`, function (e) {
            e.preventDefault();
            self.view = "minute";
            self._refreshHeader();
            self._renderDial();
        });

        this.$panel.on(`click.${PLUGIN_NAME}`, ".bs-tp-am", function (e) {
            e.preventDefault();

            const previousState = {
                hour24: self.state.hour24,
                minute: self.state.minute
            };

            const h12 = parseInt(displayHour(self.state.hour24, "12h"), 10);
            self.state.hour24 = makeHour24From12(h12, "AM");
            self._refreshHeader();
            self._syncToField(true, previousState);
        });

        this.$panel.on(`click.${PLUGIN_NAME}`, ".bs-tp-pm", function (e) {
            e.preventDefault();
            const previousState = {
                hour24: self.state.hour24,
                minute: self.state.minute
            };
            const h12 = parseInt(displayHour(self.state.hour24, "12h"), 10);
            self.state.hour24 = makeHour24From12(h12, "PM");
            self._refreshHeader();
            self._syncToField(false, previousState);
        });

        this.$panel.find(".bs-tp-cancel").on(`click.${PLUGIN_NAME}`, function (e) {
            e.preventDefault();
            self.hide();
        });

        this.$panel.find(".bs-tp-ok").on(`click.${PLUGIN_NAME}`, function (e) {
            e.preventDefault();
            self._syncToField(true);
            self.hide();
        });

        this._bindDialPointer();
    };

    BsTimepicker.prototype._bindDialPointer = function () {
        const self = this;

        if (!this.$dial || !this.$dial.length) return;

        this.$dial.off(`.${PLUGIN_NAME}.pointer`);

        this.$dial.on(`pointerdown.${PLUGIN_NAME}.pointer`, function (e) {
            if ($(e.target).closest("[data-value]").length) {
                return;
            }

            e.preventDefault();

            self._pointerDragging = true;
            self._pointerId = e.originalEvent.pointerId;

            if (this.setPointerCapture) {
                try {
                    this.setPointerCapture(self._pointerId);
                } catch (err) {}
            }

            self._updateFromPointerEvent(e, true);
        });

        this.$dial.on(`pointermove.${PLUGIN_NAME}.pointer`, function (e) {
            if (!self._pointerDragging) return;
            e.preventDefault();
            self._updateFromPointerEvent(e, false);
        });

        this.$dial.on(`pointerup.${PLUGIN_NAME}.pointer pointercancel.${PLUGIN_NAME}.pointer`, function (e) {
            if (!self._pointerDragging) return;

            e.preventDefault();
            self._updateFromPointerEvent(e, true);

            if (this.releasePointerCapture && self._pointerId != null) {
                try {
                    this.releasePointerCapture(self._pointerId);
                } catch (err) {}
            }

            self._pointerDragging = false;
            self._pointerId = null;

            if (self.view === "minute" && self.options.closeOnSelect) {
                self.hide();
            }
        });
    };

    BsTimepicker.prototype._updateFromPointerEvent = function (e, finalize) {
        const result = this._getDialValueFromPoint(e);
        if (!result) return;

        const previousState = {
            hour24: this.state.hour24,
            minute: this.state.minute
        };

        if (this.view === "hour") {
            if (this.options.format === "12h") {
                const meridiem = getMeridiem(this.state.hour24);
                this.state.hour24 = makeHour24From12(result.value, meridiem);
            } else {
                this.state.hour24 = result.value;
            }

            this._refreshHeader();
            this._renderDial();
            this._syncToField(false, previousState);

            if (finalize) {
                const self = this;
                setTimeout(function () {
                    self.view = "minute";
                    self._refreshHeader();
                    self._renderDial();
                }, 90);
            }
        } else {
            this.state.minute = result.value;
            this._refreshHeader();
            this._renderDial();
            this._syncToField(true, previousState);
        }
    };

    BsTimepicker.prototype._getDialValueFromPoint = function (e) {
        if (!this.$dial || !this.$dial.length) return null;

        const dialEl = this.$dial[0];
        const rect = dialEl.getBoundingClientRect();

        const x = e.originalEvent.clientX - rect.left;
        const y = e.originalEvent.clientY - rect.top;

        const cx = rect.width / 2;
        const cy = rect.height / 2;

        const dx = x - cx;
        const dy = y - cy;

        const distance = Math.sqrt(dx * dx + dy * dy);

        let angle = Math.atan2(dy, dx) * 180 / Math.PI;
        angle = angle + 90;
        if (angle < 0) angle += 360;

        const step = Math.round(angle / 30) % 12;

        if (this.view === "minute") {
            return {
                value: (step * 5) % 60,
                ring: "outer"
            };
        }

        if (this.options.format === "12h") {
            let hour12 = step;
            if (hour12 === 0) hour12 = 12;

            return {
                value: hour12,
                ring: "outer"
            };
        }

        const outerThreshold = rect.width * 0.30;

        if (distance < outerThreshold) {
            let innerHour = step + 12;
            if (innerHour === 24) innerHour = 12;

            return {
                value: innerHour,
                ring: "inner"
            };
        }

        return {
            value: step,
            ring: "outer"
        };
    };

    BsTimepicker.prototype._refreshHeader = function () {
        const activeBg = "rgba(var(--bs-primary-rgb), .18)";
        const inactiveBg = "rgba(0,0,0,.04)";
        const activeColor = "rgb(var(--bs-primary-rgb))";
        const inactiveColor = "var(--bs-body-color)";

        this.$hourBtn
            .text(displayHour(this.state.hour24, this.options.format))
            .css({
                background: this.view === "hour" ? activeBg : inactiveBg,
                color: this.view === "hour" ? activeColor : inactiveColor
            });

        this.$minuteBtn
            .text(pad(this.state.minute))
            .css({
                background: this.view === "minute" ? activeBg : inactiveBg,
                color: this.view === "minute" ? activeColor : inactiveColor
            });

        if (this.options.format === "12h") {
            const meridiem = getMeridiem(this.state.hour24);

            this.$panel.find(".bs-tp-am").css({
                background: meridiem === "AM" ? "rgba(var(--bs-primary-rgb), .20)" : "transparent",
                color: meridiem === "AM" ? "rgb(var(--bs-primary-rgb))" : "var(--bs-body-color)"
            });

            this.$panel.find(".bs-tp-pm").css({
                background: meridiem === "PM" ? "rgba(var(--bs-primary-rgb), .20)" : "transparent",
                color: meridiem === "PM" ? "rgb(var(--bs-primary-rgb))" : "var(--bs-body-color)"
            });
        }
    };

    BsTimepicker.prototype._renderDial = function () {
        this.$items.empty();

        const cx = 140;
        const cy = 140;
        const outerRadius = 102;
        const innerRadius = 66;
        const self = this;

        function polarToXY(position, total, radius) {
            const angle = ((position / total) * 360 - 90) * (Math.PI / 180);
            return {
                x: cx + radius * Math.cos(angle),
                y: cy + radius * Math.sin(angle)
            };
        }

        function setHand(position, total, radius) {
            const deg = (position / total) * 360 - 90;

            self.$hand.css({
                width: radius + "px",
                transform: `translateY(-50%) rotate(${deg}deg)`
            });

            self.$hand.find(".bs-tp-hand-tip").remove();

            const $tip = $('<div class="bs-tp-hand-tip position-absolute rounded-circle"></div>').css({
                right: "-10px",
                top: "50%",
                width: "20px",
                height: "20px",
                transform: "translateY(-50%)",
                background: "var(--bs-primary)",
                pointerEvents: "none"
            });

            self.$hand.append($tip);
        }

        function createNumber(config) {
            const pos = polarToXY(config.position, config.total, config.radius);

            const $el = $("<button>", {
                type: "button",
                class: "position-absolute border-0 rounded-circle",
                text: config.label,
                "data-value": config.value
            }).css({
                left: pos.x + "px",
                top: pos.y + "px",
                transform: "translate(-50%, -50%)",
                width: config.inner ? "34px" : "40px",
                height: config.inner ? "34px" : "40px",
                padding: 0,
                lineHeight: config.inner ? "34px" : "40px",
                fontSize: config.inner ? "0.82rem" : "0.95rem",
                boxShadow: "none",
                outline: "none",
                zIndex: 2
            });

            $el[0].style.setProperty(
                "background-color",
                config.active ? "var(--bs-primary)" : "transparent",
                "important"
            );

            $el[0].style.setProperty(
                "color",
                config.active ? "#ffffff" : "var(--bs-body-color)",
                "important"
            );

            $el.on(`pointerdown.${PLUGIN_NAME}`, function (e) {
                e.preventDefault();
                e.stopPropagation();
            });

            $el.on(`pointerup.${PLUGIN_NAME}`, function (e) {
                e.preventDefault();
                e.stopPropagation();
            });

            $el.on(`click.${PLUGIN_NAME}`, function (e) {
                e.preventDefault();
                e.stopPropagation();

                const value = parseInt($(this).attr("data-value"), 10);
                const previousState = {
                    hour24: self.state.hour24,
                    minute: self.state.minute
                };

                if (self.view === "hour") {
                    let nextHour24;

                    if (self.options.format === "12h") {
                        const meridiem = getMeridiem(self.state.hour24);
                        nextHour24 = makeHour24From12(value, meridiem);
                    } else {
                        nextHour24 = value;
                    }

                    self.state.hour24 = nextHour24;
                    self._refreshHeader();
                    self._syncToField(false, previousState);

                    if (self.options.format === "12h") {
                        const active12 = parseInt(displayHour(self.state.hour24, "12h"), 10);
                        setHand(active12 % 12, 12, outerRadius);
                    } else {
                        if (self.state.hour24 < 12) {
                            setHand(self.state.hour24, 12, outerRadius);
                        } else {
                            setHand(self.state.hour24 - 12, 12, innerRadius);
                        }
                    }

                    setTimeout(function () {
                        self.view = "minute";
                        self._refreshHeader();
                        self._renderDial();
                    }, 120);
                } else {
                    self.state.minute = value;
                    self._refreshHeader();
                    self._syncToField(true, previousState);

                    setHand(self.state.minute / 5, 12, outerRadius);

                    setTimeout(function () {
                        self._renderDial();

                        if (self.options.closeOnSelect) {
                            self.hide();
                        }
                    }, 120);
                }
            });

            self.$items.append($el);
        }

        if (this.view === "hour") {
            if (this.options.format === "12h") {
                const active12 = parseInt(displayHour(this.state.hour24, "12h"), 10);

                for (let i = 1; i <= 12; i++) {
                    createNumber({
                        label: String(i),
                        value: i,
                        active: active12 === i,
                        position: i % 12,
                        total: 12,
                        radius: outerRadius,
                        inner: false
                    });
                }

                setHand(active12 % 12, 12, outerRadius);
            } else {
                for (let i = 0; i < 12; i++) {
                    createNumber({
                        label: String(i),
                        value: i,
                        active: this.state.hour24 === i,
                        position: i,
                        total: 12,
                        radius: outerRadius,
                        inner: false
                    });
                }

                for (let i = 12; i < 24; i++) {
                    createNumber({
                        label: String(i),
                        value: i,
                        active: this.state.hour24 === i,
                        position: i - 12,
                        total: 12,
                        radius: innerRadius,
                        inner: true
                    });
                }

                if (this.state.hour24 < 12) {
                    setHand(this.state.hour24, 12, outerRadius);
                } else {
                    setHand(this.state.hour24 - 12, 12, innerRadius);
                }
            }
        } else {
            for (let i = 0; i < 60; i += 5) {
                createNumber({
                    label: pad(i),
                    value: i,
                    active: this.state.minute === i,
                    position: i / 5,
                    total: 12,
                    radius: outerRadius,
                    inner: false
                });
            }

            setHand(this.state.minute / 5, 12, outerRadius);
        }
    };

    BsTimepicker.prototype._readRawValue = function () {
        if (this.$valueField && this.$valueField.length) {
            const val = this.$valueField.val();
            return val == null || val === "" ? null : val;
        }

        if (this.$triggerText && this.$triggerText.length) {
            const text = $.trim(this.$triggerText.text());
            return text === "" || text === this.options.btnEmptyText ? null : text;
        }

        if (this.$trigger && this.$trigger.length) {
            const text = $.trim(this.$trigger.text());
            return text === "" || text === this.options.btnEmptyText ? null : text;
        }

        return null;
    };

    BsTimepicker.prototype._writeRawValue = function (value) {
        let rawValue = value;

        if (value != null && value !== "") {
            rawValue = formatTime(this.state.hour24, this.state.minute, "24h");
        }

        if (this.$valueField && this.$valueField.length) {
            this.$valueField.val(rawValue).trigger("change");
        }

        this.$root.data("time", rawValue);
        this.$root.trigger("change");
    };

    BsTimepicker.prototype._disableHandTransition = function () {
        if (!this.$hand || !this.$hand.length) return;
        this.$hand.css("transition", "none");
    };

    BsTimepicker.prototype._enableHandTransition = function () {
        if (!this.$hand || !this.$hand.length) return;
        this.$hand.css("transition", "transform 120ms ease,width 120ms ease");
    };

    BsTimepicker.prototype._syncToField = function (triggerSelectedEvent, previousState) {
        const value = formatTime(this.state.hour24, this.state.minute, this.options.format);

        this._renderTriggerLabel(value);
        this._writeRawValue(value);

        if (triggerSelectedEvent) {
            const payload = this.getTime();
            this.$root.trigger("timeChange.bsTimepicker", [payload]);

            if (typeof this._triggerChangeEvents === "function") {
                this._triggerChangeEvents(previousState);
            }
        }
    };

    BsTimepicker.prototype.show = function () {
        if (this.dropdownInstance) {
            this.dropdownInstance.show();
        }
    };

    BsTimepicker.prototype.hide = function () {
        if (this.dropdownInstance) {
            this.dropdownInstance.hide();
        }
    };

    BsTimepicker.prototype.toggle = function () {
        if (this.dropdownInstance) {
            this.dropdownInstance.toggle();
        }
    };

    BsTimepicker.prototype.setTime = function (value) {
        if (value == null || value === "") {
            this._writeRawValue("");
            this._renderTriggerLabel("");
            this.$root.trigger("change.bs.timepicker", [""]);
            return this;
        }

        const parsed = parseTime(value);
        if (!parsed) return this;

        const previousState = {
            hour24: this.state.hour24,
            minute: this.state.minute
        };

        this.state.hour24 = parsed.hour24;
        this.state.minute = parsed.minute;
        this._refreshHeader();
        this._renderDial();
        this._syncToField(true, previousState);

        return this;
    };

    BsTimepicker.prototype.getTime = function () {
        return {
            hour24: this.state.hour24,
            minute: this.state.minute,
            hour12: parseInt(displayHour(this.state.hour24, "12h"), 10),
            meridiem: getMeridiem(this.state.hour24),
            formatted24: formatTime(this.state.hour24, this.state.minute, "24h"),
            formatted12: formatTime(this.state.hour24, this.state.minute, "12h"),
            formatted: formatTime(this.state.hour24, this.state.minute, this.options.format)
        };
    };

    BsTimepicker.prototype.destroy = function () {
        this.hide();

        if (this.$trigger) {
            this.$trigger.off(`.${PLUGIN_NAME}`);
            this.$trigger.off(`shown.bs.dropdown.${PLUGIN_NAME}`);
            this.$trigger.off(`hidden.bs.dropdown.${PLUGIN_NAME}`);
        }

        if (this.$dial) {
            this.$dial.off(`.${PLUGIN_NAME}.pointer`);
        }

        if (this.$panel) {
            this.$panel.find("*").off(`.${PLUGIN_NAME}`);
            this.$panel.off(`.${PLUGIN_NAME}`);
        }

        if (this.dropdownInstance && this.dropdownInstance.dispose) {
            this.dropdownInstance.dispose();
        }

        if (this.isInput) {
            if (this.$dropdownWrap) this.$dropdownWrap.remove();
            this.$root.attr("type", "text");
        } else if (this.isDiv) {
            this.$root.empty();
        } else if (this.isButton) {
            if (this.$dropdownWrap) {
                this.$dropdownWrap.before(this.$trigger);
                this.$dropdownWrap.remove();
            }
        }

        if (this.$valueField && this.$valueField.length && this.$valueField[0] !== this.$root[0]) {
            this.$valueField.remove();
        }

        this.$root.removeData(PLUGIN_NAME);
    };

    $.fn.bsTimepicker = function (option) {
        const args = Array.prototype.slice.call(arguments, 1);
        let returnValue = this;

        this.each(function () {
            const $this = $(this);
            let instance = $this.data(PLUGIN_NAME);

            if (!instance) {
                if (typeof option === "string") {
                    throw new Error("bsTimepicker ist nicht initialisiert.");
                }
                instance = new BsTimepicker(this, option);
                $this.data(PLUGIN_NAME, instance);
            }

            if (typeof option === "string") {
                if (typeof instance[option] !== "function") {
                    throw new Error(`Methode "${option}" existiert nicht in ${PLUGIN_NAME}.`);
                }

                const result = instance[option].apply(instance, args);

                if (result !== undefined && result !== instance) {
                    returnValue = result;
                    return false;
                }
            }
        });

        return returnValue;
    };
})(jQuery);