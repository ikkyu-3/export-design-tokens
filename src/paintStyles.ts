export async function getPaintStyles() {
  const paintStyles = await figma.getLocalPaintStylesAsync();
  console.log(`🎨 Found ${paintStyles.length} paint styles`);
}
