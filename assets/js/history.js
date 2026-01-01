const HISTORY_KEY = 'petname_genie_history_storage'; 
const MAX_HISTORY = 50;

export function getHistory() {
    const data = localStorage.getItem(HISTORY_KEY); 
    return data ? JSON.parse(data) : [];
}

export function addToHistory(nameObj) {
    let history = getHistory();
    // Avoid duplicates
    if (history.some(h => h.name === nameObj.name)) return false; 

    const timestamp = Date.now();
    // Initialize rating as 0 or null
    history.unshift({ ...nameObj, timestamp, rating: 0 });
    
    if (history.length > MAX_HISTORY) {
        history = history.slice(0, MAX_HISTORY);
    }
    
    save(history);
    return true;
}

export function removeFromHistory(name) {
    let history = getHistory();
    history = history.filter(f => f.name !== name); 
    save(history);
}

export function clearHistory() {
    localStorage.removeItem(HISTORY_KEY);
}

export function updateRating(name, rating) {
    let history = getHistory();
    const item = history.find(h => h.name === name);
    if (item) {
        item.rating = rating; // 0, 1 (liked), 2 (loved/starred) etc.
        // Re-ordering logic? Usually liked items don't jump to top unless requested.
        // For simple update:
        save(history);
        return true;
    }
    return false;
}

function save(history) {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}
