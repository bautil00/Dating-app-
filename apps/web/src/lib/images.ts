export function dataUrlForFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read image'));
    reader.onload = () => {
      const raw = String(reader.result || '');
      const image = new Image();
      image.onerror = () => reject(new Error('Could not load image'));
      image.onload = () => {
        try {
          const maxSide = 900;
          const scale = Math.min(1, maxSide / image.width, maxSide / image.height);
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(image.width * scale));
          canvas.height = Math.max(1, Math.round(image.height * scale));
          const context = canvas.getContext('2d');
          if (!context) {
            reject(new Error('Could not resize image'));
            return;
          }
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.78));
        } catch (err) {
          reject(err instanceof Error ? err : new Error('Could not resize image'));
        }
      };
      image.src = raw;
    };
    reader.readAsDataURL(file);
  });
}
