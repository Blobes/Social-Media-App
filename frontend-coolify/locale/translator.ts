import fs from "fs";
import path from "path";
import crypto from "crypto";

const TARGET_LANGUAGES = ["es", "fr", "de", "it", "pt", "zh", "ja", "ar", "ru"];
const BASE_LOCALES_DIR = path.join(import.meta.dirname, "versions");
const ENGLISH_SOURCE_DIR = path.join(BASE_LOCALES_DIR, "en");
const CACHE_FILE_PATH = path.join(BASE_LOCALES_DIR, ".hashcache.json");

const BACKEND_SYNC_ENDPOINT = `${process.env.NEXT_PUBLIC_API_URL}/upload/localization/sync`;

type PipelineMode = "translate-only" | "upload-only" | "translate-and-upload";

interface HashCache {
  files: Record<string, string>;
  keys: Record<string, string>;
}

// Tracks translation counts and keys per language session without mixing with upload logs.
interface TranslationMetrics {
  totalKeysTranslated: number;
  translatedKeysList: string[];
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
 * Parses execution directives out of raw runtime CLI string flags.
 */
function parsePipelineMode(): PipelineMode {
  const modeArg = process.argv.find((arg) => arg.startsWith("--mode="));
  if (!modeArg) return "translate-and-upload";

  const mode = modeArg.split("=")[1] as PipelineMode;
  if (
    ["translate-only", "upload-only", "translate-and-upload"].includes(mode)
  ) {
    return mode;
  }

  console.warn(
    `Unknown mode execution argument context: "${mode}". Defaulting to translate-and-upload.`,
  );
  return "translate-and-upload";
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
 * Executes a deterministic translation request via DeepL API.
 */
async function translateWithDeepL(
  text: string,
  targetLang: string,
): Promise<string> {
  const DEEPL_AUTH_KEY = process.env.NEXT_PUBLIC_DEEPL_API_KEY;

  const response = await fetch("https://api-free.deepl.com/v2/translate", {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${DEEPL_AUTH_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: [text],
      target_lang: targetLang.toUpperCase(), // e.g., "ES", "DE", "FR"
      formality: "prefer_less",
    }),
  });

  const data = await response.json();
  return data.translations[0].text;
}

/**
 * Translates source text using an AI API with timeout guardrails.
 */
async function fetchCloudTranslation(
  text: string,
  targetLang: string,
): Promise<string> {
  const OPENROUTER_API_KEY = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;

  if (!OPENROUTER_API_KEY) {
    throw new Error(
      "Missing OpenRouter authentication credentials in environment setup.",
    );
  }

  // Visual debugging log tracking active key
  // console.log(`[Translating to ${targetLang}]: key -> "${key}"`);

  const tagRegex = /<([a-zA-Z0-9_]+)>/g;
  const sourceTags: string[] = [];
  let tagMatch;
  while ((tagMatch = tagRegex.exec(text)) !== null) {
    sourceTags.push(tagMatch[1]);
  }

  const varRegex = /\{\{[^}]+\}\}/g;
  const sourceVars = text.match(varRegex) || [];

  const systemPrompt = `You are a precise, production-grade translation engine. 

  CRITICAL CONSTRAINTS:
  1. Translate the provided input string completely and naturally into the target language.
  2. Maintain the exact professional tone and meaning of the source text.
  3. Only translate the plain text segments. Never translate, alter, or omit English-script variables (e.g., {{variable}}) or HTML/XML tags (e.g., <strong>, </span>). Preserve them exactly as written in the source text.
  4. Do NOT invent, add, or insert any formatting symbols, brackets, or code elements that are not explicitly present in the input text.
  5. Output ONLY the raw translated string. No markdown, no conversational text.`;

  //"google/gemini-2.0-flash-exp:free"

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      signal: AbortSignal.timeout(90000), // Force 30s timeout so script never hangs
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://funstakes.com",
        "X-Title": "Funstakes Translator",
      },
      body: JSON.stringify({
        model: "openrouter/free",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: `Target Language: ${targetLang}\nSource Text: ${text}`,
          },
        ],
        temperature: 0.0,
        max_tokens: 150, // Reduced from 1024 to prevent credit cap errors on short text
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `OpenRouter API failure [Status ${response.status}]: ${errorText}`,
    );
  }

  const payload = await response.json();
  let translatedOutput = payload.choices?.[0]?.message?.content?.trim() || text;

  for (const variable of sourceVars) {
    if (!translatedOutput.includes(variable)) {
      console.warn(
        `Dynamic variable missing: "${variable}". Falling back to source text.`,
      );
      return text;
    }
  }

  for (const tag of sourceTags) {
    const hasOpening = translatedOutput.includes(`<${tag}>`);
    const hasClosing = translatedOutput.includes(`</${tag}>`);
    if (!hasOpening || !hasClosing) {
      console.warn(
        `Guardrail Alert: Mangled tag structure for "<${tag}>". Falling back to source text.`,
      );
      return text;
    }
  }
  return translatedOutput.replace(/\s+/g, " ").trim();
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
  metrics: TranslationMetrics,
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
        metrics,
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

  const translationResult = await translateWithDeepL(node, targetLang);
  keyCache[cacheMapKey] = currentStringHash;

  // Log track details for this translated instance
  metrics.totalKeysTranslated += 1;
  metrics.translatedKeysList.push(pathString);

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
 * Orchestrates localized string compilation workflows from your workstation.
 */
