export const SUCCESS_MESSAGES = {
  JAM_KERJA: {
    START: 'Jam kerja dimulai',
    END: 'Jam kerja diakhiri',
    PAUSE: 'Sesi dijeda',
    RESUME: 'Sesi dilanjutkan',
  },
} as const;

export const ERROR_DEFINITIONS = {
  NOT_FOUND: { code: 404, message: 'Not Found' },
  BAD_REQUEST: { code: 400, message: 'Bad Request' },
  FORBIDDEN: { code: 403, message: 'Forbidden' },
  UNAUTHORIZED: { code: 401, message: 'Unauthorized' },
  VALIDATION: { code: 400, message: 'Validation error' },
} as const;
