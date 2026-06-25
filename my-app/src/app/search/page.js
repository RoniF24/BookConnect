"use client";

import { useState } from "react";
import Link from "next/link";

export default function SearchPage() {
  // חיפוש משתמשים
  const [userSearchText, setUserSearchText] = useState("");

  // חיפוש קבוצות
  const [groupName, setGroupName] = useState("");
  const [groupCategory, setGroupCategory] = useState("");
  const [groupPrivacy, setGroupPrivacy] = useState("");
  const [groupOwner, setGroupOwner] = useState("");

  // תוצאות
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);

  // הודעות וטעינה
  const [message, setMessage] = useState("");
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);

  // חיפוש משתמשים לפי שם
  const handleUserSearch = async (event) => {
    event.preventDefault();

    setMessage("");
    setUsers([]);

    if (!userSearchText.trim()) {
      setMessage("Please enter a user search term");
      return;
    }

    try {
      setIsLoadingUsers(true);

      const response = await fetch(
        `http://localhost:5000/api/users/search?name=${encodeURIComponent(
          userSearchText.trim()
        )}`
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "User search failed");
        return;
      }

      setUsers(data.users || []);

      if (!data.users || data.users.length === 0) {
        setMessage("No users found");
      }
    } catch (error) {
      setMessage("Could not connect to the server");
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // הצגת כל המשתמשים
  const handleShowAllUsers = async () => {
    setMessage("");
    setUsers([]);

    try {
      setIsLoadingUsers(true);

      const response = await fetch("http://localhost:5000/api/users/all");
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Could not fetch users");
        return;
      }

      setUsers(data.users || []);

      if (!data.users || data.users.length === 0) {
        setMessage("No users found");
      }
    } catch (error) {
      setMessage("Could not connect to the server");
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // חיפוש קבוצות לפי כמה פרמטרים
  const handleGroupSearch = async (event) => {
    event.preventDefault();

    setMessage("");
    setGroups([]);

    if (
      !groupName.trim() &&
      !groupCategory.trim() &&
      !groupPrivacy &&
      !groupOwner.trim()
    ) {
      setMessage("Please enter at least one group search parameter");
      return;
    }

    try {
      setIsLoadingGroups(true);

      const params = new URLSearchParams();

      if (groupName.trim()) {
        params.append("name", groupName.trim());
      }

      if (groupCategory.trim()) {
        params.append("category", groupCategory.trim());
      }

      if (groupPrivacy) {
        params.append("isPrivate", groupPrivacy);
      }

      if (groupOwner.trim()) {
        params.append("owner", groupOwner.trim());
      }

      const response = await fetch(
        `http://localhost:5000/api/groups/search?${params.toString()}`
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Group search failed");
        return;
      }

      setGroups(data.groups || []);

      if (!data.groups || data.groups.length === 0) {
        setMessage("No groups found");
      }
    } catch (error) {
      setMessage("Could not connect to the server");
    } finally {
      setIsLoadingGroups(false);
    }
  };

  // ניקוי חיפוש משתמשים
  const handleClearUserSearch = () => {
    setUserSearchText("");
    setUsers([]);
    setMessage("");
  };

  // ניקוי חיפוש קבוצות
  const handleClearGroupSearch = () => {
    setGroupName("");
    setGroupCategory("");
    setGroupPrivacy("");
    setGroupOwner("");
    setGroups([]);
    setMessage("");
  };

  return (
    <main className="min-h-screen bg-[#f8f3ed] px-6 py-12">
      <section className="mx-auto max-w-5xl">
        <h1 className="text-4xl font-bold text-[#3b2f2f] text-center">
          Search BookConnect
        </h1>

        <p className="mt-3 text-center text-[#5f4b4b]">
          Search for users and groups in BookConnect.
        </p>

        {message && (
          <p className="mt-6 rounded-xl bg-white px-4 py-3 text-center text-[#5f4b4b] border border-[#eadfd4]">
            {message}
          </p>
        )}

        {/* חיפוש משתמשים */}
        <section className="mt-10 rounded-2xl bg-white p-6 shadow-sm border border-[#eadfd4]">
          <h2 className="text-2xl font-bold text-[#3b2f2f]">
            Search Users
          </h2>

          <form onSubmit={handleUserSearch} className="mt-5 flex gap-3">
            <input
              type="text"
              value={userSearchText}
              onChange={(event) => setUserSearchText(event.target.value)}
              placeholder="Search users by name..."
              className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-[#6f4e37] placeholder:text-gray-400"
            />

            <button
              type="submit"
              disabled={isLoadingUsers}
              className="rounded-xl bg-[#6f4e37] px-6 py-3 text-white font-medium hover:bg-[#5a3f2d] transition disabled:opacity-60"
            >
              {isLoadingUsers ? "Searching..." : "Search"}
            </button>

            <button
              type="button"
              onClick={handleShowAllUsers}
              disabled={isLoadingUsers}
              className="rounded-xl border border-[#6f4e37] px-5 py-3 text-[#6f4e37] hover:bg-[#f8f3ed] transition disabled:opacity-60"
            >
              Show All Users
            </button>

            <button
              type="button"
              onClick={handleClearUserSearch}
              className="rounded-xl border border-[#6f4e37] px-5 py-3 text-[#6f4e37] hover:bg-[#f8f3ed] transition"
            >
              Clear
            </button>
          </form>

          <div className="mt-6 grid gap-4">
            {users.map((user) => (
              <div
                key={user._id}
                className="rounded-2xl border border-[#eadfd4] bg-[#f8f3ed] p-5"
              >
                <h3 className="text-xl font-semibold text-[#3b2f2f]">
                  {user.fullName}
                </h3>

                <p className="mt-1 text-[#5f4b4b]">{user.email}</p>

                <p className="mt-2 text-sm text-[#6f4e37]">
                  Role: {user.role}
                </p>

                <Link
                  href={`/users/${user._id}`}
                  className="mt-4 inline-block rounded-xl border border-[#6f4e37] px-4 py-2 text-[#6f4e37] hover:bg-white transition"
                >
                  View Profile
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* חיפוש קבוצות מתקדם */}
        <section className="mt-10 rounded-2xl bg-white p-6 shadow-sm border border-[#eadfd4]">
          <h2 className="text-2xl font-bold text-[#3b2f2f]">
            Advanced Group Search
          </h2>

          <p className="mt-2 text-[#5f4b4b]">
            Search groups by name, category, privacy, and owner.
          </p>

          <form onSubmit={handleGroupSearch} className="mt-5">
            <div className="grid gap-4 md:grid-cols-2">
              <input
                type="text"
                value={groupName}
                onChange={(event) => setGroupName(event.target.value)}
                placeholder="Group name"
                className="rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-[#6f4e37] placeholder:text-gray-400"
              />

              <input
                type="text"
                value={groupCategory}
                onChange={(event) => setGroupCategory(event.target.value)}
                placeholder="Category"
                className="rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-[#6f4e37] placeholder:text-gray-400"
              />

              <select
                value={groupPrivacy}
                onChange={(event) => setGroupPrivacy(event.target.value)}
                className="rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-[#6f4e37]"
              >
                <option value="">All groups</option>
                <option value="false">Public groups</option>
                <option value="true">Private groups</option>
              </select>

              <input
                type="text"
                value={groupOwner}
                onChange={(event) => setGroupOwner(event.target.value)}
                placeholder="Owner name or email"
                className="rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-[#6f4e37] placeholder:text-gray-400"
              />
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isLoadingGroups}
                className="rounded-xl bg-[#6f4e37] px-6 py-3 text-white font-medium hover:bg-[#5a3f2d] transition disabled:opacity-60"
              >
                {isLoadingGroups ? "Searching..." : "Search Groups"}
              </button>

              <button
                type="button"
                onClick={handleClearGroupSearch}
                className="rounded-xl border border-[#6f4e37] px-5 py-3 text-[#6f4e37] hover:bg-[#f8f3ed] transition"
              >
                Clear
              </button>
            </div>
          </form>

          <div className="mt-6 grid gap-4">
            {groups.map((group) => (
              <div
                key={group._id}
                className="rounded-2xl border border-[#eadfd4] bg-[#f8f3ed] p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-semibold text-[#3b2f2f]">
                      {group.name}
                    </h3>

                    <p className="mt-1 text-[#5f4b4b]">
                      {group.description || "No description yet."}
                    </p>
                  </div>

                  <span className="rounded-full bg-white px-3 py-1 text-sm text-[#6f4e37] border border-[#eadfd4]">
                    {group.isPrivate ? "Private" : "Public"}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-sm">
                  <span className="rounded-full bg-white px-3 py-1 text-[#6f4e37] border border-[#eadfd4]">
                    Category: {group.category}
                  </span>

                  <span className="rounded-full bg-white px-3 py-1 text-[#6f4e37] border border-[#eadfd4]">
                    Members: {group.members?.length || 0}
                  </span>

                  <span className="rounded-full bg-white px-3 py-1 text-[#6f4e37] border border-[#eadfd4]">
                    Owner: {group.owner?.fullName || "Unknown"}
                  </span>
                </div>

                <Link
                  href={`/groups/${group._id}`}
                  className="mt-4 inline-block rounded-xl border border-[#6f4e37] px-4 py-2 text-[#6f4e37] hover:bg-white transition"
                >
                  View Group
                </Link>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}