async function runLocalizationPipeline(): Promise<void> {
  const mode = parsePipelineMode();
  console.log(`Starting pipeline lifecycle in [${mode}] execution tier.`);

  if (!fs.existsSync(ENGLISH_SOURCE_DIR)) {
    console.warn(
      "No local English language catalogs found to extract text configurations from.",
    );
    return;
  }

  const files = fs
    .readdirSync(ENGLISH_SOURCE_DIR)
    .filter((file) => file.endsWith(".json"));

  const currentNamespaces = new Set(
    files.map((file) => path.basename(file, ".json")),
  );
  const cacheData = loadHashCache();
  let cacheUpdated = false;

  // Global namespace cleanup loop for completely dropped JSON modules
  for (const cachedNamespace of Object.keys(cacheData.files)) {
    if (!currentNamespaces.has(cachedNamespace)) {
      console.log(
        `Cleanup: Namespace [${cachedNamespace}] was deleted. Removing from hash cache registry.`,
      );
      delete cacheData.files[cachedNamespace];

      const prefixToMatch = `${cachedNamespace}:`;
      for (const key of Object.keys(cacheData.keys)) {
        if (key.startsWith(prefixToMatch)) {
          delete cacheData.keys[key];
        }
      }
      cacheUpdated = true;
    }
  }

  for (const file of files) {
    const namespace = path.basename(file, ".json");
    const sourceFilePath = path.join(ENGLISH_SOURCE_DIR, file);
    const rawEnglishContent = fs.readFileSync(sourceFilePath, "utf-8");
    const englishContent = JSON.parse(rawEnglishContent);
    const currentFileHash = calculateHash(rawEnglishContent);

    // Deep key cleanup loop for checking modified or partial content trees
    const flatEnglish = flattenJson(englishContent);
    const prefixToMatch = `${namespace}:`;

    for (const cacheKey of Object.keys(cacheData.keys)) {
      if (cacheKey.startsWith(prefixToMatch)) {
        const parts = cacheKey.split(":");
        const pathString = parts.slice(2).join(":");

        if (!(pathString in flatEnglish)) {
          delete cacheData.keys[cacheKey];
          cacheUpdated = true;
        }
      }
    }

    if (
      cacheData.files[namespace] === currentFileHash &&
      mode !== "upload-only"
    ) {
      console.log(
        `No changes detected for namespace: [${namespace}]. Skipping compilation sync.`,
      );
      continue;
    }

    cacheUpdated = true;

    if (mode === "upload-only" || mode === "translate-and-upload") {
      console.log(
        `Syncing primary English source for [${namespace}] to cloud endpoint...`,
      );
      await sendToBackend(namespace, "en", englishContent);
    }

    for (const targetLang of TARGET_LANGUAGES) {
      const targetLocalFolder = path.join(BASE_LOCALES_DIR, targetLang);
      const targetFilePath = path.join(targetLocalFolder, file);
      let translatedDataPayload: any = null;

      if (mode === "translate-only" || mode === "translate-and-upload") {
        const metrics: TranslationMetrics = {
          totalKeysTranslated: 0,
          translatedKeysList: [],
        };

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

        translatedDataPayload = await translateNode(
          englishContent,
          targetLang,
          namespace,
          "",
          cacheData.keys,
          metrics,
          oldFlatTranslations,
        );

        // Isolated Translation Console Feedback Block
        console.log(
          `\n🌐 [Translation Engine] -> Module: [${namespace}] | Language: [${targetLang}]`,
        );
        console.log(
          `   Count: ${metrics.totalKeysTranslated} key(s) processed.`,
        );
        if (metrics.translatedKeysList.length > 0) {
          console.log(`   Keys:  [ ${metrics.translatedKeysList.join(", ")} ]`);
        }

        fs.mkdirSync(targetLocalFolder, { recursive: true });
        fs.writeFileSync(
          targetFilePath,
          JSON.stringify(translatedDataPayload, null, 2),
        );
      }

      if (mode === "upload-only" || mode === "translate-and-upload") {
        if (!translatedDataPayload) {
          if (fs.existsSync(targetFilePath)) {
            translatedDataPayload = JSON.parse(
              fs.readFileSync(targetFilePath, "utf-8"),
            );
          } else {
            console.warn(
              `Skipping cloud push for [${targetLang}/${file}]. Local translation file target missing.`,
            );
            continue;
          }
        }

        console.log(
          `🚀 Syncing [${targetLang}] translation array payload for [${namespace}] to backend storage.`,
        );
        await sendToBackend(namespace, targetLang, translatedDataPayload);
      }
    }

    cacheData.files[namespace] = currentFileHash;
  }

  if (cacheUpdated) {
    saveHashCache(cacheData);
    console.log("\nAll pipeline actions successfully processed and tracked.");
  } else {
    console.log("Localization pipeline completed. Everything is up to date.");
  }
}

runLocalizationPipeline().catch(console.error);
