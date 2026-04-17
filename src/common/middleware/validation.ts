import { NextFunction, Request, Response } from 'express'
import { ZodType } from 'zod'
import { appError } from '../../common/utils/global-error-handler';
type reqType = keyof Request
type schemaType = Partial<Record<reqType, ZodType>>

export const Validation = (schema: schemaType) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const errorValidation = []

    for (const key of Object.keys(schema) as reqType[]) {
      if (!schema[key]) continue
      const result = await schema[key]!.safeParseAsync(req[key])

      if (!result?.success) {
        errorValidation.push(result.error.message)
      }
    }

    if (errorValidation.length) {
      throw new appError(JSON.parse(errorValidation as unknown as string), 400)
    }
    next()
  }
}