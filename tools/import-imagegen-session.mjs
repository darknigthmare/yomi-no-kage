#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";

const args = process.argv.slice(2);
const sessionPath = args[0];
const extractCallIndex = args.indexOf("--extract-call");
const outputIndex = args.indexOf("--output");
const sinceIndex = args.indexOf("--since");
const minBytesIndex = args.indexOf("--min-bytes");
const extractCallId = extractCallIndex >= 0 ? args[extractCallIndex + 1] : null;
const outputPath = outputIndex >= 0 ? args[outputIndex + 1] : null;
const since = sinceIndex >= 0 ? Date.parse(args[sinceIndex + 1]) : Number.NEGATIVE_INFINITY;
const minBytes = minBytesIndex >= 0 ? Number(args[minBytesIndex + 1]) : 0;

if (!sessionPath) {
  throw new Error(
    "Usage: node tools/import-imagegen-session.mjs <session.jsonl> "
      + "[--extract-call <call-id> --output <image.png>]",
  );
}

if ((extractCallId && !outputPath) || (!extractCallId && outputPath)) {
  throw new Error("--extract-call et --output doivent être fournis ensemble");
}

function findImagePayloads(value, found = []) {
  if (typeof value === "string") {
    const matches = value.match(/data:image\/[a-z0-9.+-]+;base64,[A-Za-z0-9+/=]+/gi);
    if (matches) {
      found.push(...matches.map((url) => ({ kind: "data-url", value: url })));
    } else if (
      value.length >= 1024
      && value.length % 4 === 0
      && /^[A-Za-z0-9+/]+={0,2}$/.test(value)
    ) {
      const head = Buffer.from(value.slice(0, 48), "base64");
      const isPng = head.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"));
      const isJpeg = head[0] === 0xff && head[1] === 0xd8;
      if (isPng || isJpeg) {
        found.push({
          kind: "raw-base64",
          mimeType: isPng ? "image/png" : "image/jpeg",
          value,
        });
      }
    }
    return found;
  }
  if (Array.isArray(value)) {
    for (const item of value) findImagePayloads(item, found);
    return found;
  }
  if (value && typeof value === "object") {
    for (const item of Object.values(value)) findImagePayloads(item, found);
  }
  return found;
}

function findImageCalls(value, found = []) {
  if (Array.isArray(value)) {
    for (const item of value) findImageCalls(item, found);
    return found;
  }
  if (!value || typeof value !== "object") return found;

  const name = value.name || value.tool_name;
  if (name === "imagegen" || name === "image_gen.imagegen") {
    found.push({
      callId: value.call_id || value.id || null,
      arguments: value.arguments || value.input || null,
    });
  }
  for (const item of Object.values(value)) findImageCalls(item, found);
  return found;
}

function pngDimensions(bytes) {
  if (
    bytes.length >= 24
    && bytes.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"))
  ) {
    return {
      width: bytes.readUInt32BE(16),
      height: bytes.readUInt32BE(20),
    };
  }
  return null;
}

const imageCalls = new Map();
const results = [];
let extracted = false;
const stream = fs.createReadStream(sessionPath, { encoding: "utf8" });
const lines = readline.createInterface({ input: stream, crlfDelay: Infinity });

for await (const line of lines) {
  let entry;
  try {
    entry = JSON.parse(line);
  } catch {
    continue;
  }

  const payload = entry.payload || entry.item || entry;
  const name = payload.name || payload.tool_name || entry.name;
  const callId = payload.call_id || payload.id || entry.call_id;
  const timestamp = entry.timestamp || payload.timestamp || null;

  for (const imageCall of findImageCalls(entry)) {
    imageCalls.set(imageCall.callId, {
      callId: imageCall.callId,
      timestamp: entry.timestamp || payload.timestamp || null,
      arguments: imageCall.arguments,
    });
  }

  if (timestamp && Date.parse(timestamp) < since) continue;
  const images = findImagePayloads(entry);
  if (images.length === 0) continue;

  for (let index = 0; index < images.length; index += 1) {
    const image = images[index];
    const match = image.kind === "data-url"
      ? /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i.exec(image.value)
      : null;
    const mimeType = match ? match[1] : image.mimeType;
    const encoded = match ? match[2] : image.value;
    const bytes = Buffer.from(encoded, "base64");
    if (bytes.length < minBytes) continue;
    const associatedCall = imageCalls.get(callId);
    const record = {
      callId,
      timestamp: entry.timestamp || null,
      tool: associatedCall ? "imagegen" : name || payload.type || entry.type || "unknown",
      mimeType,
      byteLength: bytes.length,
      dimensions: pngDimensions(bytes),
      imageIndex: index,
    };
    results.push(record);

    if (extractCallId === callId && !extracted) {
      const resolvedOutput = path.resolve(outputPath);
      fs.mkdirSync(path.dirname(resolvedOutput), { recursive: true });
      fs.writeFileSync(resolvedOutput, bytes);
      extracted = true;
      record.extractedTo = resolvedOutput;
    }
  }
}

if (extractCallId && !extracted) {
  throw new Error(`Aucune image trouvée pour l'appel ${extractCallId}`);
}

process.stdout.write(`${JSON.stringify({ imageCalls: [...imageCalls.values()], results }, null, 2)}\n`);
