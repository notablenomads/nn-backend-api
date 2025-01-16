/* eslint-disable @typescript-eslint/naming-convention */
export const CONSTANTS = {
  ERRORS_PREFIX: 'APP',
};

function formatErrorCode(input: string): string {
  return input.replace(/\s/g, '_').toUpperCase();
}

function createError(code: string, message: string) {
  return {
    code: `${CONSTANTS.ERRORS_PREFIX}_${formatErrorCode(code)}`,
    message,
  };
}

const ERRORS = {
  GENERIC: {
    INTERNAL_SERVER_ERROR: createError('INTERNAL_SERVER_ERROR', 'Internal server error'),
  },
  NOT_FOUND: (entity: string, fieldName?: string, fieldValue?: string) => ({
    code: `${CONSTANTS.ERRORS_PREFIX}_${formatErrorCode(entity)}_NOT_FOUND`,
    message: `The ${entity}${fieldName && fieldValue ? ' with ' + fieldName + ' ' + fieldValue : ''} was not found.`,
  }),
  ALREADY_EXISTS: (entity: string, fieldName?: string, fieldValue?: string) => ({
    code: `${CONSTANTS.ERRORS_PREFIX}_${formatErrorCode(entity)}_ALREADY_EXISTS`,
    message: `A ${entity}${fieldName && fieldValue ? ' with ' + fieldName + ' ' + fieldValue : ''} already exists`,
  }),
};

export { ERRORS };
