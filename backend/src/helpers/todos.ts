import { TodosAccess } from './todosAcess'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { createLogger } from '../utils/logger'
import * as uuid from 'uuid'

const logger = createLogger('todos')
// TODO: Implement businessLogic
const todoAccess = new TodosAccess()

export async function getAllTodos(userId: string): Promise<TodoItem[]> {
  logger.info(`Retrieving all todos for user ${userId}`, { userId })
  return todoAccess.getAllTodos(userId)
}

export async function createTodo(
  createTodoRequest: CreateTodoRequest,
  userId: string
): Promise<TodoItem> {
  const todoId = uuid.v4()

  const newItem: TodoItem = {
    userId,
    todoId,
    createdAt: new Date().toISOString(),
    done: false,
    attachmentUrl: null,
    ...createTodoRequest
  }

  logger.info(`Creating todo ${todoId} for user ${userId}`, {
    userId,
    todoId,
    todoItem: newItem
  })

  await todoAccess.createTodo(newItem)

  return newItem
}

export async function updateTodo(
  userId: string,
  todoId: string,
  updateTodoRequest: UpdateTodoRequest
) {
  logger.info(`Updating todo `, {
    userId,
    todoId,
    todoUpdate: updateTodoRequest
  })

  const item = await todoAccess.getTodoItem(todoId)

  if (!item) throw new Error('Item not found')

  if (item.userId !== userId) {
    logger.error(`User does not have permission to update todo item`)
    throw new Error('User is not authorized')
  }

  todoAccess.updateTodoItem(todoId, updateTodoRequest as TodoUpdate)
}

export async function deleteTodo(userId: string, todoId: string) {
  logger.info(`Deleting todo`, { userId, todoId })

  const item = await todoAccess.getTodoItem(todoId)

  if (!item) throw new Error('Item not found')

  if (item.userId !== userId) {
    logger.error(`User  does not have permission to delete todo item`)
    throw new Error('User is not authorized')
  }

  todoAccess.deleteTodoItem(todoId)
}
