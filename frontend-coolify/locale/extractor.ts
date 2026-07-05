import * as fs from "fs";
import * as path from "path";
import { MESSAGE_REGISTRY } from "../packages/core/constants/msgRegistry.ts";

interface IFlatDictionary {
  [key: string]: string;
}

// Added feature toggle flag to enable or disable parsing
const ENABLE_TAG_INDEX_CONVERSION = false;

/**
 * Transforms inline HTML and custom semantic markup tags into sequential numerical index keys.
 * Example: "Hello<anchor1>World</anchor1>" -> "Hello<0>World</0>"
 */
const convertHtmlTagsToIndexes = (htmlStr: string): string => {
  // Return early when feature execution toggle is turned off
  if (!ENABLE_TAG_INDEX_CONVERSION) {
    return htmlStr;
  }

  if (!htmlStr || typeof htmlStr !== "string" || !htmlStr.includes("<")) {
    return htmlStr;
  }
  let processedStr = htmlStr;
  const tagList: string[] = [];

  // Matches alphanumeric tag names like <anchor1>, <mainLayout>, <strong>
  const openTagRegex = /<([a-zA-Z0-9]+)(?:\s+[^>]*)*>/g;
  let match: RegExpExecArray | null;

  // Track unique tags sequentially as they appear in the string
  while ((match = openTagRegex.exec(htmlStr)) !== null) {
    const tagName = match[1]!;
    if (!tagList.includes(tagName)) {
      tagList.push(tagName);
    }
  }

  // Iterate over discovered tag names and swap boundaries with matching indices
  tagList.forEach((tagName, index) => {
    const openRegex = new RegExp(`<${tagName}(?:\\s+[^>]*)*>`, "g");
    const closeRegex = new RegExp(`</${tagName}>`, "g");

    processedStr = processedStr.replace(openRegex, `<${index}>`);
    processedStr = processedStr.replace(closeRegex, `</${index}>`);
  });

  return processedStr;
};

/**
 * Recursively flattens a nested object structure into dot-notated string key-value pairs.
 * Sanitizes keys with namespace identifiers (e.g. "common:key" -> "key") for file syncing.
 */
const flattenObject = (obj: any, prefix = ""): IFlatDictionary => {
  let results: IFlatDictionary = {};
  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
    const currentKey = prefix ? `${prefix}.${key}` : key;

    if (typeof obj[key] === "function") {
      const funcStr = obj[key].toString();
      const paramMatch = funcStr.match(/\(([^)]*)\)/);
      const rawParams = paramMatch && paramMatch[1] ? paramMatch[1].trim() : "";

      let evaluated: any;
      if (rawParams) {
        if (rawParams.startsWith("{") && rawParams.endsWith("}")) {
          const cleanedObjParams = rawParams.slice(1, -1).trim();
          const args = cleanedObjParams
            .split(",")
            .map((p: any) => p.trim().split("=")[0]!.trim());
          const dynamicArgsObj = args.reduce((acc: any, arg: any) => {
            if (arg) acc[arg] = `{{${arg}}}`;
            return acc;
          }, {});
          evaluated = obj[key](dynamicArgsObj);
        } else {
          const args = rawParams.split(",").map((p: any) => {
            const cleanParam = p
              .trim()
              .split(":")[0]!
              .trim()
              .split("=")[0]!
              .trim();
            return `{{${cleanParam}}}`;
          });
          evaluated = obj[key](...args);
        }
      } else {
        evaluated = obj[key]();
      }

      const rawKey = evaluated.tKey || currentKey;
      const cleanKey = rawKey.includes(":") ? rawKey.split(":")[1]! : rawKey;

      // Parse layout markup tags into numeric positions before writing to localized sheets
      results[cleanKey] = convertHtmlTagsToIndexes(evaluated.tValue);
    } else if (
      obj[key] &&
      typeof obj[key] === "object" &&
      "tKey" in obj[key] &&
      "tValue" in obj[key]
    ) {
      const rawKey = obj[key].tKey;
      const cleanKey = rawKey.includes(":") ? rawKey.split(":")[1]! : rawKey;

      // Convert standard static registry objects containing raw tags to indexes
      results[cleanKey] = convertHtmlTagsToIndexes(obj[key].tValue);
    } else if (obj[key] && typeof obj[key] === "object") {
      Object.assign(results, flattenObject(obj[key], currentKey));
    } else if (typeof obj[key] === "string") {
      // Retain already converted JSON files without re-processing index tags directly
      results[currentKey] = obj[key];
    }
  }
  return results;
};

