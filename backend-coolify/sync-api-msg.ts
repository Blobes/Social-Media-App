import * as fs from "fs";
import * as path from "path";
// @ts-ignore
import { MESSAGES_REGISTRY } from "./packages/shared/src/constants/msgRegistry.ts";

interface IFlatDictionary {
  [key: string]: string;
}

/**
 * Recursively flattens a nested object structure into dot-notated string key-value pairs.
 */
const flattenObject = (obj: any, prefix = ""): IFlatDictionary => {
  let results: IFlatDictionary = {};

  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;

    const currentKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];

    if (typeof value === "function") {
      const funcStr = value.toString();
      const paramMatch = funcStr.match(/\(([^)]*)\)/);
      const rawParams = paramMatch && paramMatch[1] ? paramMatch[1].trim() : "";

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

          const evaluation = value(dynamicArgsObj);
          if (evaluation && evaluation.i18nKey) {
            results[evaluation.i18nKey] = evaluation.message || "";
          }
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

          const evaluation = value(...args);
          if (evaluation && evaluation.i18nKey) {
            results[evaluation.i18nKey] = evaluation.message || "";
          }
        }
      } else {
        const evaluation = value();
        if (evaluation && evaluation.i18nKey) {
          results[evaluation.i18nKey] = evaluation.message || "";
        }
      }
    } else if (value && typeof value === "object" && "i18nKey" in value) {
      results[value.i18nKey] = value.message || "";
    } else if (value && typeof value === "object") {
      Object.assign(results, flattenObject(value, currentKey));
    } else if (typeof value === "string") {
      results[currentKey] = value;
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
 * Synchronizes key structures between the code registry definition and the translation json template.
 */
const syncMessages = (): void => {
  const jsonFilePath = path.resolve(
    process.cwd(),
    "../frontend-coolify/locale/versions/en/apimessage.json",
  );

  if (!fs.existsSync(jsonFilePath)) {
    console.error(`Target JSON file not found at path: ${jsonFilePath}`);
    process.exit(1);
  }

  const rawJsonContent = fs.readFileSync(jsonFilePath, "utf-8").trim();
  let existingJsonStructure = {};

  if (rawJsonContent) {
    try {
      existingJsonStructure = JSON.parse(rawJsonContent);
    } catch (parseError) {
      console.warn(
        `[WARNING]: Failed to parse ${jsonFilePath}. Initializing with blank structure.`,
      );
      existingJsonStructure = {};
    }
  }

  const flattenedJson = flattenObject(existingJsonStructure);
  const flattenedRegistry = flattenObject(MESSAGES_REGISTRY);
  const updatedKeys: string[] = [];
  const addedKeys: string[] = [];
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

  if (addedKeys.length === 0 && updatedKeys.length === 0) {
    console.log(
      "Translation key maps are fully synchronized. No changes needed.",
    );
    return;
  }

  const updatedNestedStructure = unflattenObject(synchronizedFlatResult);
  fs.writeFileSync(
    jsonFilePath,
    JSON.stringify(updatedNestedStructure, null, 2),
    "utf-8",
  );

  console.log(
    `Synchronization complete: Added ${addedKeys.length} keys, Updated ${updatedKeys.length} altered keys.`,
  );

  if (addedKeys.length > 0) {
    console.log("\n[ADDED KEYS]:");
    addedKeys.forEach((key) => console.log(`  + ${key}`));
  }
  if (updatedKeys.length > 0) {
    console.log("\n[UPDATED KEYS]:");
    updatedKeys.forEach((key) => console.log(`  ~ ${key}`));
  }
};

syncMessages();
