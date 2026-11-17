export function downloadJson(value: unknown, filename: string) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
export async function imageDataUrl(source: File | string): Promise<string> {
  const url = typeof source === "string" ? source : URL.createObjectURL(source);
  try {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = url;
    await image.decode();
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 1280 / image.width);
    canvas.width = image.width * scale;
    canvas.height = image.height * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Image unavailable");
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.85);
  } finally {
    if (typeof source !== "string") URL.revokeObjectURL(url);
  }
}
