export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * Reads an image file, scales it down so its longest side is at most `maxSize`,
 * and returns a compressed JPEG data URL. Keeps localStorage small.
 */
export const resizeImageFile = (
  file: File,
  maxSize = 400,
  quality = 0.7
): Promise<string> =>
  new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Please choose an image file"));
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      reject(new Error("Image is too large (max 5MB)"));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the image"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not open the image"));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not process the image"));
          return;
        }
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
