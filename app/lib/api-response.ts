import { z } from 'zod';

export const ErrorDetailSchema = z.object({
  message: z.string(),
  code: z.string().optional(),
  details: z.unknown().optional()
});

export const SuccessResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    status: z.literal('success'),
    data: dataSchema,
    error: z.null(),
    metadata: z.record(z.unknown()).optional()
  });

export const ErrorResponseSchema = z.object({
  status: z.literal('error'),
  data: z.null(),
  error: ErrorDetailSchema,
  metadata: z.record(z.unknown()).optional()
});

export type ErrorDetail = z.infer<typeof ErrorDetailSchema>;
export type SuccessResponse<T> = {
  status: 'success';
  data: T;
  error: null;
  metadata?: Record<string, unknown>;
};
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

export function createSuccessResponse<T>(
  data: T,
  metadata?: Record<string, unknown>
): SuccessResponse<T> {
  const response: SuccessResponse<T> = {
    status: 'success',
    data,
    error: null
  };
  if (metadata) {
    response.metadata = metadata;
  }
  return response;
}

export function createValidatedSuccessResponse<T extends z.ZodTypeAny>(
  data: unknown,
  dataSchema: T,
  metadata?: Record<string, unknown>
): SuccessResponse<z.infer<T>> {
  const validatedData = dataSchema.parse(data);
  const response = createSuccessResponse(validatedData, metadata);
  SuccessResponseSchema(dataSchema).parse(response);
  return response;
}

export function createErrorResponse(
  message: string,
  code?: string,
  details?: unknown,
  metadata?: Record<string, unknown>
): ErrorResponse {
  const response: ErrorResponse = {
    status: 'error',
    data: null,
    error: {
      message
    }
  };
  if (code) {
    response.error.code = code;
  }
  if (details !== undefined) {
    response.error.details = details;
  }
  if (metadata) {
    response.metadata = metadata;
  }
  ErrorResponseSchema.parse(response);
  return response;
}

export function validateApiResponse(response: unknown): ApiResponse<unknown> {
  if (typeof response !== 'object' || response === null) {
    throw new Error('Response must be an object');
  }

  const obj = response as Record<string, unknown>;

  if (obj.status === 'error') {
    return ErrorResponseSchema.parse(response);
  }

  if (obj.status === 'success') {
    return SuccessResponseSchema(z.unknown()).parse(response);
  }

  throw new Error(`Invalid response status: ${obj.status}`);
}

export function validateApiResponseWithSchema<T extends z.ZodTypeAny>(
  response: unknown,
  dataSchema: T
): ApiResponse<z.infer<T>> {
  if (typeof response !== 'object' || response === null) {
    throw new Error('Response must be an object');
  }

  const obj = response as Record<string, unknown>;

  if (obj.status === 'error') {
    return ErrorResponseSchema.parse(response);
  }

  if (obj.status === 'success') {
    return SuccessResponseSchema(dataSchema).parse(response) as SuccessResponse<
      z.infer<T>
    >;
  }

  throw new Error(`Invalid response status: ${obj.status}`);
}
