export type ApiEnvelope<T> = {
  status: "success" | "error";
  message?: string;
  data: T;
};

export type ApiFieldError = { field: string; message: string };

export type ApiErrorShape = {
  status: "error";
  code?: string;
  message: string;
  errors?: ApiFieldError[];
};