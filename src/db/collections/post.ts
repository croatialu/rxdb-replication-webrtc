import type {
  ExtractDocumentTypeFromTypedRxJsonSchema,
  RxCollection,
  RxDocument,
  RxJsonSchema,
} from 'rxdb'
import { toTypedRxJsonSchema } from 'rxdb'

export const postSchemaLiteral = {
  version: 0,
  title: 'post schema with indexes',
  primaryKey: 'nanoId',
  type: 'object',
  properties: {
    nanoId: {
      type: 'string',
      maxLength: 21,
    },
    name: {
      type: 'string',
      maxLength: 100, // <- string-fields that are used as an index, must have set maxLength.
    },
    content: {
      type: 'string',
    },
    createAt: {
      type: 'string',
      format: 'date-time',
      maxLength: 100,
    },
  },
  required: ['nanoId', 'name', 'createAt'],
  indexes: ['name', 'createAt'],
} as const

const schemaTyped = toTypedRxJsonSchema(postSchemaLiteral)

// aggregate the document type from the schema
export type PostDocType = ExtractDocumentTypeFromTypedRxJsonSchema<
  typeof schemaTyped
>

// create the typed RxJsonSchema from the literal typed object.
export const postSchema: RxJsonSchema<PostDocType> = postSchemaLiteral

export interface PostDocMethods {}

export type PostDocument = RxDocument<PostDocType, PostDocMethods>

export interface PostCollectionMethods {}

export type PostCollection = RxCollection<
  PostDocType,
  PostDocMethods,
  PostCollectionMethods
>

export const postDocMethods: PostDocMethods = {}

export const postCollectionMethods: PostCollectionMethods = {}
