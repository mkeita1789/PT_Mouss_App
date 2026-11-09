/* Préparation d'une image AVANT l'envoi, dans le navigateur :
   - redressée selon l'orientation du téléphone ;
   - réduite (envoi rapide, stockage léger) ;
   - réencodée en JPEG, ce qui retire les métadonnées (lieu GPS, appareil). */
export async function preparerImage(fichier: File, cote: number, carre = false): Promise<Blob> {
  const img = await createImageBitmap(fichier, { imageOrientation: "from-image" });
  let sx = 0, sy = 0, sw = img.width, sh = img.height;
  if (carre) {
    const c = Math.min(sw, sh);
    sx = (sw - c) / 2;
    sy = (sh - c) / 2;
    sw = sh = c;
  }
  const k = Math.min(1, cote / Math.max(sw, sh));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(sw * k);
  canvas.height = Math.round(sh * k);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  img.close();
  return new Promise((ok, ko) => canvas.toBlob((b) => (b ? ok(b) : ko(new Error("jpeg"))), "image/jpeg", 0.86));
}
