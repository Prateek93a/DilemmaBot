"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapToRange = exports.credibilityFunction = void 0;
exports.credibilityFunction = (scoresArray, votersMap) => {
    // calculate the winning score
    let winningScore = 0;
    scoresArray.forEach(score => {
        if (score > winningScore)
            winningScore = score;
    });
    // map the scores according to the winning score and compute the value to be subtracted from credibility score
    const newScoresArray = scoresArray.map(score => exports.mapToRange((1 - (score / winningScore)), 0, 1, 0, 0.25));
    // create a new map with the credibility changes
    const votersCredibilityChange = new Map();
    votersMap.forEach((value, key, map) => {
        votersCredibilityChange.set(key, newScoresArray[parseInt(value)]);
    });
    return votersCredibilityChange;
};
// map function to bring the value n to the range 0-0.5, based on p5.js map function
exports.mapToRange = (n, start1, stop1, start2, stop2) => {
    return (n - start1) / (stop1 - start1) * (stop2 - start2) + start2;
};
