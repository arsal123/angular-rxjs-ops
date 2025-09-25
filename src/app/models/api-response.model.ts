/**
 * Generic API response interface for consistent response handling
 */
export interface ApiResponse<T> {
  page?: number;
  per_page?: number;
  total?: number;
  total_pages?: number;
  data: T;
  support?: {
    url: string;
    text: string;
  };
}

/**
 * API error response interface
 */
export interface ApiError {
  error: string;
  message?: string;
  status?: number;
  timestamp?: string;
}