const STORAGE_KEY = 'petname_genie_favorites';

export function getFavorites() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

export function addToFavorites(nameObj) {
    const favorites = getFavorites();
    if (!favorites.some(f => f.name === nameObj.name)) {
        favorites.push({ ...nameObj, timestamp: Date.now() });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
        return true;
    }
    return false;
}

export function removeFromFavorites(name) {
    let favorites = getFavorites();
    favorites = favorites.filter(f => f.name !== name);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
}

export function isFavorite(name) {
    const favorites = getFavorites();
    return favorites.some(f => f.name === name);
}
