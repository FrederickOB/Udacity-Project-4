import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { createLogger } from '../utils/logger'
import { TodosAccess } from './todosAcess'
const logger = createLogger('todo-access')

const XAWS = AWSXRay.captureAWS(AWS)

// TODO: Implement the fileStorage logic

export class TodosStorage {
  constructor(
    private readonly s3 = new XAWS.S3({ signatureVersion: 'v4' }),
    private readonly bucketName = process.env.ATTACHMENT_S3_BUCKET,
    private readonly urlExpiration = process.env.SIGNED_URL_EXPIRATION
  ) {}

  async getAttachmentUrl(attachmentId: string): Promise<string> {
    const attachmentUrl = `https://${this.bucketName}.s3.amazonaws.com/${attachmentId}`
    return attachmentUrl
  }

  async getUploadUrl(attachmentId: string): Promise<string> {
    const uploadUrl = this.s3.getSignedUrl('putObject', {
      Bucket: this.bucketName,
      Key: attachmentId,
      Expires: parseInt(this.urlExpiration)
    })
    return uploadUrl
  }
}

const todosStorage = new TodosStorage()
const todosAccess = new TodosAccess()

export async function updateAttachmentUrl(
  userId: string,
  todoId: string,
  attachmentId: string
) {
  logger.info(`Generating attachment URL for attachment `)

  const attachmentUrl = await todosStorage.getAttachmentUrl(attachmentId)

  logger.info(`Updating todo attachment`, {
    userId,
    todoId
  })

  const item = await todosAccess.getTodoItem(todoId)

  if (!item) throw new Error('Item not found')

  if (item.userId !== userId) {
    logger.error(`User does not have permission to update todo`)
    throw new Error('User is not authorized ')
  }

  await todosAccess.updateAttachmentUrl(todoId, attachmentUrl)
}

export async function generateUploadUrl(attachmentId: string): Promise<string> {
  logger.info(`Generating upload URL for attachment`)

  const uploadUrl = await todosStorage.getUploadUrl(attachmentId)

  return uploadUrl
}
