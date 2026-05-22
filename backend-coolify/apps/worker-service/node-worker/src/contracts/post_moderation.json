{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "PostModerationContract",
  "type": "object",
  "properties": {
    "postId": {
      "type": "string"
    },
    "postType": {
      "type": "string",
      "enum": ["GIST", "STAKE"]
    },
    "userId": {
      "type": "string"
    },
    "caption": {
      "type": "string"
    },
    "media": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "url": {
            "type": "string",
            "format": "uri"
          },
          "fileKey": {
            "type": "string"
          },
          "type": {
            "type": "string",
            "enum": ["IMAGE", "VIDEO"]
          },
          "thumbnailUrl": {
            "type": ["string", "null"],
            "format": "uri"
          },
          "mimeType": {
            "type": "string"
          },
          "size": {
            "type": "integer"
          },
          "dimensions": {
            "type": "object",
            "properties": {
              "width": { "type": "number" },
              "height": { "type": "number" },
              "aspectRatio": { "type": "number" }
            },
            "required": ["width", "height", "aspectRatio"]
          },
          "blurHash": {
            "type": ["string", "null"]
          },
          "storageProvider": {
            "type": "string"
          }
        },
        "required": ["url", "fileKey", "type", "storageProvider"]
      }
    },
    "event": {
      "type": "string",
      "enum": ["POST_CREATION", "POST_UPDATE"]
    },
    "topics": {
      "type": "array",
      "items": { "type": "string" }
    },
    "skipModeration": {
      "type": "boolean",
      "default": false
    }
  },
  "required": ["postId", "postType", "userId", "event"],
  "anyOf": [
    {
      "required": ["caption"]
    },
    {
      "required": ["media"],
      "properties": {
        "media": { "minItems": 1 }
      }
    }
  ]
}
