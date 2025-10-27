import React, {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, FlatList, StyleSheet, Text, View} from 'react-native';
import {getAuth, onAuthStateChanged} from 'firebase/auth';
import {API_BASE_URL, POSTS_PATH} from "@/app/constants/api";

type Post = Record<string, unknown>;

const buildApiUrl = (path: string) => `${API_BASE_URL}${path}`;

function isPostArray(data: unknown): data is Post[] {
  return Array.isArray(data);
}

async function fetchJsonWithAuth<T>(url: string, token: string, signal?: AbortSignal): Promise<T> {
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

async function fetchPosts(token: string, signal?: AbortSignal): Promise<Post[]> {
  const data = await fetchJsonWithAuth<unknown>(buildApiUrl(POSTS_PATH), token, signal);
  return isPostArray(data) ? data : [];
}

function IndexScreen() {
  const [token, setToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Watch auth state and get JWT
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          const idToken = await user.getIdToken();
          setToken(idToken);
        } else {
          setToken(null);
        }
      } catch {
        setToken(null);
      } finally {
        setAuthLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  // Fetch posts when we have a token
  useEffect(() => {
    if (!token) return;

    const controller = new AbortController();

    setPostsLoading(true);
    setError(null);

    fetchPosts(token, controller.signal)
        .then(setPosts)
        .catch((e: unknown) => {
          setError(e instanceof Error ? e.message : 'Failed to fetch posts.');
          setPosts([]);
        })
        .finally(() => setPostsLoading(false));

    return () => controller.abort();
  }, [token]);

  const keyExtractor = useCallback((item: Post, index: number) => {
    const id = (item as any)?.id;
    return typeof id === 'string' || typeof id === 'number'
        ? String(id)
        : String(index);
  }, []);

  if (authLoading) {
    return (
        <View style={styles.center}>
          <ActivityIndicator color="#fff" />
          <Text style={styles.text}>Checking session…</Text>
        </View>
    );
  }

  if (!token) {
    return (
        <View style={styles.center}>
          <Text style={styles.text}>Please log in to see posts.</Text>
        </View>
    );
  }

  return (
      <View style={styles.container}>
        {postsLoading ? (
            <View style={styles.center}>
              <ActivityIndicator color="#fff" />
              <Text style={styles.text}>Loading posts…</Text>
            </View>
        ) : error ? (
            <Text style={styles.error}>Error: {error}</Text>
        ) : posts.length === 0 ? (
            <Text style={styles.text}>no posts yet</Text>
        ) : (
            <FlatList
                data={posts}
                keyExtractor={keyExtractor}
                contentContainerStyle={styles.listContent}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                      <Text style={styles.json}>
                        {JSON.stringify(item, null, 2)}
                      </Text>
                    </View>
                )}
            />
        )}
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
    padding: 16,
  },
  center: {
    flex: 1,
    backgroundColor: '#25292e',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  text: {
    color: '#fff',
    fontSize: 16,
  },
  error: {
    color: '#ff6b6b',
    fontSize: 14,
  },
  listContent: {
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#2f3640',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  json: {
    color: '#e6e6e6',
    fontFamily: 'monospace',
    fontSize: 12,
  },
});

export default IndexScreen;