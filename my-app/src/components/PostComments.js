"use client";

import { useEffect, useState } from "react";

export default function PostComments({ post, loggedUserId, onPostUpdated }) {
  const [comments, setComments] = useState(post.comments || []);
  const [commentText, setCommentText] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // עדכון תגובות אם הפוסט נטען מחדש מבחוץ
  useEffect(() => {
    setComments(post.comments || []);
  }, [post.comments]);

  // הוספת תגובה חדשה לפוסט
  const handleAddComment = async (event) => {
    event.preventDefault();

    if (!commentText.trim()) {
      setMessage("Comment cannot be empty");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setMessage("Login to comment");
        return;
      }

      setIsSubmitting(true);
      setMessage("");

      const response = await fetch(
        `http://localhost:5000/api/posts/${post._id}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ text: commentText }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Could not add comment");
        return;
      }

      setComments(data.post.comments || []);
      setCommentText("");
      setMessage("");

      if (onPostUpdated) {
        onPostUpdated(data.post);
      }
    } catch (error) {
      setMessage("Could not connect to the server");
    } finally {
      setIsSubmitting(false);
    }
  };

  // מחיקת תגובה קיימת
  const handleDeleteComment = async (commentId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this comment?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setMessage("Login to delete comments");
        return;
      }

      const response = await fetch(
        `http://localhost:5000/api/posts/${post._id}/comments/${commentId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Could not delete comment");
        return;
      }

      setComments(data.post.comments || []);
      setMessage("");

      if (onPostUpdated) {
        onPostUpdated(data.post);
      }
    } catch (error) {
      setMessage("Could not connect to the server");
    }
  };

  return (
    <section className="mt-5 border-t border-[#eadfd4] pt-4">
      <h4 className="text-sm font-semibold text-[#3b2f2f]">
        Comments ({comments.length})
      </h4>

      {comments.length === 0 ? (
        <p className="mt-2 text-sm text-[#8a7474]">No comments yet.</p>
      ) : (
        <div className="mt-3 space-y-3">
          {comments.map((comment) => {
            const commentUserId = comment.user?._id || comment.user;
            const postAuthorId = post.author?._id || post.author;

            const canDelete =
              loggedUserId &&
              (loggedUserId === commentUserId || loggedUserId === postAuthorId);

            return (
              <div
                key={comment._id}
                className="rounded-xl border border-[#eadfd4] bg-white px-3 py-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#3b2f2f]">
                      {comment.user?.fullName || "Unknown user"}
                    </p>

                    <p className="mt-1 whitespace-pre-wrap text-sm text-[#5f4b4b]">
                      {comment.text}
                    </p>

                    {comment.createdAt && (
                      <p className="mt-1 text-xs text-[#8a7474]">
                        {new Date(comment.createdAt).toLocaleString()}
                      </p>
                    )}
                  </div>

                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => handleDeleteComment(comment._id)}
                      className="rounded-lg border border-red-600 px-2 py-1 text-xs text-red-600 hover:bg-red-50 transition"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <form onSubmit={handleAddComment} className="mt-4 flex gap-2">
        <input
          type="text"
          value={commentText}
          onChange={(event) => setCommentText(event.target.value)}
          placeholder="Write a comment..."
          className="flex-1 rounded-xl border border-[#eadfd4] bg-white px-3 py-2 text-sm text-[#3b2f2f] outline-none focus:border-[#6f4e37]"
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-[#6f4e37] px-4 py-2 text-sm text-white hover:bg-[#5a3f2d] transition disabled:opacity-60"
        >
          {isSubmitting ? "Adding..." : "Comment"}
        </button>
      </form>

      {message && <p className="mt-2 text-sm text-red-700">{message}</p>}
    </section>
  );
}