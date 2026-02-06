
import React, {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, FlatList, Pressable, Text, View} from 'react-native';
import {getAuth, onAuthStateChanged} from 'firebase/auth';
import {POSTS_PATH} from "@/app/constants/api";
import Post from '@/components/Post';
import {Colors} from "@/components/colors";
import {screenStyles} from "@/components/screenStyles";
import {router, useFocusEffect} from "expo-router";
import {fetchJsonWithAuth} from "@/utils/utils";

type MediaFile = {
  file_md5: string;
};

type PostData = {
  id: number;
  date: string;
  description: string;
  selected_children_ids: number[];
  media_files: MediaFile[];
};


function isPostArray(data: unknown): data is PostData[] {
  return Array.isArray(data);
}

async function fetchPosts(token: string, signal?: AbortSignal): Promise<PostData[]> {
  const data = await fetchJsonWithAuth<unknown>(POSTS_PATH, token, signal);
  return isPostArray(data) ? data : [];
}

function IndexScreen() {
  const [token, setToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Function to refresh posts on focus
  const refreshPosts = useCallback(async () => {
    if (!token) return;

    const controller = new AbortController();
    setPostsLoading(true);
    setError(null);

    try {
      const newPosts = await fetchPosts(token, controller.signal);
      setPosts(newPosts);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch posts.');
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  }, [token]);


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

  // Fetch posts when we have a token or when refreshKey changes
  useEffect(() => {
    if (!token) return;
    refreshPosts();
  }, [token, refreshKey, refreshPosts]);

  // Refresh posts when screen comes into focus (when navigating from upload)
  useFocusEffect(
      useCallback(() => {
        if (token) {
          setRefreshKey(prev => prev + 1);
        }
      }, [token])
  );

  const keyExtractor = useCallback((item: PostData, index: number) => {
    const id = item?.id;
    return typeof id === 'string' || typeof id === 'number'
        ? String(id)
        : String(index);
  }, []);


  if (authLoading) {
    return (
        <View style={screenStyles.center}>
          <ActivityIndicator color={Colors.primary || '#fff'} />
          <Text style={screenStyles.text}>Checking session…</Text>
        </View>
    );
  }

  if (!token) {
    return (
        <View style={screenStyles.center}>
          <Text style={screenStyles.text}>Please log in to see posts.</Text>
        </View>
    );
  }

  return (
      <View style={screenStyles.container}>
        {postsLoading ? (
            <View style={screenStyles.center}>
              <ActivityIndicator color={Colors.primary || '#fff'} size="large" animating={true} style={{marginBottom: 16}} />
              <Text style={screenStyles.text}>Loading posts…</Text>
            </View>
        ) : error ? (
            <Text style={screenStyles.errorText}>Error: {error}</Text>
        ) : posts.length === 0 ? (
            <Text style={screenStyles.text}>no posts yet</Text>
        ) : (

            <FlatList
                data={posts}
                keyExtractor={keyExtractor}
                contentContainerStyle={screenStyles.listContent}
                renderItem={({ item }) => (
                    <Pressable
                        onPress={() => {
                          router.push({
                            pathname: '/post-detail',
                            params: {
                              postId: item.id,
                              date: item.date,
                              description: item.description,
                              selectedChildrenIds: JSON.stringify(item.selected_children_ids),
                              mediaFiles: JSON.stringify(item.media_files),
                            },
                          });
                        }}
                    >
                      <Post
                          id={item.id}
                          date={item.date}
                          text={item.description}
                          mediaFiles={item.media_files}
                          selectedChildrenIds={item.selected_children_ids}
                          token={token}
                          onDelete={() => {
                            // Refresh posts after deletion
                            setRefreshKey(prev => prev + 1);
                          }}
                          onEdit={() => {

                          }}
                      />
                    </Pressable>
                )}
            />
        )}
      </View>
  );
}

export default IndexScreen;