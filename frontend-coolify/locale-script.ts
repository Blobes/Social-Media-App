// scripts/locale-script.ts
import fs from "fs";
import path from "path";
import crypto from "crypto";

const TARGET_LANGUAGES = ["es", "fr", "de", "it", "pt", "zh", "ja", "ar", "ru"];
const BASE_LOCALES_DIR = "./packages/core/locales";
const ENGLISH_SOURCE_DIR = path.join(BASE_LOCALES_DIR, "en");
const CACHE_FILE_PATH = path.join(BASE_LOCALES_DIR, ".hashcache.json");

// Loaded cleanly via dotenv-cli shell execution wrappers
const BACKEND_SYNC_ENDPOINT = `${process.env.NEXT_PUBLIC_API_URL}/upload/localization/sync`;

interface HashCache {
  files: Record<string, string>;
  keys: Record<string, string>;
}

interface TranslationNode {
  [key: string]: string | TranslationNode;
}

/**
 * Computes an MD5 checksum hash of a string layout payload.
 */
function calculateHash(content: string): string {
  return crypto.createHash("md5").update(content, "utf8").digest("hex");
}

/**
 * Reads the historical hash storage registry cache off the disk surface.
 */
function loadHashCache(): HashCache {
  if (!fs.existsSync(CACHE_FILE_PATH)) return { files: {}, keys: {} };
  try {
    const data = JSON.parse(fs.readFileSync(CACHE_FILE_PATH, "utf-8"));
    if (!data.files || !data.keys) {
      return { files: data || {}, keys: {} };
    }
    return data;
  } catch {
    return { files: {}, keys: {} };
  }
}

/**
 * Saves the updated file and key hash registry tracking maps back to disk.
 */
function saveHashCache(cache: HashCache): void {
  fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(cache, null, 2));
}

/**
 * Calls Cloudflare Workers AI engine to handle text conversion.
 */
async function fetchCloudTranslation(
  text: string,
  targetLang: string,
): Promise<string> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_AI_TOKEN;

  if (!accountId || !apiToken) {
    throw new Error(
      "Missing Cloudflare infrastructure authentication credentials.",
    );
  }

  const variableRegex = /\{\{[^}]+\}\}/g;
  const placeholders: string[] = [];
  const processedText = text.replace(variableRegex, (match) => {
    placeholders.push(match);
    return ` __VAR_${placeholders.length - 1}__ `;
  });

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/m2m100-1.2b`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: processedText,
        source_lang: "en",
        target_lang: targetLang.toLowerCase(),
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      `Cloudflare edge network responded with status code ${response.status}`,
    );
  }

  const payload = await response.json();

  if (!payload.success) {
    throw new Error(
      payload.errors?.[0]?.message ||
        "Cloudflare internal inference execution failure.",
    );
  }

  let translatedOutput = payload.result?.translated_text || text;

  placeholders.forEach((variable, index) => {
    translatedOutput = translatedOutput.replace(
      new RegExp(`__VAR_${index}__`, "g"),
      variable,
    );
  });

  return translatedOutput;
}

/**
 * Iterates recursively through JSON leaf nodes, validating individual key integrity.
 */
async function translateNode(
  node: any,
  targetLang: string,
  namespace: string,
  pathString: string,
  keyCache: Record<string, string>,
  oldTranslations: Record<string, string> = {},
): Promise<any> {
  if (typeof node === "object" && node !== null) {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(node)) {
      const currentPath = pathString ? `${pathString}.${key}` : key;
      result[key] = await translateNode(
        value,
        targetLang,
        namespace,
        currentPath,
        keyCache,
        oldTranslations,
      );
    }
    return result;
  }

  if (!node || typeof node !== "string") return node;

  const currentStringHash = calculateHash(node);
  const cacheMapKey = `${namespace}:${targetLang}:${pathString}`;

  if (
    keyCache[cacheMapKey] === currentStringHash &&
    oldTranslations[pathString]
  ) {
    return oldTranslations[pathString];
  }

  const translationResult = await fetchCloudTranslation(node, targetLang);
  keyCache[cacheMapKey] = currentStringHash;
  return translationResult;
}

/**
 * Extracts a flat key-value map from a nested translation JSON object to easily read historical fields.
 */
function flattenJson(
  obj: any,
  prefix = "",
  res: Record<string, string> = {},
): Record<string, string> {
  for (const [key, value] of Object.entries(obj)) {
    const p = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "object" && value !== null) {
      flattenJson(value, p, res);
    } else {
      res[p] = value as string;
    }
  }
  return res;
}

/**
 * Forwards a completed single language dictionary map down to the persistence server.
 */
async function sendToBackend(
  namespace: string,
  lang: string,
  payload: any,
): Promise<void> {
  const response = await fetch(BACKEND_SYNC_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.INTERNAL_API_SECRET_TOKEN || "DEVELOPMENT_FALLBACK_TOKEN"}`,
    },
    body: JSON.stringify({ namespace, lang, payload }),
  });

  // Intercept non-200 responses to isolate server issues
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`\n❌ Server HTTP Error Status: ${response.status}`);
    console.error(
      `📝 Raw Server Response Output:\n${errorText.slice(0, 600)}\n`,
    );
    throw new Error(
      `Server rejected upload context [${lang}/${namespace}.json] with status ${response.status}`,
    );
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const rawBody = await response.text();
    console.error(
      `\n❌ Expected JSON response, but received Content-Type: "${contentType}"`,
    );
    console.error(`📝 Raw Server Response Body:\n${rawBody.slice(0, 600)}\n`);
    throw new Error(
      `Invalid response format from server for namespace [${namespace}]`,
    );
  }

  const result = await response.json();
  if (result.status !== "SUCCESS") {
    throw new Error(
      `Server rejected upload context [${lang}/${namespace}.json]: ${result.message}`,
    );
  }
}

