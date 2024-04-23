import type {
  ExtractDocumentTypeFromTypedRxJsonSchema,
  RxCollection,
  RxDocument,
  RxJsonSchema,
} from 'rxdb'
import { toTypedRxJsonSchema } from 'rxdb'

export const userSchemaLiteral = {
  version: 0,
  title: 'user schema with indexes',
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
    createAt: {
      type: 'string',
      format: 'date-time',
      maxLength: 100,
    },
  },
  required: ['nanoId', 'name', 'createAt'],
  indexes: ['name', 'createAt'],
} as const

const schemaTyped = toTypedRxJsonSchema(userSchemaLiteral)

// aggregate the document type from the schema
export type UserDocType = ExtractDocumentTypeFromTypedRxJsonSchema<
  typeof schemaTyped
>

// create the typed RxJsonSchema from the literal typed object.
export const userSchema: RxJsonSchema<UserDocType> = userSchemaLiteral

export interface UserDocMethods {}

export type UserDocument = RxDocument<UserDocType, UserDocMethods>

export interface UserCollectionMethods {}

export type UserCollection = RxCollection<
  UserDocType,
  UserDocMethods,
  UserCollectionMethods
>

export const userDocMethods: UserDocMethods = {}

export const userCollectionMethods: UserCollectionMethods = {}
