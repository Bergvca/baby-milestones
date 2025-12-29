export async function fetchJsonWithAuth<T>(url: string, token: string, signal?: AbortSignal): Promise<T> {
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
        },
        signal,
    });

    if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`Request failed (${response.status}): ${text || response.statusText}`);
    }

    return (await response.json()) as T;
}