/**
 * Orchestrates localized string compilation workflows from your workstation.
 */
async function runLocalizationPipeline(): Promise<void> {
  if (!fs.existsSync(ENGLISH_SOURCE_DIR)) {
    console.warn(
      "No local English language catalogs found to extract text configurations from.",
    );
    return;
  }

  const files = fs
    .readdirSync(ENGLISH_SOURCE_DIR)
    .filter((file) => file.endsWith(".json"));
  const cacheData = loadHashCache();
  let cacheUpdated = false;

  for (const file of files) {
    const namespace = path.basename(file, ".json");
    const sourceFilePath = path.join(ENGLISH_SOURCE_DIR, file);
    const rawEnglishContent = fs.readFileSync(sourceFilePath, "utf-8");
    const englishContent = JSON.parse(rawEnglishContent);

    const currentFileHash = calculateHash(rawEnglishContent);

    if (cacheData.files[namespace] === currentFileHash) {
      console.log(
        `No changes detected for namespace: [${namespace}]. Skipping translation sync.`,
      );
      continue;
    }

    cacheUpdated = true;
    console.log(
      `Changes discovered inside [${namespace}]. Syncing primary English source...`,
    );
    await sendToBackend(namespace, "en", englishContent);

    await Promise.all(
      TARGET_LANGUAGES.map(async (targetLang) => {
        console.log(
          `Processing execution context: [${namespace}] -> [${targetLang}]`,
        );

        const targetLocalFolder = path.join(BASE_LOCALES_DIR, targetLang);
        const targetFilePath = path.join(targetLocalFolder, file);

        let oldFlatTranslations: Record<string, string> = {};
        if (fs.existsSync(targetFilePath)) {
          try {
            oldFlatTranslations = flattenJson(
              JSON.parse(fs.readFileSync(targetFilePath, "utf-8")),
            );
          } catch {
            oldFlatTranslations = {};
          }
        }

        const translatedDataPayload = await translateNode(
          englishContent,
          targetLang,
          namespace,
          "",
          cacheData.keys,
          oldFlatTranslations,
        );

        fs.mkdirSync(targetLocalFolder, { recursive: true });
        fs.writeFileSync(
          targetFilePath,
          JSON.stringify(translatedDataPayload, null, 2),
        );

        await sendToBackend(namespace, targetLang, translatedDataPayload);
      }),
    );

    cacheData.files[namespace] = currentFileHash;
  }

  if (cacheUpdated) {
    saveHashCache(cacheData);
    console.log(
      "All localization mappings successfully processed and uploaded.",
    );
  } else {
    console.log("Localization pipeline completed. Everything is up to date.");
  }
}

runLocalizationPipeline().catch(console.error);
