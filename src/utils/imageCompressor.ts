/**
 * Image compressor utility to ensure multi-photo products never exceed
 * the strict 1,048,576 bytes (1 MB) Firestore document size limit.
 */

export const compressImageForProduct = (
  src: string,
  maxWidth = 500,
  maxHeight = 667,
  targetMaxBytes = 48000
): Promise<string> => {
  return new Promise((resolve) => {
    // Non-data URLs (e.g. https://... or /images/...) don't take document space
    if (!src || !src.startsWith('data:image')) {
      resolve(src);
      return;
    }

    // Already small data URLs (under 45KB) are completely safe
    if (src.length < targetMaxBytes) {
      resolve(src);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      let w = img.naturalWidth || img.width;
      let h = img.naturalHeight || img.height;

      if (!w || !h) {
        resolve(src);
        return;
      }

      // Constrain dimensions maintaining aspect ratio
      if (w > maxWidth || h > maxHeight) {
        const ratio = Math.min(maxWidth / w, maxHeight / h);
        w = Math.max(1, Math.round(w * ratio));
        h = Math.max(1, Math.round(h * ratio));
      }

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(src);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);

      // Start compression at quality 0.76 and iteratively reduce if needed
      let quality = 0.76;
      let output = canvas.toDataURL('image/jpeg', quality);

      while (output.length > targetMaxBytes && quality > 0.35) {
        quality -= 0.08;
        output = canvas.toDataURL('image/jpeg', quality);
      }

      resolve(output);
    };

    img.onerror = () => {
      resolve(src);
    };

    img.src = src;
  });
};
