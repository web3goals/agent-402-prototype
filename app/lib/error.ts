import axios from "axios";

export function getErrorString(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data || error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
