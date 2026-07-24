const levenshteinDistance = (s1, s2) => {
    if (s1.length === 0) return s2.length;
    if (s2.length === 0) return s1.length;
    
    let prevRow = [];
    for (let i = 0; i <= s2.length; i++) prevRow[i] = i;

    for (let i = 0; i < s1.length; i++) {
        let currRow = [i + 1];
        for (let j = 0; j < s2.length; j++) {
            let insertions = prevRow[j + 1] + 1;
            let deletions = currRow[j] + 1;
            let substitutions = prevRow[j] + (s1[i] !== s2[j] ? 1 : 0);
            currRow.push(Math.min(insertions, deletions, substitutions));
        }
        prevRow = currRow;
    }
    return prevRow[s2.length];
};

const normalizeName = (name) => {
    if (!name) return "";
    let n = String(name).toUpperCase();
    // Remove common Indian and English titles
    n = n.replace(/\b(MR|MRS|MISS|MS|DR|SRI|SMT|PROF|KUMARI|SHREE|SHRI)\b\.?/g, "");
    // Keep only alphabetical characters (removes spaces, dots, dashes, etc.)
    n = n.replace(/[^A-Z]/g, "");
    return n;
};

const calculateNameMatchScore = (name1, name2) => {
    const n1 = normalizeName(name1);
    const n2 = normalizeName(name2);
    
    if (!n1 && !n2) return 100;
    if (!n1 || !n2) return 0;
    
    const maxLen = Math.max(n1.length, n2.length);
    const dist = levenshteinDistance(n1, n2);
    
    const score = ((maxLen - dist) / maxLen) * 100;
    return parseFloat(score.toFixed(2));
};

module.exports = { calculateNameMatchScore, normalizeName, levenshteinDistance };
