(function(global) {
    var CueMate = global.CueMate || (global.CueMate = {});
    var ui = CueMate.ui;
    var timer = CueMate.timer;
    var storage = global.StorageManager || (CueMate.StorageManager || null);
    var autoSaveTimer = null;
    var activeShowName = null;

    function loadScript() {
        var elements = ui.getElements();
        var cues = CueMate.parseCueScript(elements.scriptInput.value);
        timer.setCues(cues);
        render();
        return cues.length;
    }

    function render() {
        var state = timer.getState();
        ui.render(state);
        syncControlButtons(state);
    }

    function start() {
        var cueCount = loadScript();

        if (!cueCount) {
            return;
        }

        timer.start();
        render();
    }

    function togglePause() {
        var pauseButton = document.getElementById('pauseBtn');
        if (timer.isRunning()) {
            timer.pause();
        } else {
            timer.start();
        }

        render();
    }

    function reset() {
        if (timer.getElapsedSeconds() > 0 && !window.confirm('Reset the current show?')) {
            return;
        }

        timer.reset();
        render();
    }

    function adjust(deltaSeconds) {
        timer.adjust(deltaSeconds);
    }

    function setActiveShow(name) {
        activeShowName = name;
        var showNameElement = document.getElementById('showName');
        if (showNameElement) {
            showNameElement.dataset.showName = name || '';
            showNameElement.textContent = name || 'Nincs betöltött műsor';
        }
        refreshShowList();
    }

    function refreshShowList() {
        var showList = document.getElementById('showList');
        var shows = storage.getShows();
        var lastShow = storage.getLastShow();
        showList.innerHTML = '';

        if (!shows.length) {
            var emptyItem = document.createElement('div');
            emptyItem.className = 'showItem emptyState';
            emptyItem.textContent = 'No saved shows';
            showList.appendChild(emptyItem);
            return;
        }

        shows.forEach(function(show) {
            var row = document.createElement('div');
            row.className = 'showRow';

            var item = document.createElement('button');
            item.type = 'button';
            item.className = 'showItem' + (activeShowName && show.name === activeShowName ? ' active' : '');
            item.textContent = show.name;
            item.dataset.showName = show.name;
            item.addEventListener('click', function() {
                loadShow(show.name);
            });
            row.appendChild(item);

            var menuButton = document.createElement('button');
            menuButton.type = 'button';
            menuButton.className = 'showMenuBtn';
            menuButton.textContent = '⋮';
            menuButton.setAttribute('aria-label', 'Show actions');
            menuButton.addEventListener('click', function(event) {
                event.stopPropagation();
                toggleShowMenu(show.name, menuButton);
            });
            row.appendChild(menuButton);

            showList.appendChild(row);
        });

        if (activeShowName && shows.some(function(show) { return show.name === activeShowName; })) {
            return;
        }

        if (lastShow) {
            var preferredShow = shows.find(function(show) { return show.name === lastShow; });
            if (preferredShow) {
                loadShow(preferredShow.name, true);
            }
        }
    }

    function saveCurrentShow() {
        if (!activeShowName) {
            return;
        }

        var elements = ui.getElements();
        storage.saveShow(activeShowName, elements.scriptInput.value);
    }

    function scheduleAutoSave() {
        if (autoSaveTimer) {
            window.clearTimeout(autoSaveTimer);
        }
        autoSaveTimer = window.setTimeout(function() {
            saveCurrentShow();
        }, 1000);
    }

    function createNewShow() {
        var proposedName = 'New Show';
        var showName = window.prompt('Show neve:', proposedName);
        if (!showName) {
            return;
        }

        var trimmedName = showName.trim();
        if (!trimmedName) {
            return;
        }

        storage.saveShow(trimmedName, '');
        loadShow(trimmedName, true);
    }

    function loadShow(name, silent) {
        var loadedShow = storage.loadShow(name);
        if (!loadedShow) {
            return;
        }

        var elements = ui.getElements();
        elements.scriptInput.value = loadedShow.script || '';
        loadScript();
        setActiveShow(loadedShow.name);
        if (!silent) {
            document.getElementById('showName').textContent = loadedShow.name;
        }
    }

    function closeShowMenus() {
        var openMenus = document.querySelectorAll('.showMenuPopup.open');
        Array.prototype.forEach.call(openMenus, function(menu) {
            menu.classList.remove('open');
        });
    }

    function toggleShowMenu(showName, triggerButton) {
        closeShowMenus();

        var existingMenu = triggerButton.parentNode.querySelector('.showMenuPopup');
        if (existingMenu && existingMenu.classList.contains('open')) {
            existingMenu.classList.remove('open');
            return;
        }

        var popup = document.createElement('div');
        popup.className = 'showMenuPopup';

        function addAction(label, icon, action) {
            var actionButton = document.createElement('button');
            actionButton.type = 'button';
            actionButton.className = 'showMenuAction';
            actionButton.innerHTML = '<span class="showMenuIcon">' + icon + '</span><span>' + label + '</span>';
            actionButton.addEventListener('click', function(event) {
                event.stopPropagation();
                action();
                closeShowMenus();
            });
            popup.appendChild(actionButton);
        }

        addAction('Rename', '✏️', function() {
            var newName = window.prompt('Új név:', showName);
            if (!newName) {
                return;
            }
            var trimmedNewName = newName.trim();
            if (!trimmedNewName) {
                return;
            }
            var renamedShow = storage.renameShow(showName, trimmedNewName);
            if (renamedShow) {
                if (activeShowName === showName) {
                    setActiveShow(renamedShow.name);
                }
                refreshShowList();
            }
        });

        addAction('Duplicate', '📄', function() {
            var duplicateName = showName + ' Copy';
            var duplicatedShow = storage.saveShow(duplicateName, storage.loadShow(showName).script || '');
            if (duplicatedShow) {
                loadShow(duplicatedShow.name, true);
            }
        });

        addAction('Delete', '🗑️', function() {
            if (window.confirm('Delete show \'' + showName + '\' ?')) {
                storage.deleteShow(showName);
                if (activeShowName === showName) {
                    setActiveShow(null);
                    var elements = ui.getElements();
                    elements.scriptInput.value = '';
                    loadScript();
                    document.getElementById('showName').textContent = 'Nincs betöltött műsor';
                }
                refreshShowList();
            }
        });

        addAction('Cancel', '✖️', function() {});

        triggerButton.parentNode.appendChild(popup);
        popup.classList.add('open');
    }

    function syncSidebarState() {
        var toggleButton = document.getElementById('toggleSidebarBtn');
        var sidebar = document.getElementById('showSidebar');
        if (!toggleButton || !sidebar) {
            return;
        }

        if (window.innerWidth > 900) {
            sidebar.classList.remove('collapsed');
            toggleButton.style.display = 'none';
            return;
        }

        toggleButton.style.display = '';
    }

    function syncControlButtons(state) {
        var startButton = document.getElementById('startBtn');
        var pauseButton = document.getElementById('pauseBtn');
        if (!startButton || !pauseButton) {
            return;
        }

        var hasBegun = !!(state && (state.isRunning || state.elapsedSeconds > 0));
        startButton.style.display = hasBegun ? 'none' : '';
        pauseButton.textContent = state && state.isRunning ? 'Pause' : 'Resume';
    }

    function bindEvents() {
        var elements = ui.getElements();
        document.getElementById('startBtn').addEventListener('click', function() {
            start();
        });
        document.getElementById('pauseBtn').addEventListener('click', function() {
            togglePause();
        });
        document.getElementById('resetBtn').addEventListener('click', function() {
            reset();
        });
        document.getElementById('minus5').addEventListener('click', function() {
            adjust(-5);
        });
        document.getElementById('minus1').addEventListener('click', function() {
            adjust(-1);
        });
        document.getElementById('plus1').addEventListener('click', function() {
            adjust(1);
        });
        document.getElementById('plus5').addEventListener('click', function() {
            adjust(5);
        });
        document.getElementById('newShowBtn').addEventListener('click', function() {
            createNewShow();
        });
        document.getElementById('toggleSidebarBtn').addEventListener('click', function() {
            if (window.innerWidth > 900) {
                return;
            }

            var sidebar = document.getElementById('showSidebar');
            if (sidebar) {
                sidebar.classList.toggle('collapsed');
            }
        });
        elements.scriptInput.addEventListener('input', function() {
            if (!timer.isRunning()) {
                loadScript();
            }
            scheduleAutoSave();
        });
        elements.scriptInput.addEventListener('keydown', function(event) {
            if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                loadScript();
            }
        });
    }

    document.addEventListener('DOMContentLoaded', function() {
        timer.setOnTick(function() {
            render();
        });
        bindEvents();
        syncSidebarState();
        window.addEventListener('resize', function() {
            syncSidebarState();
            closeShowMenus();
        });
        document.addEventListener('click', function() {
            closeShowMenus();
        });
        refreshShowList();
        var lastShowName = storage.getLastShow();
        if (lastShowName) {
            loadShow(lastShowName, true);
        }
        render();
        document.getElementById('pauseBtn').textContent = 'Pause';
    });
})(window);
