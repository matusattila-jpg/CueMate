(function(global) {
    var STORAGE_KEY = 'cuemate_shows';
    var LEGACY_STORAGE_KEY = 'cueMate.shows';
    var LAST_SHOW_KEY = 'cueMate.lastShow';
    var storageApi = global.localStorage;

    function getStorage() {
        return storageApi || null;
    }

    function writeStoredShows(showsByName) {
        var storage = getStorage();
        if (!storage) {
            return;
        }

        storage.setItem(STORAGE_KEY, JSON.stringify(showsByName));
    }

    function normalizeName(name) {
        return String(name || '').trim();
    }

    function readStoredShows() {
        var storage = getStorage();
        if (!storage) {
            return {};
        }

        try {
            var storedValue = storage.getItem(STORAGE_KEY);
            if (storedValue) {
                var parsed = JSON.parse(storedValue);
                if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                    return parsed;
                }
            }

            var legacyStoredValue = storage.getItem(LEGACY_STORAGE_KEY);
            if (!legacyStoredValue) {
                return {};
            }

            var legacyParsed = JSON.parse(legacyStoredValue);
            var migratedShows = {};
            if (Array.isArray(legacyParsed)) {
                legacyParsed.forEach(function(show) {
                    if (show && show.name) {
                        migratedShows[show.name] = show.script || '';
                    }
                });
            }

            if (Object.keys(migratedShows).length) {
                writeStoredShows(migratedShows);
                storage.removeItem(LEGACY_STORAGE_KEY);
            }

            return migratedShows;
        } catch (error) {
            return {};
        }
    }

    function getShowNames() {
        return Object.keys(readStoredShows()).sort(function(left, right) {
            return left.localeCompare(right);
        });
    }

    var StorageManager = {
        getShows: function() {
            var showsByName = readStoredShows();
            return getShowNames().map(function(name) {
                return {
                    name: name,
                    script: showsByName[name] || ''
                };
            });
        },
        saveShow: function(name, scriptText) {
            var trimmedName = normalizeName(name);
            if (!trimmedName) {
                return null;
            }

            var showsByName = readStoredShows();
            showsByName[trimmedName] = scriptText || '';
            writeStoredShows(showsByName);
            StorageManager.setLastShow(trimmedName);
            return {
                name: trimmedName,
                script: showsByName[trimmedName]
            };
        },
        loadShow: function(name) {
            var trimmedName = normalizeName(name);
            if (!trimmedName) {
                return null;
            }

            var showsByName = readStoredShows();
            if (!Object.prototype.hasOwnProperty.call(showsByName, trimmedName)) {
                return null;
            }

            StorageManager.setLastShow(trimmedName);
            return {
                name: trimmedName,
                script: showsByName[trimmedName] || ''
            };
        },
        deleteShow: function(name) {
            var trimmedName = normalizeName(name);
            if (!trimmedName) {
                return false;
            }

            var showsByName = readStoredShows();
            if (!Object.prototype.hasOwnProperty.call(showsByName, trimmedName)) {
                return false;
            }

            delete showsByName[trimmedName];
            writeStoredShows(showsByName);

            var lastShow = StorageManager.getLastShow();
            if (lastShow && lastShow.toLowerCase() === trimmedName.toLowerCase()) {
                var storage = getStorage();
                if (storage) {
                    storage.removeItem(LAST_SHOW_KEY);
                }
            }

            return true;
        },
        renameShow: function(oldName, newName) {
            var oldTrimmedName = normalizeName(oldName);
            var newTrimmedName = normalizeName(newName);
            if (!oldTrimmedName || !newTrimmedName || oldTrimmedName.toLowerCase() === newTrimmedName.toLowerCase()) {
                return null;
            }

            var showsByName = readStoredShows();
            if (!Object.prototype.hasOwnProperty.call(showsByName, oldTrimmedName)) {
                return null;
            }

            if (Object.prototype.hasOwnProperty.call(showsByName, newTrimmedName)) {
                return null;
            }

            showsByName[newTrimmedName] = showsByName[oldTrimmedName];
            delete showsByName[oldTrimmedName];
            writeStoredShows(showsByName);
            StorageManager.setLastShow(newTrimmedName);
            return {
                name: newTrimmedName,
                script: showsByName[newTrimmedName] || ''
            };
        },
        getShowNames: function() {
            return getShowNames();
        },
        getLastShow: function() {
            var storage = getStorage();
            if (!storage) {
                return null;
            }
            return storage.getItem(LAST_SHOW_KEY);
        },
        setLastShow: function(name) {
            var storage = getStorage();
            if (!storage || !name) {
                return;
            }
            storage.setItem(LAST_SHOW_KEY, name);
        }
    };

    global.StorageManager = StorageManager;
    global.CueMate = global.CueMate || {};
    global.CueMate.StorageManager = StorageManager;
})(window);
