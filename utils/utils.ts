import { api } from '@/utils/apiClient';

// Thin back-compat wrapper around api.get; the `token` argument is ignored
// because the api client fetches the current token via the auth provider.
export async function fetchJsonWithAuth<T>(
  url: string,
  _token: string,
  signal?: AbortSignal,
): Promise<T> {
  return api.get<T>(url, { signal });
}

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};
