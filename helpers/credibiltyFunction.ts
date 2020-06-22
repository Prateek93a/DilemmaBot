export const credibilityFunction = (scoresArray: Array<number>, votersMap: Map<number|string,string>): Map<number|string, number> => {
    // calculate the winning score
    let winningScore = 0;
    scoresArray.forEach(score => {
        if(score > winningScore) winningScore = score;
    })

    // map the scores according to the winning score and compute the value to be subtracted from credibility score
    const newScoresArray = scoresArray.map(score => mapToRange((1 - (score/winningScore)),0,1,0,0.25));

    // create a new map with the credibility changes
    const votersCredibilityChange = new Map();
    votersMap.forEach((value, key, map) => {
        votersCredibilityChange.set(key,newScoresArray[parseInt(value)]); 
    })

    return votersCredibilityChange;
}


// map function to bring the value n to the range 0-0.5, based on p5.js map function
export const mapToRange = (n: number, start1: number, stop1: number, start2: number, stop2: number): number => {
    return (n - start1) / (stop1 - start1) * (stop2 - start2) + start2;
}