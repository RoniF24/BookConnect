"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import PostComments from "@/components/PostComments";

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.id;

  // שמירת פרטי המשתמש שמוצג בפרופיל
  const [user, setUser] = useState(null);

  // שמירת המשתמש שמחובר כרגע למערכת
  const [loggedInUser, setLoggedInUser] = useState(null);

  // הודעת שגיאה לטעינת פרופיל
  const [message, setMessage] = useState("");

  // הודעת שגיאה לטעינת פוסטים
  const [postsMessage, setPostsMessage] = useState("");

  // מצב טעינה של פרטי המשתמש
  const [isLoading, setIsLoading] = useState(true);

  // מצב טעינה של פוסטים
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);

  // שמירת הפוסטים של המשתמש שמוצג בפרופיל
  const [userPosts, setUserPosts] = useState([]);

  // טעינת פרטי המשתמש לפי ה-id שבכתובת
  const fetchUser = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/users/${userId}`);
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Could not fetch user");
        return;
      }

      setUser(data.user);
    } catch (error) {
      setMessage("Could not connect to the server");
    } finally {
      setIsLoading(false);
    }
  };

  // טעינת הפוסטים של המשתמש לפי הרשאות הצפייה של המשתמש המחובר
  const fetchUserPosts = async () => {
    try {
      const token = localStorage.getItem("token");

      // רק משתמש מחובר יכול לצפות בפוסטים בפרופיל
      if (!token) {
        setPostsMessage("Login to see this user's posts");
        setIsLoadingPosts(false);
        return;
      }

      // שליחת בקשה לשרת לקבלת פוסטים של משתמש מסוים
      const response = await fetch(
        `http://localhost:5000/api/posts/user/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setPostsMessage(data.message || "Could not fetch user posts");
        return;
      }

      setUserPosts(data.posts || []);
      setPostsMessage("");
    } catch (error) {
      setPostsMessage("Could not connect to the server");
    } finally {
      setIsLoadingPosts(false);
    }
  };

  // טעינה ראשונית של המשתמש, המשתמש המחובר והפוסטים
  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    if (savedUser) {
      setLoggedInUser(JSON.parse(savedUser));
    }

    if (userId) {
      fetchUser();
      fetchUserPosts();
    }
  }, [userId]);

  // זיהוי המשתמש המחובר
  const loggedInUserId = loggedInUser?._id || loggedInUser?.id;

  // בדיקה האם זה הפרופיל של המשתמש המחובר
  const isMyProfile = loggedInUserId && loggedInUserId === user?._id;

  // תצוגת טעינה
  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#f8f3ed] flex items-center justify-center">
        <p className="text-[#5f4b4b] text-lg">Loading profile...</p>
      </main>
    );
  }

  // תצוגת שגיאה בפרופיל
  if (message) {
    return (
      <main className="min-h-screen bg-[#f8f3ed] flex items-center justify-center px-6">
        <section className="bg-white rounded-2xl shadow-sm p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold text-[#3b2f2f]">Profile Error</h1>
          <p className="mt-3 text-[#5f4b4b]">{message}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f3ed] px-6 py-12">
      <section className="mx-auto max-w-3xl">
        {/* פרטי המשתמש */}
        <div className="bg-white rounded-2xl shadow-sm p-8 border border-[#eadfd4]">
          <div className="flex items-center gap-5">
            {/* תמונת פרופיל או אות ראשונה */}
            {user.profileImageUrl ? (
              <img
                src={`http://localhost:5000${user.profileImageUrl}`}
                alt={`${user.fullName} profile`}
                className="w-20 h-20 rounded-full border border-[#eadfd4] object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-[#6f4e37] text-white flex items-center justify-center text-3xl font-bold">
                {user.fullName.charAt(0).toUpperCase()}
              </div>
            )}

            <div>
              <h1 className="text-3xl font-bold text-[#3b2f2f]">
                {user.fullName}
              </h1>

              <p className="mt-1 text-[#5f4b4b]">{user.email}</p>

              <p className="mt-2 inline-block rounded-full bg-[#f8f3ed] px-3 py-1 text-sm text-[#6f4e37]">
                {user.role}
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                {isMyProfile && (
                  <Link
                    href="/profile/edit"
                    className="block w-fit rounded-xl bg-[#6f4e37] px-4 py-2 text-white hover:bg-[#5a3f2d] transition"
                  >
                    Edit Profile
                  </Link>
                )}

                {loggedInUser && !isMyProfile && (
                  <Link
                    href={`/chat?userId=${user._id}`}
                    className="block w-fit rounded-xl border border-[#6f4e37] px-4 py-2 text-[#6f4e37] hover:bg-[#f8f3ed] transition"
                  >
                    💬 Message
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* ביוגרפיה */}
          <div className="mt-8">
            <h2 className="text-xl font-bold text-[#3b2f2f]">Bio</h2>

            <p className="mt-2 text-[#5f4b4b]">
              {user.bio ? user.bio : "No bio yet."}
            </p>
          </div>

          {/* ז'אנרים מועדפים */}
          <div className="mt-8">
            <h2 className="text-xl font-bold text-[#3b2f2f]">
              Favorite Genres
            </h2>

            {user.favoriteGenres && user.favoriteGenres.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {user.favoriteGenres.map((genre, index) => (
                  <span
                    key={index}
                    className="rounded-full bg-[#f8f3ed] px-3 py-1 text-sm text-[#6f4e37]"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-[#5f4b4b]">No favorite genres yet.</p>
            )}
          </div>

          {/* תאריך יצירת פרופיל */}
          <div className="mt-8 border-t border-[#eadfd4] pt-6">
            <p className="text-sm text-[#5f4b4b]">
              Profile created at:{" "}
              {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* אזור הפוסטים של המשתמש */}
        <div className="mt-8 bg-white rounded-2xl shadow-sm p-8 border border-[#eadfd4]">
          <h2 className="text-2xl font-bold text-[#3b2f2f]">
            {isMyProfile ? "My Posts" : `${user.fullName}'s Posts`}
          </h2>

          <p className="mt-2 text-[#5f4b4b]">
            Posts published by this user. Posts from private groups are hidden
            unless you are also a member.
          </p>

          {/* טעינת פוסטים */}
          {isLoadingPosts && (
            <p className="mt-5 text-[#5f4b4b]">Loading posts...</p>
          )}

          {/* שגיאת פוסטים */}
          {!isLoadingPosts && postsMessage && (
            <div className="mt-5 rounded-xl border border-[#eadfd4] bg-[#f8f3ed] px-4 py-3">
              <p className="text-[#5f4b4b]">{postsMessage}</p>

              {postsMessage.includes("Login") && (
                <Link
                  href="/login"
                  className="mt-3 inline-block rounded-xl bg-[#6f4e37] px-4 py-2 text-white hover:bg-[#5a3f2d] transition"
                >
                  Login
                </Link>
              )}
            </div>
          )}

          {/* אין פוסטים */}
          {!isLoadingPosts && !postsMessage && userPosts.length === 0 && (
            <p className="mt-5 text-[#5f4b4b]">
              This user has not published any posts yet.
            </p>
          )}

          {/* רשימת פוסטים */}
          {!isLoadingPosts && !postsMessage && userPosts.length > 0 && (
            <div className="mt-6 flex flex-col items-center gap-5">
              {userPosts.map((post) => (
                <article
                  key={post._id}
                  className="w-full max-w-[520px] rounded-2xl border border-[#eadfd4] bg-[#f8f3ed] p-5"
                >
                  {post.isHidden ? (
                    <>
                      {/* פוסט מוסתר מקבוצה פרטית שהמשתמש המחובר לא חבר בה */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-[#3b2f2f]">
                          Hidden post
                        </p>

                        {post.group?._id && (
                          <Link
                            href={`/groups/${post.group._id}`}
                            className="rounded-full bg-white px-3 py-1 text-sm text-[#6f4e37] hover:bg-[#eadfd4] transition"
                          >
                            {post.group.name}
                          </Link>
                        )}
                      </div>

                      <p className="mt-3 text-[#5f4b4b]">
                        Hidden post — private group
                      </p>

                      <p className="mt-2 text-xs text-[#8a7474]">
                        {new Date(post.createdAt).toLocaleString()}
                      </p>
                    </>
                  ) : (
                    <>
                      {/* פוסט שהמשתמש המחובר מורשה לראות */}
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
                            className="rounded-full bg-white px-3 py-1 text-sm text-[#6f4e37] hover:bg-[#eadfd4] transition"
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
                        <div className="mt-4 overflow-hidden rounded-xl bg-white">
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
                        loggedUserId={loggedInUserId}
                        onPostUpdated={(updatedPost) => {
                          setUserPosts((prevPosts) =>
                            prevPosts.map((item) =>
                              item._id === updatedPost._id
                                ? updatedPost
                                : item
                            )
                          );
                        }}
                      />
                    </>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}