// The hero's dive onto Suape (0–1), from the hero's scroll (or ?p / the debug slider). Read inside useFrame.
export const heroDive = { value: 0 };

// Scene 5's progress after its slide (0–1), written by the scene, read inside useFrame; the canvas renders on demand,
// so the scene asks for each frame (invalidate, set by the canvas once it is up).
export const distributionProgress = { value: 0, invalidate: () => {} };
