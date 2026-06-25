"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PostComments from "@/components/PostComments";

export default function FeedPage() {
  const [posts, setPosts] = useState([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loggedUser, setLoggedUser] = useState(null);

  // טעינת הפיד של המשתמש המחובר
  const loadFeedPosts = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setMessage("You must be logged in to see your feed");
        setIsLoading(false);
        return;
      }

      const response = await fetch("http://localhost:5000/api/posts/feed", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Could not fetch feed posts");
        return;
      }

      setPosts(data.posts || []);
      setMessage("");
    } catch (error) {
      setMessage("Could not connect to the server");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    if (savedUser) {
      setLoggedUser(JSON.parse(savedUser));
    }

    loadFeedPosts();
  }, []);

  const loggedUserId = loggedUser?._id || loggedUser?.id;

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#f8f3ed] flex items-center justify-center">
        <p className="text-[#5f4b4b] text-lg">Loading feed...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f3ed] px-6 py-12">
      <section className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#3b2f2f]">My Feed</h1>

          <p className="mt-3 text-[#5f4b4b]">
            Posts from reading groups you are a member of.
          </p>
        </div>

        {message && (
          <div className="rounded-2xl border border-[#eadfd4] bg-white p-6 text-center">
            <p className="text-[#5f4b4b]">{message}</p>

            {!localStorage.getItem("token") && (
              <Link
                href="/login"
                className="mt-4 inline-block rounded-xl bg-[#6f4e37] px-5 py-2 text-white hover:bg-[#5a3f2d] transition"
              >
                Login
              </Link>
            )}
          </div>
        )}

        {!message && posts.length === 0 && (
          <div className="rounded-2xl border border-[#eadfd4] bg-white p-8 text-center">
            <h2 className="text-2xl font-bold text-[#3b2f2f]">
              No posts in your feed yet
            </h2>

            <p className="mt-3 text-[#5f4b4b]">
              Join groups or create posts to start seeing content here.
            </p>

            <Link
              href="/groups"
              className="mt-5 inline-block rounded-xl border border-[#6f4e37] px-5 py-2 text-[#6f4e37] hover:bg-[#f8f3ed] transition"
            >
              Browse Groups
            </Link>
          </div>
        )}

        {!message && posts.length > 0 && (
          <div className="flex flex-col items-center gap-5">
            {posts.map((post) => (
              <article
                key={post._id}
                className="w-full max-w-[520px] rounded-2xl border border-[#eadfd4] bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-[#3b2f2f]">
                      {post.author?.fullName || "Unknown user"}
                    </p>

                    <p className="text-xs text-[#8a7474]">
                      {new Date(post.createdAt).toLocaleString()}
                    </p>
                  </div>

                  {post.group?._id && (
                    <Link
                      href={`/groups/${post.group._id}`}
                      className="rounded-full bg-[#f8f3ed] px-3 py-1 text-sm text-[#6f4e37] hover:bg-[#eadfd4] transition"
                    >
                      {post.group.name}
                    </Link>
                  )}
                </div>

                {post.text && (
                  <p className="mt-4 whitespace-pre-wrap text-[#5f4b4b]">
                    {post.text}
                  </p>
                )}

                {(post.imageFileId || post.imageUrl) && (
                  <div className="mt-4 overflow-hidden rounded-xl bg-[#f8f3ed]">
                    <img
                      src={
                        post.imageFileId
                          ? `http://localhost:5000/api/posts/file/${post.imageFileId}`
                          : `http://localhost:5000${post.imageUrl}`
                      }
                      alt="Post image"
                      className="w-full h-auto rounded-xl object-contain"
                    />
                  </div>
                )}

                {(post.videoFileId || post.videoUrl) && (
                  <video
                    controls
                    src={
                      post.videoFileId
                        ? `http://localhost:5000/api/posts/file/${post.videoFileId}`
                        : `http://localhost:5000${post.videoUrl}`
                    }
                    className="mt-4 w-full rounded-xl"
                  />
                )}

                <PostComments
                  post={post}
                  loggedUserId={loggedUserId}
                  onPostUpdated={(updatedPost) => {
                    setPosts((prevPosts) =>
                      prevPosts.map((item) =>
                        item._id === updatedPost._id ? updatedPost : item
                      )
                    );
                  }}
                />
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}