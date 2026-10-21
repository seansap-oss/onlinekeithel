const MAX_SOURCE_BYTES = 40 * 1024 * 1024;
export const MAX_UPLOADED_IMAGE_BYTES = 4 * 1024 * 1024;
const MAX_EDGE = 2560;
const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

export function fitImage(width, height, maxEdge = MAX_EDGE) {
  if (!width || !height) throw Error("This photo could not be opened.");
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

async function decodePhoto(file) {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      return { image: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() };
    } catch { /* Fall back to the browser image decoder. */ }
  }
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    return { image, width: image.naturalWidth, height: image.naturalHeight, close: () => URL.revokeObjectURL(url) };
  } catch {
    URL.revokeObjectURL(url);
    throw Error("This phone photo could not be opened. Choose a JPG, PNG or WebP image instead.");
  }
}

const toJpeg = (canvas, quality) => new Promise((resolve, reject) =>
  canvas.toBlob((blob) => blob ? resolve(blob) : reject(Error("Could not optimize this photo.")), "image/jpeg", quality),
);

export async function prepareImage(file) {
  if (!ALLOWED.has(file.type))
    throw Error("Choose a JPG, PNG, WebP or supported phone photo.");
  if (file.size > MAX_SOURCE_BYTES)
    throw Error("This photo is too large to process on a phone. Choose a photo under 40 MB.");
  const source = await decodePhoto(file);
  try {
    let size = fitImage(source.width, source.height);
    const canvas = document.createElement("canvas");
    for (let attempt = 0; attempt < 5; attempt++) {
      canvas.width = size.width;
      canvas.height = size.height;
      const context = canvas.getContext("2d");
      if (!context) throw Error("Photo optimization is unavailable on this device.");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, size.width, size.height);
      context.drawImage(source.image, 0, 0, size.width, size.height);
      const blob = await toJpeg(canvas, Math.max(0.68, 0.88 - attempt * 0.05));
      if (blob.size <= MAX_UPLOADED_IMAGE_BYTES) return blob;
      size = fitImage(size.width, size.height, Math.round(Math.max(size.width, size.height) * 0.82));
    }
    throw Error("This photo could not be reduced enough. Choose a smaller image.");
  } finally {
    source.close();
  }
}
