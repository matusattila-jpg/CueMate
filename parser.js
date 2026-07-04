(function(global) {
    function toSeconds(minutes, seconds) {
        return parseInt(minutes, 10) * 60 + parseInt(seconds, 10);
    }

    function parseCueLine(line) {
        var trimmed = (line || '').trim();
        if (!trimmed) {
            return null;
        }

        var match = trimmed.match(/^(\d{1,2}):(\d{2})\s+(.+)$/);
        if (!match) {
            return null;
        }

        return {
            timestamp: toSeconds(match[1], match[2]),
            label: match[3].trim()
        };
    }

    function mergeCueEvents(events) {
        return events.reduce(function(mergedEvents, event) {
            if (!event) {
                return mergedEvents;
            }

            var previousEvent = mergedEvents[mergedEvents.length - 1];
            if (previousEvent && previousEvent.timestamp === event.timestamp) {
                previousEvent.labels.push(event.label);
                previousEvent.label = previousEvent.labels.join(' / ');
                return mergedEvents;
            }

            mergedEvents.push({
                timestamp: event.timestamp,
                label: event.label,
                labels: [event.label]
            });

            return mergedEvents;
        }, []);
    }

    function parseCueScript(scriptText) {
        if (!scriptText) {
            return [];
        }

        var cueEvents = scriptText
            .split(/\r?\n/)
            .map(parseCueLine)
            .filter(Boolean);

        return mergeCueEvents(cueEvents).map(function(event) {
            return {
                timestamp: event.timestamp,
                label: event.label
            };
        });
    }

    function formatTime(totalSeconds) {
        var safeSeconds = Math.max(0, Math.floor(totalSeconds));
        var minutes = Math.floor(safeSeconds / 60);
        var seconds = safeSeconds % 60;
        return String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
    }

    function parseTimestamp(value) {
        var trimmed = (value || '').trim();
        if (!trimmed) {
            return null;
        }

        var match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
        if (!match) {
            return null;
        }

        return toSeconds(match[1], match[2]);
    }

    global.CueMate = global.CueMate || {};
    global.CueMate.parseCueLine = parseCueLine;
    global.CueMate.parseCueScript = parseCueScript;
    global.CueMate.mergeCueEvents = mergeCueEvents;
    global.CueMate.formatTime = formatTime;
    global.CueMate.parseTimestamp = parseTimestamp;
})(window);
