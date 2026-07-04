(function(global) {
    var CueMate = global.CueMate || (global.CueMate = {});

    function getElements() {
        if (CueMate._elements) {
            return CueMate._elements;
        }

        CueMate._elements = {
            showName: document.getElementById('showName'),
            elapsed: document.getElementById('elapsed'),
            previousCue: document.getElementById('previousCue'),
            currentCue: document.getElementById('currentCue'),
            currentCard: document.getElementById('currentCard'),
            countdown: document.getElementById('countdown'),
            nextCue: document.getElementById('nextCue'),
            nextCountdown: document.getElementById('nextCountdown'),
            progressInner: document.getElementById('progressInner'),
            scriptInput: document.getElementById('scriptInput')
        };

        return CueMate._elements;
    }

    function getProgressPercent(state) {
        var cueState = state.cueState || {};
        var previousCue = cueState.previousCue;
        var currentCue = cueState.currentCue;
        var elapsedSeconds = state.elapsedSeconds || 0;

        if (!currentCue) {
            return 0;
        }

        if (!previousCue) {
            if (currentCue.timestamp <= 0) {
                return 100;
            }

            var startProgress = elapsedSeconds / currentCue.timestamp * 100;
            return Math.max(0, Math.min(100, startProgress));
        }

        var duration = currentCue.timestamp - previousCue.timestamp;
        if (duration <= 0) {
            return 100;
        }

        var progress = (elapsedSeconds - previousCue.timestamp) / duration * 100;
        return Math.max(0, Math.min(100, progress));
    }

    function getProgressColor(cueState) {
        if (!cueState || !cueState.currentCue) {
            return '#00ff66';
        }

        if (cueState.remainingSeconds < 3) {
            return '#ff3b30';
        }

        if (cueState.remainingSeconds <= 5) {
            return '#ffb000';
        }

        return '#00ff66';
    }

    function render(state) {
        var elements = getElements();
        var cueState = state.cueState || {};
        var showName = elements.showName.dataset.showName || (state.cues && state.cues.length ? 'Műsor betöltve' : 'Nincs betöltött műsor');

        elements.showName.textContent = showName;
        elements.previousCue.textContent = cueState.previousCue ? cueState.previousCue.label : '—';
        elements.currentCue.textContent = cueState.currentCue ? cueState.currentCue.label : 'Várakozás...';
        elements.nextCue.textContent = cueState.nextCue ? cueState.nextCue.label : '—';
        elements.elapsed.textContent = CueMate.formatTime(state.elapsedSeconds);
        elements.countdown.textContent = cueState.currentCue ? CueMate.formatTime(cueState.remainingSeconds) : '00:00';
        elements.nextCountdown.textContent = cueState.nextCue ? CueMate.formatTime(Math.max(0, cueState.nextCue.timestamp - state.elapsedSeconds)) : '--';
        elements.progressInner.style.width = getProgressPercent(state) + '%';
        elements.progressInner.style.backgroundColor = getProgressColor(cueState);

        elements.currentCard.classList.toggle('blinkSlow', !!cueState.currentCue && cueState.remainingSeconds <= 5 && cueState.remainingSeconds > 3);
        elements.currentCard.classList.toggle('blinkFast', !!cueState.currentCue && cueState.remainingSeconds <= 3 && cueState.remainingSeconds > 0);
        elements.currentCard.classList.toggle('ready', !!cueState.currentCue);
    }

    CueMate.ui = {
        render: render,
        getElements: getElements
    };
})(window);
