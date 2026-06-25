"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateGroupPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    isPrivate: false,
  });

  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  // עדכון שדות הטופס בזמן הקלדה
  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // יצירת קבוצה חדשה
  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setIsError(false);

    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setIsError(true);
        setMessage(data.message || "Group creation failed");
        return;
      }

      setMessage("Group created successfully");

      setFormData({
        name: "",
        description: "",
        category: "",
        isPrivate: false,
      });

      // בהמשך נחליף את זה לעמוד פרופיל של קבוצה
      router.push("/groups");
    } catch (error) {
      setIsError(true);
      setMessage("Could not connect to the server");
    }
  };

  return (
    <main className="min-h-screen bg-[#f8f3ed] px-6 py-12">
      <section className="mx-auto max-w-2xl bg-white rounded-2xl shadow-sm p-8 border border-[#eadfd4]">
        <h1 className="text-3xl font-bold text-[#3b2f2f] text-center">
          Create Group
        </h1>

        <p className="mt-3 text-center text-[#5f4b4b]">
          Create a reading group for people with similar book interests.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
          <div>
            <label className="block mb-1 text-sm font-medium text-[#3b2f2f]">
              Group Name
            </label>

            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Fantasy Readers"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-[#6f4e37] placeholder:text-gray-400"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-[#3b2f2f]">
              Description
            </label>

            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Write a short description about the group..."
              rows={4}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-[#6f4e37] placeholder:text-gray-400"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-[#3b2f2f]">
              Category
            </label>

            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              placeholder="Fantasy, Romance, History..."
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-[#6f4e37] placeholder:text-gray-400"
            />
          </div>

          <label className="flex items-center gap-3 text-[#3b2f2f]">
            <input
              type="checkbox"
              name="isPrivate"
              checked={formData.isPrivate}
              onChange={handleChange}
              className="h-4 w-4"
            />

            Private Group
          </label>

          <button
            type="submit"
            className="mt-4 rounded-xl bg-[#6f4e37] px-4 py-3 text-white font-medium hover:bg-[#5a3f2d] transition"
          >
            Create Group
          </button>
        </form>

        {message && (
          <p
            className={`mt-5 text-center text-sm font-medium ${
              isError ? "text-red-600" : "text-green-700"
            }`}
          >
            {message}
          </p>
        )}
      </section>
    </main>
  );
}