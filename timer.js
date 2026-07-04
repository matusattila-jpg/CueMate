(function(global) {
    var CueMate = global.CueMate || (global.CueMate = {});
    var requestFrame = global.requestAnimationFrame || function(callback) {
        return global.setTimeout(function() {
            callback(performance.now());
        }, 1000 / 60);
    };
    var cancelFrame = global.cancelAnimationFrame || global.clearTimeout;

    function getCueState(cues, elapsedSeconds) {
        if (!cues || !cues.length) {
            return {
                previousCue: null,
                currentCue: null,
                nextCue: null,
                remainingSeconds: 0
            };
        }

        var currentIndex = -1;
        for (var i = 0; i < cues.length; i += 1) {
            if (cues[i].timestamp >= elapsedSeconds) {
                currentIndex = i;
                break;
            }
        }

        if (currentIndex === -1) {
            currentIndex = cues.length - 1;
        }

        return {
            previousCue: currentIndex > 0 ? cues[currentIndex - 1] : null,
            currentCue: cues[currentIndex] || null,
            nextCue: cues[currentIndex + 1] || null,
            remainingSeconds: cues[currentIndex] ? Math.max(0, cues[currentIndex].timestamp - elapsedSeconds) : 0,
            currentIndex: currentIndex
        };
    }

    function createTimerController() {
        var state = {
            cues: [],
            elapsedSeconds: 0,
            baseElapsedSeconds: 0,
            isRunning: false,
            rafId: null,
            startedAtMs: null,
            onTick: null
        };

        function cancelLoop() {
            if (state.rafId !== null) {
                cancelFrame(state.rafId);
                state.rafId = null;
            }
        }

        function getElapsedSeconds() {
            if (!state.isRunning || state.startedAtMs === null) {
                return state.baseElapsedSeconds;
            }

            return state.baseElapsedSeconds + (performance.now() - state.startedAtMs) / 1000;
        }

        function setElapsedSeconds(elapsedSeconds) {
            state.baseElapsedSeconds = elapsedSeconds;
            state.elapsedSeconds = elapsedSeconds;
            state.startedAtMs = state.isRunning ? performance.now() : null;
            return state.elapsedSeconds;
        }

        function tick() {
            state.elapsedSeconds = getElapsedSeconds();
            if (state.onTick) {
                state.onTick(state.elapsedSeconds);
            }
            state.rafId = requestFrame(tick);
        }

        return {
            setCues: function(cues) {
                cancelLoop();
                state.cues = cues || [];
                state.isRunning = false;
                state.startedAtMs = null;
                state.baseElapsedSeconds = 0;
                state.elapsedSeconds = 0;

                if (state.onTick) {
                    state.onTick(0);
                }
            },
            start: function() {
                if (!state.cues.length) {
                    return false;
                }

                if (!state.isRunning) {
                    state.isRunning = true;
                    state.startedAtMs = performance.now();
                    state.rafId = requestFrame(tick);
                }

                return true;
            },
            pause: function() {
                if (!state.isRunning) {
                    return;
                }

                state.baseElapsedSeconds = getElapsedSeconds();
                state.elapsedSeconds = state.baseElapsedSeconds;
                state.isRunning = false;
                state.startedAtMs = null;
                cancelLoop();

                if (state.onTick) {
                    state.onTick(state.elapsedSeconds);
                }
            },
            reset: function() {
                cancelLoop();
                state.isRunning = false;
                state.baseElapsedSeconds = 0;
                state.elapsedSeconds = 0;
                state.startedAtMs = null;

                if (state.onTick) {
                    state.onTick(0);
                }
            },
            adjust: function(deltaSeconds) {
                var nextElapsed = Math.max(0, getElapsedSeconds() + deltaSeconds);
                setElapsedSeconds(nextElapsed);

                if (state.onTick) {
                    state.onTick(state.elapsedSeconds);
                }

                return state.elapsedSeconds;
            },
            getState: function() {
                var elapsedSeconds = getElapsedSeconds();
                return {
                    cues: state.cues,
                    elapsedSeconds: elapsedSeconds,
                    isRunning: state.isRunning,
                    cueState: getCueState(state.cues, elapsedSeconds)
                };
            },
            isRunning: function() {
                return state.isRunning;
            },
            setOnTick: function(callback) {
                state.onTick = callback;
            },
            getCues: function() {
                return state.cues;
            },
            getElapsedSeconds: function() {
                return getElapsedSeconds();
            }
        };
    }

    CueMate.createTimerController = createTimerController;
    CueMate.timer = createTimerController();
    CueMate.getCueState = getCueState;
})(window);
