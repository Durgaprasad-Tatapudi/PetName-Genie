import { $, $$ } from './utils.js';
import { initAccessibility } from './accessibility.js';
import { initImageHandler } from './imageHandler.js';
import { initGenerator, generateNames } from './nameGenerator.js';
import * as Favorites from './favorites.js';
import * as History from './history.js';
import { Pet3DWidget } from './widget3d.js';

// Developer Comment as requested
console.log("This project demonstrates rule-based artificial intelligence, explainable AI (XAI), multilingual knowledge representation, and user preference learning.");

document.addEventListener('DOMContentLoaded', async () => {
    initAccessibility();
    const imageHandler = initImageHandler();
    
    // Init Real 3D Widget
    try { new Pet3DWidget('hero-canvas'); } catch(e) { console.log("3D Widget skipped", e); }

    // UI Elements
    const form = $('#generator-form');
    const resultsSection = $('#results-section');
    const resultsGrid = $('#results-grid');
    const clearResultsBtn = $('#clear-results');
    const surpriseBtn = $('#surprise-btn');
    const resetBtn = $('#reset-app-btn');
    const tabBtns = $$('.tab-btn');
    const generateBtn = form.querySelector('.cta-btn');

    // State
    let isDataReady = false;

    // Initialize Data (Non-blocking)
    initGenerator()
        .then(() => {
            isDataReady = true;
            console.log("PetName Genie: Data loaded successfully.");
            generateBtn.disabled = false;
            generateBtn.innerHTML = '<span class="icon">✨</span> Generate Names';
        })
        .catch(err => {
            console.error("PetName Genie: Critical Data Load Error", err);
            showToast("Error loading data. Please refresh.", 10000);
            generateBtn.textContent = "⚠️ Error Loading Data";
            generateBtn.disabled = true;
        });

    // Set initial loading state
    generateBtn.disabled = true;
    generateBtn.innerHTML = '<span class="icon">⏳</span> Loading resources...';

    // Offline Indicator
    const offlineBadge = document.createElement('div');
    offlineBadge.className = 'offline-badge';
    offlineBadge.innerHTML = '⚠️ Offline Mode';
    document.body.appendChild(offlineBadge);
    
    function updateOnlineStatus() {
        if (!navigator.onLine) {
            document.body.classList.add('offline');
        } else {
            document.body.classList.remove('offline');
        }
    }
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();

    // Reset
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm("Start fresh?")) {
                form.reset();
                resultsSection.hidden = true;
                resultsGrid.innerHTML = '';
            }
        });
    }

    // Init Lists
    renderFavorites();
    renderHistory();

    // Events
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if(!isDataReady) {
            showToast("Please wait, resources are still loading...");
            return;
        }
        safeVibrate(15);
        await handleGenerationAndUI();
    });

    surpriseBtn.addEventListener('click', async () => {
        safeVibrate(15);
        randomizeForm();
        if(!isDataReady) {
             showToast("Please wait, resources are still loading...");
             return;
        }
        await handleGenerationAndUI(true);
    });

    // Helper for safe haptics
    function safeVibrate(ms) {
        if (navigator.vibrate) {
            try { navigator.vibrate(ms); } catch(e) {/* ignore */}
        }
    }

    clearResultsBtn.addEventListener('click', () => {
        resultsSection.hidden = true;
        resultsGrid.innerHTML = '';
    });

    function randomizeForm() {
        const types = ['Dog', 'Cat', 'Bird', 'Rabbit'];
        const emotions = ['Loving', 'Playful', 'Protective', 'Proud', 'Funny'];
        const styles = ['Cute', 'Strong', 'Royal', 'Modern', 'Funny'];
        
        $('#pet-type').value = types[Math.floor(Math.random() * types.length)];
        $('#pet-emotion').value = emotions[Math.floor(Math.random() * emotions.length)];
        $('#name-style').value = styles[Math.floor(Math.random() * styles.length)];
    }

    async function handleGenerationAndUI(isSurprise = false) {
        // UI Thinking State
        const btn = form.querySelector('.cta-btn');
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = `<span class="icon spin">⚙️</span> AI Thinking...`;
        
        // Simulate "Processing" time for effect
        await new Promise(r => setTimeout(r, 600));

        try {
            handleGeneration(isSurprise);
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }

    function handleGeneration(isSurprise = false) {
        const formData = new FormData(form);
        const criteria = {
            type: formData.get('pet-type'),
            gender: formData.get('gender'),
            emotion: formData.get('emotion'),
            style: formData.get('style'),
            origin: formData.get('origin'),
            lang: formData.get('meaning-lang'),
            isSurprise
        };

        console.log("Generating names with criteria:", criteria); // Debug Log

        try {
            const names = generateNames(criteria);
            console.log("Generated names count:", names.length); // Debug Log
            
            if (names.length > 0) {
                resultsSection.hidden = false;
                resultsGrid.innerHTML = ''; 
                
                // Safety Layout Fix for Mobile
                resultsSection.style.display = 'block'; 
            
            // Check consistency provided by first result (global check usually, but here per name generator logic)
            // Ideally consisteny check is pre-generation, but our generator returns it.
            if (names[0].aiStats && names[0].aiStats.consistencyWarning && !isSurprise) {
                showToast(names[0].aiStats.consistencyWarning, 5000); // Show warning
            }

                names.forEach(n => {
                    createNameCard(n, resultsGrid, criteria);
                });
                
                // Scroll logic
                setTimeout(() => {
                     resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);

            } else {
                showToast("No names found for this combination. Try different settings!");
            }
        } catch (e) {
            console.error("Generation Error:", e);
            showToast("An error occurred while generating names.");
        }
    }

    function createNameCard(data, container, context = {}) {
        const card = document.createElement('div');
        card.className = 'name-card';
        card.setAttribute('tabindex', '0');
        
        const isFav = Favorites.isFavorite(data.name);
        const heartIcon = isFav ? '❤️' : '🤍';
        const heartClass = isFav ? 'action-btn liked' : 'action-btn';

        // XAI Panel (Collapsed by default logic if needed, but here simple)
        const confidenceColor = data.aiStats.confidence > 80 ? 'green' : (data.aiStats.confidence > 60 ? 'orange' : 'gray');

        card.innerHTML = `
            <div class="name-header">
                <div class="generated-name">${data.name}</div>
                <div style="font-size:0.8rem; font-weight:bold; color:${confidenceColor};" title="AI Confidence">
                    ${data.aiStats.confidence}% Match
                </div>
            </div>
            
            <div class="meaning-wrapper">
                <div class="meaning-text">"${data.meaning}"</div>
                <button class="meaning-toggle">Hide Meaning</button>
            </div>

            <div class="tags">
                <span class="tag">${data.tags[2]} Sound</span> <!-- Phonetic -->
                <span class="tag" style="background:var(--secondary-color); color: white;">${data.uniqueness}</span>
                <span class="tag">${data.origin} Origin</span>
            </div>

            <div class="xai-summary" style="font-size: 0.85rem; background: var(--bg-color); border-radius: 8px; padding: 0.75rem; margin-bottom: 0.5rem;">
                <strong>💡 AI Insight:</strong> ${data.aiStats.explanation}
            </div>
            
            <div class="card-actions">
                <button class="${heartClass}" data-name="${data.name}" aria-label="Toggle Favorite">
                    ${heartIcon}
                </button>
                <button class="action-btn copy-btn" data-name="${data.name}" aria-label="Copy to Clipboard">
                    📋
                </button>
                <button class="action-btn share-btn" data-name="${data.name}" aria-label="Share">
                    🔗
                </button>
            </div>
        `;

        card.addEventListener('click', (e) => {
            if (e.target.closest('.card-actions') || e.target.closest('.meaning-toggle')) return;
            const added = History.addToHistory({ ...data, selectedAt: Date.now() });
            if (added) {
                renderHistory();
                showProfileSummary(data, context);
            }
        });

        // Toggle Meaning
        const toggleBtn = card.querySelector('.meaning-toggle');
        const meaningText = card.querySelector('.meaning-text');
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            meaningText.hidden = !meaningText.hidden;
            toggleBtn.textContent = meaningText.hidden ? "Show Meaning" : "Hide Meaning";
        });

        // Actions
        card.querySelector('.action-btn[aria-label="Toggle Favorite"]').addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFavorite(data, e.currentTarget);
        });

        card.querySelector('.copy-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(data.name);
            showToast("Copied to clipboard!");
        });

        card.querySelector('.share-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            if (navigator.share) navigator.share({ title: 'PetName Genie', text: data.name, url: window.location.href });
            else showToast("Share unavailable");
        });

        container.appendChild(card);
    }

    function showProfileSummary(data, context) {
        // Remove existing overlay if any
        if ($('.profile-summary-overlay')) $('.profile-summary-overlay').remove();

        const overlay = document.createElement('div');
        overlay.className = 'profile-summary-overlay';
        
        overlay.innerHTML = `
            <div class="profile-card">
                <button class="close-btn" style="position:absolute; top:1rem; right:1rem; border:none; background:none; font-size:1.5rem; cursor:pointer;">&times;</button>
                <h3>Pet Profile Created!</h3>
                <div class="profile-name">${data.name}</div>
                <div class="profile-meaning">"${data.meaning}"</div>
                
                <div style="margin-bottom:1rem;">
                    <strong>AI Confidence: ${data.aiStats.confidence}%</strong>
                    <div style="font-size:0.85rem; margin-top:0.25rem;">
                        ${data.aiStats.explanation}
                    </div>
                </div>

                <div class="profile-details">
                    <div class="detail-item">
                        <label>Type</label>
                        <span>${context.type || 'Pet'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Gender</label>
                        <span>${context.gender || 'Unknown'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Emotion</label>
                        <span>${context.emotion || 'Standard'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Sound</label>
                        <span>${data.aiStats.soundProfile.category}</span>
                    </div>
                </div>

                <p style="font-size:0.9rem; color:var(--text-muted);">Saved to history!</p>
                <div class="form-actions" style="justify-content:center; margin-top:1rem;">
                    <button class="btn btn-primary" id="close-profile">Unique & Perfect! ✨</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        const close = () => overlay.remove();
        overlay.querySelector('.close-btn').addEventListener('click', close);
        overlay.querySelector('#close-profile').addEventListener('click', close);
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    }

    function renderHistory() {
        const list = History.getHistory();
        const container = $('#history-list');

        if (list.length > 0) {
            container.innerHTML = `
                <div class="history-controls">
                    <button id="clear-history-all" class="clear-history-btn">Clear All History</button>
                </div>
                <div class="history-items-container"></div>
            `;
            
            $('#clear-history-all').addEventListener('click', () => {
                if(confirm('Clear all history?')) {
                    History.clearHistory();
                    renderHistory();
                }
            });

            const itemsContainer = container.querySelector('.history-items-container');
            
            list.forEach((item, index) => {
                const itemEl = document.createElement('div');
                itemEl.className = 'name-card history-item';
                // Highlight most recent (top of list)
                if (index === 0) {
                    itemEl.style.border = '2px solid var(--primary-color)';
                    itemEl.style.backgroundColor = 'var(--bg-color)';
                }
                
                itemEl.style.padding = '1rem';
                itemEl.style.marginBottom = '1rem';
                itemEl.style.display = 'flex';
                itemEl.style.justifyContent = 'space-between';
                itemEl.style.alignItems = 'center';
                itemEl.style.transition = "all 0.3s ease"; /* Smooth list movement */

                const rating = item.rating || 0;
                const starsHtml = [1,2,3,4,5].map(i => 
                    `<span class="star ${i <= rating ? 'active' : ''}" data-val="${i}" role="button" tabindex="0">★</span>`
                ).join('');

                itemEl.innerHTML = `
                    <div style="flex:1;">
                        <strong style="font-size:1.1rem;">${item.name}</strong>
                        <div style="font-size:0.8rem; color:var(--text-muted); margin-top:0.25rem;">${item.meaning}</div>
                        <div class="rating-stars" style="margin-top:0.5rem; font-size:1rem;">${starsHtml}</div>
                    </div>
                    <button class="delete-btn" aria-label="Remove from history" data-name="${item.name}">
                        🗑️
                    </button>
                `;

                itemEl.querySelector('.delete-btn').addEventListener('click', () => {
                    History.removeFromHistory(item.name);
                    renderHistory();
                });

                itemEl.querySelectorAll('.star').forEach(star => {
                    star.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const val = parseInt(star.dataset.val);
                        History.updateRating(item.name, val);
                        renderHistory();
                    });
                });

                itemsContainer.appendChild(itemEl);
            });
        } else {
            container.innerHTML = `<div class="empty-state-text">No history yet. Select a generated name to add it here.</div>`;
        }
    }

    function renderFavorites() {
        const list = Favorites.getFavorites();
        const container = $('#favorites-list');
        if (list.length === 0) {
            container.innerHTML = `<div class="empty-state-text">No favorites yet.</div>`;
            return;
        }
        container.innerHTML = '';
        list.forEach(item => {
            const itemEl = document.createElement('div');
            itemEl.className = 'name-card';
            itemEl.style.padding = '1rem';
            itemEl.style.marginBottom = '1rem';
            itemEl.innerHTML = `<strong>${item.name}</strong><br><small>${item.meaning}</small>`;
            container.appendChild(itemEl);
        });
    }

    function toggleFavorite(data, btn) {
        if (Favorites.isFavorite(data.name)) {
            Favorites.removeFromFavorites(data.name);
            btn.textContent = '🤍';
            btn.classList.remove('liked');
        } else {
            Favorites.addToFavorites(data);
            btn.textContent = '❤️';
            btn.classList.add('liked');
        }
        renderFavorites();
    }

    function showToast(msg, duration = 3000) {
        let toast = document.querySelector('.toast-container');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'toast-container';
            document.body.appendChild(toast);
        }
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), duration);
    }

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            $$('.tab-panel').forEach(p => p.hidden = true);
            
            btn.classList.add('active');
            $(`#${btn.dataset.tab}-panel`).hidden = false;
        });
    });
});
