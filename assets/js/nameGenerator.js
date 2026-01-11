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
            
            // Critical Telugu/Hindi Fix: Fallback Logic
            let localizedMeaning = meaningData.meaning[criteria.lang];
            let meaningNote = "";

            if (!localizedMeaning) {
                // FALLBACK: Use English
                localizedMeaning = meaningData.meaning['en'];
                if (criteria.lang === 'te') meaningNote = " (Telugu unavailable)";
                if (criteria.lang === 'hi') meaningNote = " (Hindi unavailable)";
            }
            
            // Append note if exists
            const displayMeaning = localizedMeaning + meaningNote;
            
            // AIML: Phonetic Analysis
            const soundProfile = analyzeSound(finalName);

            // AIML: Confidence Score
            const confidence = calculateConfidence(baseName, finalName, criteria, soundProfile, meaningData);

            // AIML: Explanation
            const explanation = generateExplanation(criteria, soundProfile, confidence, derivationSource);

            results.push({
                name: finalName,
                baseName: baseName,
                meaning: displayMeaning,
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
    let score = 75; // Initial base confidence

    // 1. Emotion Alignment (+/-)
    if (meaningData.emotion === criteria.emotion) score += 15;
    else if (meaningData.emotion) score += 5; // Slight boost just for having known emotion

    // 2. Sound Match (Phonetics)
    // Soft -> Loving/Cute
    if (['Loving', 'Cute', 'Peaceful'].includes(criteria.emotion) && sound.category === 'Soft') score += 10;
    // Strong -> Protective/Royal
    if (['Protective', 'Proud', 'Strong', 'Royal'].includes(criteria.emotion) && sound.category === 'Strong') score += 10;
    // Sharp -> Funny/Playful/Modern
    if (['Funny', 'Playful', 'Modern'].includes(criteria.emotion) && sound.category === 'Sharp') score += 10;

    // 3. Cultural Match
    const nameOrigin = datasets.cultures[baseName] || 'Global';
    if (criteria.origin !== 'Global' && nameOrigin === criteria.origin) score += 10;

    // 4. Length Penalties
    if (finalName.length > 10) score -= 5;
    if (finalName.length < 3) score -= 5;

    // 5. Random AI Variance (to simulate "thinking")
    score += Math.floor(Math.random() * 5); 

    return Math.min(98, Math.max(60, score)); // Clap between 60% and 98%
}

function analyzeSound(name) {
    const lower = name.toLowerCase();
    const vowels = /[aeiouy]/g;
    // Strong: K, T, P, D, G, B, R
    const hardConsonants = /[ktpdgbr]/g;
    // Soft: L, M, N, S, H, W
    const softConsonants = /[lmnshw]/g;
    // Sharp: Z, X, V, J, Q
    const sharpConsonants = /[zxvjq]/g;

    const vCount = (lower.match(vowels) || []).length;
    const hCount = (lower.match(hardConsonants) || []).length;
    const sCount = (lower.match(softConsonants) || []).length;
    const zCount = (lower.match(sharpConsonants) || []).length;

    let category = "Balanced";
    let score = 0; // Negative = Soft, Positive = Hard

    score += hCount * 1.5;
    score += zCount * 2;
    score -= sCount * 1;
    score -= (vCount / lower.length) * 2; 

    if (score > 1.5) category = "Strong";
    else if (score < -1) category = "Soft";
    else if (zCount > 0) category = "Sharp";

    return { category, vCount, hCount, sCount };
}

function generateExplanation(criteria, sound, confidence, source) {
    let reasons = [];
    
    // Source Reason
    if (source === "Gender Match") reasons.push(`Matches typical ${criteria.gender.toLowerCase()} naming styles.`);
    if (source === "Emotion Match") reasons.push(`Selected for its ${criteria.emotion.toLowerCase()} vibe.`);
    
    // Phonetic Reason
    if (sound.category === 'Soft') {
        reasons.push("Has a gentle, soft sound profile.");
    } else if (sound.category === 'Strong') {
        reasons.push("Uses strong consonants for a bold presence.");
    } else if (sound.category === 'Sharp') {
        reasons.push("Has a distinct, energetic ring to it.");
    }

    // Confidence Reason
    if (confidence > 88) reasons.push("A super-match based on your inputs!");
    else if (confidence > 75) reasons.push("Solidly aligns with your preferences.");

    return reasons.slice(0, 2).join(" ");
}

function checkConsistency(style, emotion) {
    // Conflict Matrix
    if (style === 'Strong' && emotion === 'Loving') return "Tip: You asked for Strong names but a Loving bond. This name bridges both!";
    if (style === 'Cute' && emotion === 'Protective') return "Tip: Cute names usually aren't Protective, but this one works!";
    if (style === 'Royal' && emotion === 'Funny') return "Tip: Royal names are rarely Funny. Expect some irony!";
    return null;
}
