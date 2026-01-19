export type ApiResponse<T = unknown> = {
  isSuccess: boolean;
  data?: T;
  error?: ApiResponseError;
};

export type ApiResponseError = {
  message: string;
  code?: string | number;
};
