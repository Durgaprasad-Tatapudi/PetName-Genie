const HISTORY_KEY = 'petname_genie_history_storage'; 
const MAX_HISTORY = 50;

export function getHistory() {
    try {
        const data = localStorage.getItem(HISTORY_KEY); 
        return data ? JSON.parse(data) : [];
    } catch (e) {
        console.error("History Access Error", e);
        return [];
    }
}

export function addToHistory(nameObj) {
    let history = getHistory();
    // Prevent duplicates based on name match
    if (history.some(h => h.name === nameObj.name)) return false; 

    const timestamp = Date.now();
    // Add new item to TOP
    history.unshift({ 
        ...nameObj, 
        timestamp, 
        rating: 0 // 0=none, 1=like, 2=love
    });
    
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
        item.rating = rating; 
        save(history);
        return true;
    }
    return false;
}

export function getLatestItem() {
    const h = getHistory();
    return h.length > 0 ? h[0] : null;
}

function save(history) {
    try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
        console.error("History Save Error", e);
    }
}
