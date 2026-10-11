/** Largest crop of a source image that has the target ratio. */
export function largestCropForRatio(
  sourceWidth: number,
  sourceHeight: number,
  target: { width: number; height: number }
): { width: number; height: number } {
  const targetRatio = target.width / target.height;

  if (sourceWidth / sourceHeight > targetRatio) {
    return { width: Math.round(sourceHeight * targetRatio), height: sourceHeight };
  }

  return { width: sourceWidth, height: Math.round(sourceWidth / targetRatio) };
}
