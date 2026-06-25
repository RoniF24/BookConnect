"use client";

import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import Link from "next/link";

export default function ChatPage() {
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  const [loggedUser, setLoggedUser] = useState(null);
  const [chatUsers, setChatUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [targetUserId, setTargetUserId] = useState(null);

  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [message, setMessage] = useState("");

  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);

  // גלילה לסוף השיחה
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  };

  // טעינת userId מהכתובת אם הגיעו מפרופיל משתמש
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userIdFromUrl = params.get("userId");

    if (userIdFromUrl) {
      setTargetUserId(userIdFromUrl);
    }
  }, []);

  // טעינת משתמש מחובר
  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      setMessage("You must be logged in to use the chat");
      setIsLoadingUsers(false);
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    setLoggedUser(parsedUser);
  }, []);

  // מיון משתמשי צ'אט: מי שיש ממנו הודעות חדשות יופיע למעלה
  const sortChatUsers = (users) => {
    return [...users].sort((a, b) => {
      const aUnread = a.unreadCount || 0;
      const bUnread = b.unreadCount || 0;

      if (aUnread > 0 && bUnread === 0) {
        return -1;
      }

      if (aUnread === 0 && bUnread > 0) {
        return 1;
      }

      if (bUnread !== aUnread) {
        return bUnread - aUnread;
      }

      return a.fullName.localeCompare(b.fullName);
    });
  };

  // איפוס מונה הודעות שלא נקראו עבור משתמש מסוים
  const clearUnreadForUser = (userId) => {
    setChatUsers((previousUsers) =>
      sortChatUsers(
        previousUsers.map((user) =>
          user._id === userId ? { ...user, unreadCount: 0 } : user
        )
      )
    );
  };

  // העלאת מונה הודעות שלא נקראו עבור משתמש מסוים
  const increaseUnreadForUser = (userId) => {
    setChatUsers((previousUsers) =>
      sortChatUsers(
        previousUsers.map((user) =>
          user._id === userId
            ? { ...user, unreadCount: (user.unreadCount || 0) + 1 }
            : user
        )
      )
    );
  };

  // טעינת משתמשים שאפשר לדבר איתם
  const loadChatUsers = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setMessage("You must be logged in to use the chat");
        return;
      }

      setIsLoadingUsers(true);

      const response = await fetch("http://localhost:5000/api/chat/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Could not fetch chat users");
        return;
      }

      setChatUsers(sortChatUsers(data.users || []));
    } catch (error) {
      setMessage("Could not connect to the server");
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // טעינת שיחה עם משתמש שנבחר
  const loadConversation = async (user) => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setMessage("You must be logged in to use the chat");
        return;
      }

      setSelectedUser(user);
      setIsLoadingConversation(true);
      setMessage("");

      const response = await fetch(
        `http://localhost:5000/api/chat/conversation/${user._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Could not fetch conversation");
        return;
      }

      setMessages(data.messages || []);

      // ברגע שפתחנו שיחה — ההודעות ממנה נחשבות נקראו
      clearUnreadForUser(user._id);
    } catch (error) {
      setMessage("Could not connect to the server");
    } finally {
      setIsLoadingConversation(false);
    }
  };

  // סימון שיחה כנקראה ורענון הודעות בלי לשנות בחירה
  const refreshOpenConversation = async (user) => {
    try {
      const token = localStorage.getItem("token");

      if (!token || !user?._id) {
        return;
      }

      const response = await fetch(
        `http://localhost:5000/api/chat/conversation/${user._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setMessages(data.messages || []);
        clearUnreadForUser(user._id);
      }
    } catch (error) {
      // לא מציגים שגיאה כדי לא להפריע בזמן אמת
    }
  };

  // טעינת משתמשים אחרי שהמשתמש המחובר נטען
  useEffect(() => {
    if (loggedUser) {
      loadChatUsers();
    }
  }, [loggedUser]);

  // פתיחת שיחה אוטומטית אם הגיע userId בכתובת
  useEffect(() => {
    if (!targetUserId || chatUsers.length === 0 || selectedUser) {
      return;
    }

    const userToOpen = chatUsers.find((user) => user._id === targetUserId);

    if (userToOpen) {
      loadConversation(userToOpen);
    }
  }, [targetUserId, chatUsers, selectedUser]);

  // חיבור Socket.io אחרי שיש משתמש מחובר
  useEffect(() => {
    if (!loggedUser) {
      return;
    }

    const userId = loggedUser._id || loggedUser.id;

    socketRef.current = io("http://localhost:5000");

    socketRef.current.emit("joinChat", userId);

    // קבלת הודעה בזמן אמת
    socketRef.current.on("receiveMessage", (newMessage) => {
      const senderId = newMessage.sender?._id || newMessage.sender;
      const receiverId = newMessage.receiver?._id || newMessage.receiver;
      const selectedUserId = selectedUser?._id;

      const isCurrentConversation =
        selectedUserId &&
        ((senderId === userId && receiverId === selectedUserId) ||
          (senderId === selectedUserId && receiverId === userId));

      if (isCurrentConversation) {
        // אם השיחה פתוחה כרגע — נרענן כדי שההודעה תסומן כנקראה ב-DB
        refreshOpenConversation(selectedUser);
      } else if (receiverId === userId) {
        // אם ההודעה הגיעה משיחה אחרת — נסמן ליד השולח שיש הודעה חדשה
        increaseUnreadForUser(senderId);
      }
    });

    socketRef.current.on("chatError", (errorMessage) => {
      setMessage(errorMessage);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [loggedUser, selectedUser]);

  // גלילה לסוף כשיש הודעות חדשות
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // שליחת הודעה בזמן אמת
  const handleSendMessage = (event) => {
    event.preventDefault();

    if (!loggedUser || !selectedUser) {
      setMessage("Please select a user first");
      return;
    }

    if (!messageText.trim()) {
      setMessage("Message text is required");
      return;
    }

    const senderId = loggedUser._id || loggedUser.id;

    socketRef.current?.emit("sendMessage", {
      senderId,
      receiverId: selectedUser._id,
      text: messageText,
    });

    setMessageText("");
    setMessage("");
  };

  return (
    <main className="min-h-screen bg-[#f8f3ed] px-6 py-12">
      <section className="mx-auto max-w-6xl">
        <div className="rounded-2xl border border-[#eadfd4] bg-white p-8 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="book-title-shadow book-font text-4xl font-bold text-[#3b2f2f]">
                Chat
              </h1>

              <p className="mt-3 text-[#5f4b4b]">
                Send real-time messages to other BookConnect users.
              </p>
            </div>

            <Link
              href="/feed"
              className="rounded-xl border border-[#6f4e37] px-5 py-2 text-[#6f4e37] transition hover:bg-[#f8f3ed]"
            >
              Back to Feed
            </Link>
          </div>

          {message && (
            <p className="mt-6 rounded-xl border border-[#eadfd4] bg-[#f8f3ed] px-4 py-3 text-[#5f4b4b]">
              {message}
            </p>
          )}

          {!loggedUser ? (
            <div className="mt-8 rounded-2xl border border-[#eadfd4] bg-[#fffaf5] p-6">
              <p className="text-[#5f4b4b]">Please login to use the chat.</p>

              <Link
                href="/login"
                className="mt-4 inline-block rounded-xl bg-[#6f4e37] px-5 py-2 text-white transition hover:bg-[#5a3f2d]"
              >
                Login
              </Link>
            </div>
          ) : (
            <div className="mt-8 grid gap-6 md:grid-cols-[300px_1fr]">
              {/* רשימת משתמשים */}
              <aside className="rounded-2xl border border-[#eadfd4] bg-[#fffaf5] p-5">
                <h2 className="text-xl font-bold text-[#3b2f2f]">Users</h2>

                {isLoadingUsers && (
                  <p className="mt-4 text-sm text-[#5f4b4b]">
                    Loading users...
                  </p>
                )}

                {!isLoadingUsers && chatUsers.length === 0 && (
                  <p className="mt-4 text-sm text-[#5f4b4b]">
                    No other users found.
                  </p>
                )}

                <div className="mt-4 space-y-3">
                  {chatUsers.map((user) => {
                    const unreadCount = user.unreadCount || 0;
                    const isSelected = selectedUser?._id === user._id;

                    return (
                      <button
                        key={user._id}
                        type="button"
                        onClick={() => loadConversation(user)}
                        className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                          isSelected
                            ? "border-[#6f4e37] bg-[#6f4e37] text-white"
                            : unreadCount > 0
                            ? "border-[#6f4e37] bg-white text-[#3b2f2f] shadow-sm"
                            : "border-[#eadfd4] bg-white text-[#3b2f2f] hover:bg-[#f8f3ed]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="block font-semibold">
                              {user.fullName}
                            </span>

                            <span
                              className={`block text-xs ${
                                isSelected ? "text-white" : "text-[#8a7474]"
                              }`}
                            >
                              {user.email}
                            </span>
                          </div>

                          {unreadCount > 0 && (
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-bold ${
                                isSelected
                                  ? "bg-white text-[#6f4e37]"
                                  : "bg-[#6f4e37] text-white"
                              }`}
                            >
                              {unreadCount} new
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </aside>

              {/* אזור שיחה */}
              <section className="rounded-2xl border border-[#eadfd4] bg-[#fffaf5] p-5">
                {selectedUser ? (
                  <>
                    <div className="border-b border-[#eadfd4] pb-4">
                      <h2 className="text-xl font-bold text-[#3b2f2f]">
                        Chat with {selectedUser.fullName}
                      </h2>

                      <p className="text-sm text-[#5f4b4b]">
                        {selectedUser.email}
                      </p>
                    </div>

                    <div className="mt-5 h-[420px] overflow-y-auto rounded-2xl bg-white p-4">
                      {isLoadingConversation && (
                        <p className="text-[#5f4b4b]">
                          Loading conversation...
                        </p>
                      )}

                      {!isLoadingConversation && messages.length === 0 && (
                        <p className="text-[#5f4b4b]">
                          No messages yet. Start the conversation.
                        </p>
                      )}

                      <div className="space-y-3">
                        {messages.map((chatMessage) => {
                          const senderId =
                            chatMessage.sender?._id || chatMessage.sender;
                          const loggedUserId = loggedUser._id || loggedUser.id;
                          const isMine = senderId === loggedUserId;

                          return (
                            <div
                              key={chatMessage._id}
                              className={`flex ${
                                isMine ? "justify-end" : "justify-start"
                              }`}
                            >
                              <div
                                className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                                  isMine
                                    ? "bg-[#6f4e37] text-white"
                                    : "bg-[#f8f3ed] text-[#3b2f2f] border border-[#eadfd4]"
                                }`}
                              >
                                <p className="whitespace-pre-wrap text-sm">
                                  {chatMessage.text}
                                </p>

                                <p
                                  className={`mt-1 text-[11px] ${
                                    isMine
                                      ? "text-white/80"
                                      : "text-[#8a7474]"
                                  }`}
                                >
                                  {new Date(
                                    chatMessage.createdAt
                                  ).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          );
                        })}

                        <div ref={messagesEndRef} />
                      </div>
                    </div>

                    <form
                      onSubmit={handleSendMessage}
                      className="mt-4 flex gap-3"
                    >
                      <input
                        type="text"
                        value={messageText}
                        onChange={(event) =>
                          setMessageText(event.target.value)
                        }
                        placeholder="Write a message..."
                        className="flex-1 rounded-xl border border-[#eadfd4] bg-white px-4 py-3 text-[#3b2f2f] outline-none focus:border-[#6f4e37]"
                      />

                      <button
                        type="submit"
                        className="rounded-xl bg-[#6f4e37] px-5 py-2 text-white transition hover:bg-[#5a3f2d]"
                      >
                        Send
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="flex h-[520px] items-center justify-center rounded-2xl bg-white p-6 text-center">
                    <div>
                      <h2 className="text-2xl font-bold text-[#3b2f2f]">
                        Select a user
                      </h2>

                      <p className="mt-2 text-[#5f4b4b]">
                        Choose someone from the list to start chatting.
                      </p>
                    </div>
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}