"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // טעינת משתמש מתוך localStorage
  const loadUserFromStorage = () => {
    const savedUser = localStorage.getItem("user");

    if (savedUser) {
      setUser(JSON.parse(savedUser));
    } else {
      setUser(null);
      setUnreadCount(0);
    }
  };

  // טעינת מספר הודעות שלא נקראו
  const loadUnreadCount = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setUnreadCount(0);
        return;
      }

      const response = await fetch(
        "http://localhost:5000/api/chat/unread-count",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setUnreadCount(0);
        return;
      }

      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      setUnreadCount(0);
    }
  };

  // בדיקה אם יש משתמש שמור בדפדפן
  useEffect(() => {
    loadUserFromStorage();

    // האזנה להתחברות משתמש
    window.addEventListener("userLogin", loadUserFromStorage);

    // ניקוי ההאזנה כשאין צורך בקומפוננטה
    return () => {
      window.removeEventListener("userLogin", loadUserFromStorage);
    };
  }, []);

  // טעינת מונה הודעות כאשר המשתמש מחובר
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    loadUnreadCount();

    // רענון מונה הודעות כל כמה שניות
    const intervalId = setInterval(() => {
      loadUnreadCount();
    }, 5000);

    return () => {
      clearInterval(intervalId);
    };
  }, [user]);

  // התנתקות מהמערכת
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
    setUnreadCount(0);

    router.push("/login");
  };

  // קבלת id של המשתמש המחובר
  const userId = user?._id || user?.id;

  return (
    <nav className="w-full px-8 py-4 bg-white shadow-sm flex items-center justify-between">
      <Link
        href={user ? "/feed" : "/"}
        className="text-2xl font-bold text-[#3b2f2f]"
      >
        BookConnect
      </Link>

      <div className="flex items-center gap-6 text-[#3b2f2f] font-medium">
        {!user && <Link href="/">Home</Link>}

        <Link href="/groups">Groups</Link>

        {user && <Link href="/feed">Feed</Link>}

        {user && <Link href="/stats">Stats</Link>}

        {user && (
          <Link
            href="/chat"
            className="relative flex items-center gap-2 text-[#3b2f2f] hover:text-[#6f4e37] transition"
          >
            <span>Messages</span>

            {unreadCount > 0 && (
              <span className="min-w-6 rounded-full bg-[#6f4e37] px-2 py-0.5 text-center text-xs font-bold text-white">
                {unreadCount}
              </span>
            )}
          </Link>
        )}

        <Link
          href="/search"
          className="text-xl hover:scale-110 transition"
          title="Search"
        >
          🔍
        </Link>

        {user ? (
          <>
            <Link
              href={`/users/${userId}`}
              className="text-[#6f4e37] hover:underline"
              title="View My Profile"
            >
              Hello, {user.fullName}
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl bg-[#6f4e37] px-4 py-2 text-white hover:bg-[#5a3f2d] transition"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link href="/login">Login</Link>
            <Link href="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}