"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function HomeHero() {
  const router = useRouter();

  // משתמש מחובר לא צריך לראות את עמוד הפתיחה
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      router.push("/feed");
    }
  }, [router]);

  return (
    <section className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-[#f8f3ed]">
      <h1 className="book-title-shadow book-font text-5xl font-bold text-[#3b2f2f] mb-4">
        BookConnect
      </h1>

      <p className="text-lg text-[#5f4b4b] max-w-xl">
        A social network for book readers - discover books, join reading groups,
        share reviews, and connect with people who love reading.
      </p>

      <div className="book-columns mt-8 grid max-w-4xl grid-cols-1 gap-5 text-left md:grid-cols-2">
        <div className="rounded-2xl bg-white px-6 py-5 border border-[#eadfd4] shadow-sm transition hover:-translate-y-1 hover:shadow-md">
          <h2 className="font-bold text-[#3b2f2f]">Reading Groups</h2>
          <p className="mt-2 text-sm text-[#5f4b4b]">
            Discover public groups or request to join private communities.
          </p>
        </div>

        <div className="rounded-2xl bg-white px-6 py-5 border border-[#eadfd4] shadow-sm transition hover:-translate-y-1 hover:shadow-md">
          <h2 className="font-bold text-[#3b2f2f]">Private Communities</h2>
          <p className="mt-2 text-sm text-[#5f4b4b]">
            Group owners can approve or reject join requests.
          </p>
        </div>

        <div className="rounded-2xl bg-white px-6 py-5 border border-[#eadfd4] shadow-sm transition hover:-translate-y-1 hover:shadow-md">
          <h2 className="font-bold text-[#3b2f2f]">Posts & Media</h2>
          <p className="mt-2 text-sm text-[#5f4b4b]">
            Share thoughts, reviews, images, and videos with your groups.
          </p>
        </div>

        <div className="rounded-2xl bg-white px-6 py-5 border border-[#eadfd4] shadow-sm transition hover:-translate-y-1 hover:shadow-md">
          <h2 className="font-bold text-[#3b2f2f]">Personal Feed</h2>
          <p className="mt-2 text-sm text-[#5f4b4b]">
            See posts from your groups and view everything you published.
          </p>
        </div>
      </div>

      <Link
        href="/groups"
        className="group mt-8 rounded-2xl bg-[#6f4e37] px-8 py-4 text-white font-bold shadow-lg transition hover:-translate-y-1 hover:bg-[#5a3f2d] hover:shadow-xl active:translate-y-0"
      >
        <span className="inline-flex items-center gap-2">
          Start Exploring
          <span className="transition group-hover:translate-x-1">→</span>
        </span>
      </Link>
    </section>
  );
}