const MAX_SIDE = 1600;

/**
 * Redraws every picture onto a blank canvas and saves it as a fresh JPEG. This strips
 * hidden metadata such as the GPS location phones record, and shrinks big photos so
 * uploads stay fast (phone photos are often 5–10 MB). GIFs are kept as-is so they stay
 * animated; they rarely carry camera or location data.
 */
export async function prepareImage(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose a picture file.");
  if (file.type === "image/gif") {
    if (file.size > 5 * 1024 * 1024) throw new Error("GIFs must be under 5 MB.");
    return file;
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("This picture format can't be read. Try a JPEG or PNG.");
  }

  // Always re-encode, even small pictures: returning the original file would keep its metadata.
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not process the picture."))),
      "image/jpeg",
      0.85,
    ),
  );
}
