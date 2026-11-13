import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { sharedVideoFromSearch } from "../src/lib/shared-video.js";

test("Android shares passed as text or URL prefill only supported public video links", () => {
  const reel = "https://www.instagram.com/reel/ABC123xyz/";
  assert.equal(sharedVideoFromSearch("?text=" + encodeURIComponent("Nike shoes " + reel)), reel);
  assert.equal(sharedVideoFromSearch("?url=" + encodeURIComponent("https://youtu.be/dQw4w9WgXcQ")), "https://youtu.be/dQw4w9WgXcQ");
  assert.equal(sharedVideoFromSearch("?url=" + encodeURIComponent("https://instagram.com.evil.example/reel/ABC")), "");
  assert.equal(sharedVideoFromSearch("?text=hello"), "");
});

test("installed OO PWA receives links at the share posting route", () => {
  const manifest = JSON.parse(readFileSync(new URL("../public/manifest.webmanifest", import.meta.url)));
  assert.equal(manifest.share_target.action, "/share");
  assert.equal(manifest.share_target.method, "POST");
  assert.equal(manifest.share_target.enctype, "multipart/form-data");
  assert.equal(manifest.share_target.params.text, "text");
  assert.equal(manifest.share_target.params.files[0].name, "media");
});
