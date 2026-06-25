"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  // שמירת תמונת פרופיל שנבחרה
  const [profileImage, setProfileImage] = useState(null);

  // תצוגה מקדימה של תמונת הפרופיל
  const [profileImagePreview, setProfileImagePreview] = useState("");

  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  // עדכון הנתונים בזמן הקלדה בשדות
  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // בחירת תמונת פרופיל
  const handleProfileImageChange = (event) => {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    setProfileImage(file);
    setProfileImagePreview(URL.createObjectURL(file));
  };

  // שליחת טופס הרשמה לשרת
  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setIsError(false);

    try {
      // FormData מאפשר לשלוח גם טקסט וגם תמונה
      const registerData = new FormData();

      registerData.append("fullName", formData.fullName);
      registerData.append("email", formData.email);
      registerData.append("password", formData.password);

      if (profileImage) {
        registerData.append("profileImage", profileImage);
      }

      const response = await fetch("http://localhost:5000/api/users/register", {
        method: "POST",
        body: registerData,
      });

      const data = await response.json();

      if (!response.ok) {
        setIsError(true);
        setMessage(data.message || "Registration failed");
        return;
      }

      setMessage(data.message || "User registered successfully");

      setFormData({
        fullName: "",
        email: "",
        password: "",
      });

      setProfileImage(null);
      setProfileImagePreview("");

      // מעבר למסך התחברות אחרי הרשמה מוצלחת
      router.push("/login");
    } catch (error) {
      setIsError(true);
      setMessage("Could not connect to the server");
    }
  };

  return (
    <main className="min-h-screen bg-[#f8f3ed] flex items-center justify-center px-6 py-10">
      <section className="w-full max-w-md bg-white rounded-2xl shadow-md p-8">
        <h1 className="text-3xl font-bold text-[#3b2f2f] text-center">
          Create Account
        </h1>

        <p className="mt-2 text-center text-[#5f4b4b]">
          Join BookConnect and start sharing your reading journey.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <div className="flex flex-col items-center">
            {profileImagePreview ? (
              <img
                src={profileImagePreview}
                alt="Profile preview"
                className="h-24 w-24 rounded-full border border-[#eadfd4] object-cover"
              />
            ) : (
              <div className="h-24 w-24 rounded-full bg-[#6f4e37] text-white flex items-center justify-center text-3xl font-bold">
                {formData.fullName
                  ? formData.fullName.charAt(0).toUpperCase()
                  : "U"}
              </div>
            )}

            <label className="mt-4 block text-sm font-medium text-[#3b2f2f]">
              Profile Image
            </label>

            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleProfileImageChange}
              className="mt-2 w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-[#6f4e37]"
            />

            <p className="mt-1 text-xs text-[#5f4b4b]">
              Optional. You can also add it later.
            </p>
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-[#3b2f2f]">
              Full Name
            </label>

            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Enter your full name"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-[#6f4e37] placeholder:text-gray-400"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-[#3b2f2f]">
              Email
            </label>

            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-[#6f4e37] placeholder:text-gray-400"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-[#3b2f2f]">
              Password
            </label>

            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-[#6f4e37] placeholder:text-gray-400"
            />
          </div>

          <button
            type="submit"
            className="mt-4 rounded-xl bg-[#6f4e37] px-4 py-3 text-white font-medium hover:bg-[#5a3f2d] transition"
          >
            Register
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-[#5f4b4b]">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-[#6f4e37] hover:underline"
          >
            Login
          </Link>
        </p>

        {message && (
          <p
            className={`mt-4 text-center text-sm font-medium ${
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