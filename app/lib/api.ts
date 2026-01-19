import { ApiResponse, ApiResponseError } from "@/types/api";
import { NextResponse } from "next/server";

export function createSuccessApiResponse<T>(data?: T) {
  const response: ApiResponse<T> = { isSuccess: true, data };
  return NextResponse.json(response, { status: 200 });
}

export function createFailedApiResponse<T>(
  error: ApiResponseError,
  status: number,
) {
  const response: ApiResponse<T> = { isSuccess: false, error };
  return NextResponse.json(response, { status });
}
