/**
 * Client-side image edits for the title scanner — rotate and crop a File
 * via canvas before it's sent to the AI. Tilted/oversized phone photos hurt
 * OCR; fixing them here measurably improves extraction.
 *
 * Each function returns a fresh File (same base name, JPEG/PNG preserved).
 */

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not load the image.'))
    img.src = src
  })
}

function canvasToFile(canvas, file) {
  const type = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
  const quality = type === 'image/jpeg' ? 0.92 : undefined
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error('Could not encode the image.'))
      resolve(new File([blob], file.name, { type, lastModified: file.lastModified }))
    }, type, quality)
  })
}

/** Rotate by an arbitrary angle (degrees, clockwise), expanding the canvas. */
export async function rotateImageFile(file, degrees) {
  const norm = ((degrees % 360) + 360) % 360
  if (norm === 0) return file
  const url = URL.createObjectURL(file)
  try {
    const img = await loadImage(url)
    const rad = norm * Math.PI / 180
    const sin = Math.abs(Math.sin(rad)), cos = Math.abs(Math.cos(rad))
    const w = img.naturalWidth, h = img.naturalHeight
    const bw = Math.round(w * cos + h * sin)
    const bh = Math.round(w * sin + h * cos)
    const canvas = document.createElement('canvas')
    canvas.width = bw
    canvas.height = bh
    const ctx = canvas.getContext('2d')
    ctx.translate(bw / 2, bh / 2)
    ctx.rotate(rad)
    ctx.drawImage(img, -w / 2, -h / 2)
    return await canvasToFile(canvas, file)
  } finally {
    URL.revokeObjectURL(url)
  }
}

/**
 * Crop to a sub-rectangle expressed as fractions (0–1) of the natural size.
 * @param {File} file
 * @param {{x:number, y:number, w:number, h:number}} rect
 */
export async function cropImageFile(file, rect) {
  const url = URL.createObjectURL(file)
  try {
    const img = await loadImage(url)
    const w = img.naturalWidth, h = img.naturalHeight
    const cx = Math.max(0, Math.round(rect.x * w))
    const cy = Math.max(0, Math.round(rect.y * h))
    const cw = Math.min(w - cx, Math.round(rect.w * w))
    const ch = Math.min(h - cy, Math.round(rect.h * h))
    if (cw < 8 || ch < 8) return file   // ignore degenerate crops
    const canvas = document.createElement('canvas')
    canvas.width = cw
    canvas.height = ch
    canvas.getContext('2d').drawImage(img, cx, cy, cw, ch, 0, 0, cw, ch)
    return await canvasToFile(canvas, file)
  } finally {
    URL.revokeObjectURL(url)
  }
}
