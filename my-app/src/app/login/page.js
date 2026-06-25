"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

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

  // שליחת טופס התחברות לשרת
  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setIsError(false);

    try {
      const response = await fetch("http://localhost:5000/api/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setIsError(true);
        setMessage(data.message || "Login failed");
        return;
      }

      // שמירת הטוקן ופרטי המשתמש בדפדפן
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

// הודעה ל-Navbar שהמשתמש התחבר
window.dispatchEvent(new Event("userLogin"));

setMessage(data.message || "User logged in successfully");
      setMessage(data.message || "User logged in successfully");

      setFormData({
        email: "",
        password: "",
      });

      // מעבר לפיד אחרי התחברות מוצלחת
      router.push("/feed");
    } catch (error) {
      setIsError(true);
      setMessage("Could not connect to the server");
    }
  };

  return (
    <main className="min-h-screen bg-[#f8f3ed] flex items-center justify-center px-6">
      <section className="w-full max-w-md bg-white rounded-2xl shadow-md p-8">
        <h1 className="text-3xl font-bold text-[#3b2f2f] text-center">
          Welcome Back
        </h1>

        <p className="mt-2 text-center text-[#5f4b4b]">
          Log in to your BookConnect account.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
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
              placeholder="Enter your password"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-[#6f4e37] placeholder:text-gray-400"
            />
          </div>

          <button
            type="submit"
            className="mt-4 rounded-xl bg-[#6f4e37] px-4 py-3 text-white font-medium hover:bg-[#5a3f2d] transition"
          >
            Login
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-[#5f4b4b]">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-semibold text-[#6f4e37] hover:underline"
          >
            Register
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