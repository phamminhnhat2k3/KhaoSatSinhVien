export function avatarCrop(width: number, height: number, zoom: number, x: number, y: number) {
  const size = Math.min(width, height) / Math.max(0.1, Math.min(3, zoom));
  const position = (length: number, offset: number) => (length - size) * (Math.max(-1, Math.min(1, offset)) + 1) / 2;
  return { sx: position(width, x), sy: position(height, y), size };
}
