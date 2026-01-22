import axios from "axios";

export function getErrorString(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return JSON.stringify({
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
  }
  if (error instanceof Error) {
    return error.message;
  }
  return JSON.stringify(error, (_, value) =>
    typeof value === "bigint" ? value.toString() : value,
  );
}
