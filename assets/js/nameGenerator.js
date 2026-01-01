import { loadJSON, getRandomItem, capitalize } from './utils.js';

let datasets = {
    names: null,
    meanings: null,
    cultures: null
};

export async function initGenerator() {
    datasets.names = await loadJSON('assets/data/pet_names_dataset.json');
    datasets.meanings = await loadJSON('assets/data/name_meanings.json');
    datasets.cultures = await loadJSON('assets/data/cultural_tags.json');
}

export function generateNames(criteria, count = 6) {
    if (!datasets.names) return [];

    const { type, gender, emotion, style, origin } = criteria;
    const results = [];
    const usedNames = new Set();
    
    // AIML: Consistency Check Warning
    const consistencyWarning = checkConsistency(style, emotion);

    let candidateNames = datasets.names.categories[type] || datasets.names.base_names;
    if (candidateNames.length < 10) {
        candidateNames = [...candidateNames, ...datasets.names.base_names];
    }

    const genderSpecific = datasets.names.gender_map[gender] || [];
    const emotionSpecific = datasets.names.emotion_map[emotion] || [];

    let attempts = 0;
    while (results.length < count && attempts < 100) {
        attempts++;
        
        const usePattern = Math.random() > 0.4;
        let finalName = "";
        let baseName = "";
        let derivationSource = "Generic";

        if (Math.random() > 0.5 && genderSpecific.length > 0) {
            baseName = getRandomItem(genderSpecific);
            derivationSource = "Gender Match";
        } else if (emotionSpecific.length > 0 && Math.random() > 0.5) {
            baseName = getRandomItem(emotionSpecific);
            derivationSource = "Emotion Match";
        } else {
            baseName = getRandomItem(candidateNames);
        }

        if (usePattern) {
            const patternKey = style === 'Any' ? (Math.random() > 0.5 ? 'descriptive' : 'standard') : 'descriptive';
            const themeKey = style.toLowerCase(); 
            
            const prefixes = datasets.names.prefixes[themeKey] || datasets.names.prefixes.cute;
            const suffixes = datasets.names.suffixes[themeKey] || datasets.names.suffixes.cute;

            const patternTemplate = getRandomItem(datasets.names.patterns[patternKey] || datasets.names.patterns.standard);
            
            finalName = patternTemplate
                .replace('{prefix}', getRandomItem(prefixes))
                .replace('{suffix}', getRandomItem(suffixes))
                .replace('{name}', baseName);
        } else {
            finalName = baseName;
        }

        finalName = finalName.trim();

        if (origin !== 'Global') {
            const nameOrigin = datasets.cultures[baseName] || 'Global';
            // Simple Origin Logic
            if (origin === 'Cute' && nameOrigin !== 'Cute') {
                 if (style !== 'Cute' && emotion !== 'Loving') continue; 
            } else if (nameOrigin !== origin && nameOrigin !== 'Global') {
                 if (Math.random() > 0.2) continue;
            }
        }

        if (!usedNames.has(finalName)) {
            usedNames.add(finalName);
            
            // Enrich Data
            const meaningData = datasets.meanings[baseName] || { meaning: { en: "A unique friend" }, emotion: "Loyal" };
            
            // Critical Telugu Fix: Fallback Logic
            let localizedMeaning = meaningData.meaning[criteria.lang];
            if (!localizedMeaning) {
                localizedMeaning = meaningData.meaning['en'] + (criteria.lang !== 'en' ? " (Meaning unavailable in selected language)" : "");
            }
            
            // AIML: Phonetic Analysis
            const soundProfile = analyzeSound(finalName);

            // AIML: Confidence Score
            const confidence = calculateConfidence(baseName, finalName, criteria, soundProfile, meaningData);

            // AIML: Explanation
            const explanation = generateExplanation(criteria, soundProfile, confidence, derivationSource);

            results.push({
                name: finalName,
                baseName: baseName,
                meaning: localizedMeaning,
                meaningObj: meaningData.meaning,
                origin: datasets.cultures[baseName] || "Global",
                tags: [datasets.cultures[baseName] || "Universal", meaningData.emotion || "Special", soundProfile.category],
                uniqueness: Math.random() > 0.8 ? "Very Unique" : (Math.random() > 0.5 ? "Unique" : "Common"),
                
                // New Fields
                aiStats: {
                    confidence: confidence,
                    soundProfile: soundProfile,
                    explanation: explanation,
                    consistencyWarning: consistencyWarning
                }
            });
        }
    }

    return results;
}

// ------ AIML Helper Functions ------

function calculateConfidence(baseName, finalName, criteria, sound, meaningData) {
    let score = 70; // Base score

    // 1. Emotion Match
    if (meaningData.emotion === criteria.emotion) score += 15;
    
    // 2. Sound Match (Heuristic)
    // Soft sounds suit Loving/Cute, Strong suits Protective/Strong
    if (criteria.emotion === 'Loving' && sound.category === 'Soft') score += 10;
    if (criteria.emotion === 'Protective' && sound.category === 'Strong') score += 10;
    
    // 3. Length penalty/bonus
    if (finalName.length > 12) score -= 5; // Too long
    
    // Cap at 99% (nothing is perfect AI :P)
    return Math.min(99, Math.max(50, score));
}

function analyzeSound(name) {
    const vowels = /[aeiouy]/gi;
    const hardConsonants = /[kqtpdgb]/gi;
    const softConsonants = /[lmnrszcv]/gi; // Approximation

    const vowelCount = (name.match(vowels) || []).length;
    const hardCount = (name.match(hardConsonants) || []).length;
    const softCount = (name.match(softConsonants) || []).length;

    let category = "Balanced";
    if (softCount > hardCount && vowelCount > name.length / 3) category = "Soft";
    if (hardCount > softCount) category = "Strong";
    if (name.includes('z') || name.includes('x') || name.includes('k')) category = "Sharp"; // Overrides
    
    return {
        category,
        vowelCount,
        hardCount
    };
}

function generateExplanation(criteria, sound, confidence, source) {
    let reasons = [];
    
    // Emotion Reason
    if (source === "Emotion Match") {
        reasons.push(`${criteria.emotion} matches the name's inherent vibe.`);
    } else if (source === "Gender Match") {
        reasons.push(`Selected based on traditional ${criteria.gender} naming patterns.`);
    }

    // Sound Reason
    if (sound.category === 'Soft') reasons.push("Has a soft, friendly phonetic structure.");
    if (sound.category === 'Strong') reasons.push("Features strong consonants for impact.");
    
    // Confidence Reason
    if (confidence > 85) reasons.push("Highly aligned with your preferences.");

    return `AI suggested this because: ${reasons.slice(0, 2).join(' ')}`;
}

function checkConsistency(style, emotion) {
    // Conflict Matrix
    if (style === 'Strong' && emotion === 'Loving') return "Tip: Strong names might contrast with a Loving bond.";
    if (style === 'Cute' && emotion === 'Protective') return "Tip: Cute names might not sound very Protective.";
    return null;
}
