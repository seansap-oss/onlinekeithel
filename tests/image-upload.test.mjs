import test from "node:test";
import assert from "node:assert/strict";
import { fitImage, prepareImage, MAX_UPLOADED_IMAGE_BYTES } from "../src/lib/image-upload.js";

test("phone photos are resized and encoded below the upload budget", async () => {
  assert.deepEqual(fitImage(6000, 4000), { width: 2560, height: 1707 });
  const oldBitmap = globalThis.createImageBitmap;
  const oldDocument = globalThis.document;
  let size;
  try {
    globalThis.createImageBitmap = async () => ({ width: 6000, height: 4000, close() {} });
    globalThis.document = {
      createElement: () => {
        const canvas = {
          width: 0,
          height: 0,
          getContext: () => ({ fillRect() {}, drawImage() {}, set fillStyle(value) {} }),
          toBlob(callback, mime) {
            size = [this.width, this.height];
            callback(new Blob(["compressed"], { type: mime }));
          },
        };
        return canvas;
      },
    };
    const output = await prepareImage({ type: "image/png", size: 22 * 1024 * 1024 });
    assert.equal(output.type, "image/jpeg");
    assert.ok(output.size < MAX_UPLOADED_IMAGE_BYTES);
    assert.deepEqual(size, [2560, 1707]);
    await assert.rejects(() => prepareImage({ type: "image/png", size: 41 * 1024 * 1024 }), /40 MB/);
  } finally {
    globalThis.createImageBitmap = oldBitmap;
    globalThis.document = oldDocument;
  }
});
