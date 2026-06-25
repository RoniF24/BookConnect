"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function GroupsPage() {
  const [groups, setGroups] = useState([]);
  const [loggedUser, setLoggedUser] = useState(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // טעינת כל הקבוצות מהשרת
  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      setLoggedUser(JSON.parse(storedUser));
    }

    const fetchGroups = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/groups");
        const data = await response.json();

        if (!response.ok) {
          setMessage(data.message || "Could not fetch groups");
          return;
        }

        setGroups(data.groups || []);
      } catch (error) {
        setMessage("Could not connect to the server");
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroups();
  }, []);

  // קבלת id ממשתמש או מ-id רגיל
  const getUserId = (user) => {
    return user?._id || user?.id || user;
  };

  // ה-id של המשתמש המחובר
  const loggedUserId = getUserId(loggedUser)?.toString();

  // בדיקה האם המשתמש המחובר חבר בקבוצה
  const isGroupMember = (group) => {
    if (!loggedUserId) {
      return false;
    }

    return group.members?.some((member) => {
      const memberId = getUserId(member)?.toString();
      return memberId === loggedUserId;
    });
  };

  // בדיקה האם המשתמש המחובר הוא בעלים או מנהל של הקבוצה
  const isGroupManager = (group) => {
    if (!loggedUserId) {
      return false;
    }

    const ownerId = getUserId(group.owner)?.toString();

    const isOwner = ownerId === loggedUserId;

    const isAdmin = group.admins?.some((admin) => {
      const adminId = getUserId(admin)?.toString();
      return adminId === loggedUserId;
    });

    return isOwner || isAdmin;
  };

  // כמות בקשות הצטרפות שממתינות
  const getPendingRequestsCount = (group) => {
    return group.pendingRequests?.length || 0;
  };

  // האם יש בקשות שממתינות למנהל הקבוצה
  const hasPendingRequestsForManager = (group) => {
    return isGroupManager(group) && getPendingRequestsCount(group) > 0;
  };

  // מיון קבוצות: קבוצות עם בקשות ממתינות למנהל יקפצו לראש
  const sortGroups = (groupsToSort) => {
    return [...groupsToSort].sort((a, b) => {
      const aHasRequests = hasPendingRequestsForManager(a);
      const bHasRequests = hasPendingRequestsForManager(b);

      if (aHasRequests && !bHasRequests) {
        return -1;
      }

      if (!aHasRequests && bHasRequests) {
        return 1;
      }

      return a.name.localeCompare(b.name);
    });
  };

  // קבוצות שהמשתמש חבר בהן
  const joinedGroups = loggedUser
    ? sortGroups(groups.filter((group) => isGroupMember(group)))
    : [];

  // קבוצות שהמשתמש עדיין לא חבר בהן
  const otherGroups = loggedUser
    ? sortGroups(groups.filter((group) => !isGroupMember(group)))
    : sortGroups(groups);

  // כרטיס קבוצה
  const renderGroupCard = (group) => (
    <article
      key={group._id}
      className="bg-white rounded-2xl shadow-sm p-6 border border-[#eadfd4]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#3b2f2f]">{group.name}</h2>

          <p className="mt-2 text-[#5f4b4b]">
            {group.description || "No description yet."}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span className="rounded-full bg-[#f8f3ed] px-3 py-1 text-sm text-[#6f4e37] whitespace-nowrap">
            {group.isPrivate ? "Private" : "Public"}
          </span>

          {loggedUser && isGroupMember(group) && (
            <span className="rounded-full bg-[#eadfd4] px-3 py-1 text-sm font-medium text-[#6f4e37] whitespace-nowrap">
              Joined
            </span>
          )}

          {hasPendingRequestsForManager(group) && (
            <span className="rounded-full bg-[#6f4e37] px-3 py-1 text-sm font-medium text-white shadow-sm whitespace-nowrap">
              🔔 {getPendingRequestsCount(group)}
            </span>
          )}
        </div>
      </div>

      {hasPendingRequestsForManager(group) && (
        <p className="mt-4 inline-block rounded-xl bg-[#f8f3ed] px-3 py-2 text-sm font-medium text-[#6f4e37] border border-[#eadfd4]">
          {getPendingRequestsCount(group)} join request
          {getPendingRequestsCount(group) > 1 ? "s" : ""} waiting
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        <span className="rounded-full bg-[#f8f3ed] px-3 py-1 text-sm text-[#6f4e37]">
          Category: {group.category}
        </span>

        <span className="rounded-full bg-[#f8f3ed] px-3 py-1 text-sm text-[#6f4e37]">
          Members: {group.members?.length || 0}
        </span>
      </div>

      <p className="mt-5 text-sm text-[#5f4b4b]">
        Owner: {group.owner?.fullName || "Unknown"}
      </p>

      <Link
        href={`/groups/${group._id}`}
        className="inline-block mt-5 rounded-xl border border-[#6f4e37] px-4 py-2 text-[#6f4e37] hover:bg-[#f8f3ed] transition"
      >
        View Group
      </Link>
    </article>
  );

  // אזור קבוצות
  const renderGroupsSection = (title, description, sectionGroups, emptyText) => (
    <section className="mt-10">
      <div className="mb-5">
        <h2 className="text-3xl font-bold text-[#3b2f2f]">{title}</h2>

        {description && (
          <p className="mt-2 text-[#5f4b4b]">{description}</p>
        )}
      </div>

      {sectionGroups.length === 0 ? (
        <div className="rounded-2xl border border-[#eadfd4] bg-white p-6 text-center shadow-sm">
          <p className="text-[#5f4b4b]">{emptyText}</p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {sectionGroups.map((group) => renderGroupCard(group))}
        </div>
      )}
    </section>
  );

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#f8f3ed] flex items-center justify-center">
        <p className="text-[#5f4b4b] text-lg">Loading groups...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f3ed] px-6 py-12">
      <section className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="book-title-shadow book-font text-4xl font-bold text-[#3b2f2f]">
              Reading Groups
            </h1>

            <p className="mt-3 text-[#5f4b4b]">
              Discover reading communities and join groups that match your
              favorite books.
            </p>
          </div>

          {loggedUser ? (
            <Link
              href="/groups/create"
              className="rounded-xl bg-[#6f4e37] px-5 py-3 text-white font-medium hover:bg-[#5a3f2d] transition"
            >
              Create Group
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-xl border border-[#6f4e37] px-5 py-3 text-[#6f4e37] font-medium hover:bg-white transition"
            >
              Login to create a group
            </Link>
          )}
        </div>

        {!loggedUser && (
          <div className="mt-6 rounded-2xl border border-[#eadfd4] bg-white px-5 py-4">
            <p className="text-[#5f4b4b]">
              You are viewing groups as a guest. You can open public groups and
              read posts, but you need to login to create groups, join groups,
              create posts, or comment.
            </p>
          </div>
        )}

        {message && (
          <p className="mt-8 text-center text-[#5f4b4b]">{message}</p>
        )}

        {!message && groups.length === 0 && (
          <div className="mt-10 bg-white rounded-2xl shadow-sm p-8 text-center border border-[#eadfd4]">
            <h2 className="text-2xl font-bold text-[#3b2f2f]">
              No groups yet
            </h2>

            <p className="mt-3 text-[#5f4b4b]">
              {loggedUser
                ? "Be the first to create a reading group."
                : "Login to create the first reading group."}
            </p>
          </div>
        )}

        {!message && groups.length > 0 && loggedUser && (
          <>
            {renderGroupsSection(
              "My Joined Groups",
              "Groups you already joined and can easily return to.",
              joinedGroups,
              "You have not joined any groups yet."
            )}

            {renderGroupsSection(
              "Explore More Groups",
              "Find more reading communities to join.",
              otherGroups,
              "No additional groups to explore right now."
            )}
          </>
        )}

        {!message && groups.length > 0 && !loggedUser && (
          <>
            {renderGroupsSection(
              "Public Groups",
              "Login to join groups and see your personal joined groups list.",
              otherGroups,
              "No groups available right now."
            )}
          </>
        )}
      </section>
    </main>
  );
}