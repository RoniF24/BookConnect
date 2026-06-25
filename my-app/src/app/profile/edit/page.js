"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function EditProfilePage() {
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [formData, setFormData] = useState({
    fullName: "",
    bio: "",
    favoriteGenres: "",
  });

  // שמירת תמונת פרופיל חדשה
  const [profileImage, setProfileImage] = useState(null);

  // תצוגה מקדימה של תמונת פרופיל
  const [profileImagePreview, setProfileImagePreview] = useState("");

  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // טעינת המשתמש המחובר מתוך localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    if (!savedUser) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(savedUser);

    setUserId(parsedUser.id || parsedUser._id);

    setFormData({
      fullName: parsedUser.fullName || "",
      bio: parsedUser.bio || "",
      favoriteGenres: parsedUser.favoriteGenres
        ? parsedUser.favoriteGenres.join(", ")
        : "",
    });

    if (parsedUser.profileImageUrl) {
      setProfileImagePreview(`http://localhost:5000${parsedUser.profileImageUrl}`);
    }

    setIsLoading(false);
  }, [router]);

  // עדכון השדות בזמן הקלדה
  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // בחירת תמונת פרופיל חדשה
  const handleProfileImageChange = (event) => {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    setProfileImage(file);
    setProfileImagePreview(URL.createObjectURL(file));
  };

  // שמירת השינויים בפרופיל
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
      // FormData מאפשר לשלוח גם טקסט וגם תמונה
      const updatedProfileData = new FormData();

      updatedProfileData.append("fullName", formData.fullName);
      updatedProfileData.append("bio", formData.bio);

      const genresArray = formData.favoriteGenres
        .split(",")
        .map((genre) => genre.trim())
        .filter((genre) => genre !== "");

      genresArray.forEach((genre) => {
        updatedProfileData.append("favoriteGenres", genre);
      });

      if (profileImage) {
        updatedProfileData.append("profileImage", profileImage);
      }

      const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: updatedProfileData,
      });

      const data = await response.json();

      if (!response.ok) {
        setIsError(true);
        setMessage(data.message || "Profile update failed");
        return;
      }

      // עדכון המשתמש השמור בדפדפן
      localStorage.setItem("user", JSON.stringify(data.user));

      // הודעה ל-Navbar שהמשתמש השתנה
      window.dispatchEvent(new Event("userLogin"));

      setMessage("Profile updated successfully");

      // מעבר לעמוד הפרופיל המעודכן
      router.push(`/users/${data.user.id}`);
    } catch (error) {
      setIsError(true);
      setMessage("Could not connect to the server");
    }
  };

  // מחיקת החשבון של המשתמש המחובר
  const handleDeleteAccount = async () => {
    const isConfirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone."
    );

    if (!isConfirmed) {
      return;
    }

    setMessage("");
    setIsError(false);

    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setIsError(true);
        setMessage(data.message || "Account deletion failed");
        return;
      }

      // ניקוי התחברות מהדפדפן
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // הודעה ל-Navbar שהמשתמש כבר לא מחובר
      window.dispatchEvent(new Event("userLogin"));

      // מעבר למסך הרשמה אחרי מחיקה
      router.push("/register");
    } catch (error) {
      setIsError(true);
      setMessage("Could not connect to the server");
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#f8f3ed] flex items-center justify-center">
        <p className="text-[#5f4b4b] text-lg">Loading edit profile...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f3ed] px-6 py-12">
      <section className="mx-auto max-w-2xl bg-white rounded-2xl shadow-sm p-8 border border-[#eadfd4]">
        <h1 className="text-3xl font-bold text-[#3b2f2f] text-center">
          Edit Profile
        </h1>

        <p className="mt-3 text-center text-[#5f4b4b]">
          Update your personal BookConnect profile.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
          <div className="flex flex-col items-center">
            {profileImagePreview ? (
              <img
                src={profileImagePreview}
                alt="Profile preview"
                className="h-28 w-28 rounded-full border border-[#eadfd4] object-cover"
              />
            ) : (
              <div className="h-28 w-28 rounded-full bg-[#6f4e37] text-white flex items-center justify-center text-4xl font-bold">
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
              Bio
            </label>

            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Write something about yourself..."
              rows={4}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-[#6f4e37] placeholder:text-gray-400"
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-[#3b2f2f]">
              Favorite Genres
            </label>

            <input
              type="text"
              name="favoriteGenres"
              value={formData.favoriteGenres}
              onChange={handleChange}
              placeholder="Fantasy, Mystery, Romance"
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-[#6f4e37] placeholder:text-gray-400"
            />

            <p className="mt-1 text-sm text-[#5f4b4b]">
              Separate genres with commas.
            </p>
          </div>

          <button
            type="submit"
            className="mt-4 rounded-xl bg-[#6f4e37] px-4 py-3 text-white font-medium hover:bg-[#5a3f2d] transition"
          >
            Save Changes
          </button>
        </form>

        <div className="mt-8 border-t border-[#eadfd4] pt-6">
          <h2 className="text-xl font-bold text-red-700">Danger Zone</h2>

          <p className="mt-2 text-sm text-[#5f4b4b]">
            Deleting your account will permanently remove your profile.
          </p>

          <button
            type="button"
            onClick={handleDeleteAccount}
            className="mt-4 rounded-xl border border-red-600 px-4 py-2 text-red-600 hover:bg-red-50 transition"
          >
            Delete Account
          </button>
        </div>

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