/**
 * Reconstructs a deep nested object hierarchy out of dot-notated structural paths.
 */
const unflattenObject = (data: IFlatDictionary): any => {
  const result: any = {};
  for (const key in data) {
    if (!Object.prototype.hasOwnProperty.call(data, key)) continue;
    const parts = key.split(".");
    let current = result;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]!;
      if (i === parts.length - 1) {
        current[part] = data[key];
      } else {
        current[part] = current[part] || {};
        current = current[part];
      }
    }
  }
  return result;
};

/**
 * Synchronizes key structures between code registries and structural localized JSON output files.
 */
const syncRegistryFiles = (): void => {
  const basePath = path.resolve(process.cwd(), "./locale/versions/en");

  for (const namespace in MESSAGE_REGISTRY) {
    if (!Object.prototype.hasOwnProperty.call(MESSAGE_REGISTRY, namespace))
      continue;

    const jsonFilePath = path.join(basePath, `${namespace}.json`);
    const targetRegistry = (MESSAGE_REGISTRY as any)[namespace];

    let existingJsonStructure = {};
    if (fs.existsSync(jsonFilePath)) {
      try {
        const rawJsonContent = fs.readFileSync(jsonFilePath, "utf-8");
        existingJsonStructure = JSON.parse(rawJsonContent || "{}");
      } catch (err) {
        console.warn(
          `Could not parse existing JSON file for namespace "${namespace}". Overwriting clean.`,
        );
      }
    } else {
      const dir = path.dirname(jsonFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }

    const flattenedJson = flattenObject(existingJsonStructure);
    const flattenedRegistry = flattenObject(targetRegistry);

    const updatedKeys: string[] = [];
    const addedKeys: string[] = [];
    const deletedKeys: string[] = [];
    const synchronizedFlatResult: IFlatDictionary = {};

    for (const registryKey in flattenedRegistry) {
      const registryValue = flattenedRegistry[registryKey]!;
      if (registryKey in flattenedJson) {
        if (flattenedJson[registryKey] !== registryValue) {
          synchronizedFlatResult[registryKey] = registryValue;
          updatedKeys.push(registryKey);
        } else {
          synchronizedFlatResult[registryKey] = flattenedJson[registryKey]!;
        }
      } else {
        synchronizedFlatResult[registryKey] = registryValue;
        addedKeys.push(registryKey);
      }
    }

    for (const jsonKey in flattenedJson) {
      if (!(jsonKey in flattenedRegistry)) {
        deletedKeys.push(jsonKey);
      }
    }

    if (
      addedKeys.length === 0 &&
      updatedKeys.length === 0 &&
      deletedKeys.length === 0
    ) {
      console.log(
        `Namespace [${namespace}]: Fully synchronized. No updates needed.`,
      );
      continue;
    }

    const updatedNestedStructure = unflattenObject(synchronizedFlatResult);
    fs.writeFileSync(
      jsonFilePath,
      JSON.stringify(updatedNestedStructure, null, 2),
      "utf-8",
    );

    console.log(
      `Namespace [${namespace}] synced: Added ${addedKeys.length} keys, Updated ${updatedKeys.length} keys, Removed ${deletedKeys.length} keys.`,
    );

    if (addedKeys.length > 0) {
      addedKeys.forEach((key) => console.log(`  + ${key}`));
    }
    if (updatedKeys.length > 0) {
      updatedKeys.forEach((key) => console.log(`  ~ ${key}`));
    }
    if (deletedKeys.length > 0) {
      deletedKeys.forEach((key) => console.log(`  - ${key}`));
    }
  }
};

syncRegistryFiles();
