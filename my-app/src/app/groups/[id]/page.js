"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import PostComments from "@/components/PostComments";

export default function GroupProfilePage() {
  // קבלת ה-id של הקבוצה מתוך הכתובת הדינמית
  const { id } = useParams();

  const router = useRouter();

  // שמירת פרטי הקבוצה שהתקבלו מהשרת
  const [group, setGroup] = useState(null);

  // שמירת הפוסטים של הקבוצה
  const [posts, setPosts] = useState([]);

  // שמירת פרטי המשתמש המחובר מתוך localStorage
  const [loggedUser, setLoggedUser] = useState(null);

  // הודעת שגיאה או הודעה כללית למשתמש
  const [message, setMessage] = useState("");

  // מצב טעינה בזמן שמביאים את הקבוצה מהשרת
  const [isLoading, setIsLoading] = useState(true);

  // האם להציג את רשימת חברי הקבוצה
  const [showMembers, setShowMembers] = useState(false);

  // שדות טופס יצירת פוסט
  const [postText, setPostText] = useState("");
  const [postImage, setPostImage] = useState(null);
  const [postVideo, setPostVideo] = useState(null);

  // קנבס לעריכת תמונה כחלק מפוסט
  const drawingCanvasRef = useRef(null);

  // שמירת התמונה המקורית שנטענה לקנבס
  const baseImageRef = useRef(null);

  const [showDrawingCanvas, setShowDrawingCanvas] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingColor, setDrawingColor] = useState("#6f4e37");
  const [drawingText, setDrawingText] = useState("");
  const [hasDrawingImage, setHasDrawingImage] = useState(false);

  // מצב עריכה: ציור או בחירת מיקום לטקסט
  const [editorMode, setEditorMode] = useState("draw");

  // מיקום הטקסט על הקנבס
  const [textPosition, setTextPosition] = useState({ x: 30, y: 55 });
  // מצב טעינה בזמן יצירת פוסט
  const [isCreatingPost, setIsCreatingPost] = useState(false);

  // האם להציג את טופס יצירת הפוסט
  const [showCreatePostForm, setShowCreatePostForm] = useState(false);

  // האם להציג טופס עריכת קבוצה
  const [showEditGroupForm, setShowEditGroupForm] = useState(false);

  // שדות עריכת קבוצה
  const [editGroupName, setEditGroupName] = useState("");
  const [editGroupDescription, setEditGroupDescription] = useState("");
  const [editGroupCategory, setEditGroupCategory] = useState("");
  const [editGroupIsPrivate, setEditGroupIsPrivate] = useState(false);

  // מצב טעינה בזמן עדכון קבוצה
  const [isUpdatingGroup, setIsUpdatingGroup] = useState(false);

  // שמירת הפוסט שנמצא במצב עריכה
  const [editingPostId, setEditingPostId] = useState(null);

  // שמירת הטקסט בזמן עריכת פוסט
  const [editingText, setEditingText] = useState("");

  // מצב טעינה בזמן עדכון פוסט
  const [isUpdatingPost, setIsUpdatingPost] = useState(false);

  // שדות חיפוש פוסטים
  const [searchText, setSearchText] = useState("");
  const [searchAuthor, setSearchAuthor] = useState("");
  const [searchMediaType, setSearchMediaType] = useState("");
  const [searchDateFrom, setSearchDateFrom] = useState("");
  const [searchDateTo, setSearchDateTo] = useState("");

  // מצב טעינה בזמן חיפוש
  const [isSearchingPosts, setIsSearchingPosts] = useState(false);

  // טעינת פרטי קבוצה אחת לפי id
  const loadGroup = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/groups/${id}`);
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Could not fetch group");
        return;
      }

      setGroup(data.group);
    } catch (error) {
      setMessage("Could not connect to the server");
    } finally {
      setIsLoading(false);
    }
  };

  // טעינת הפוסטים של הקבוצה
  const loadGroupPosts = async () => {
    try {
      const token = localStorage.getItem("token");

      const headers = {};

      // אם יש משתמש מחובר נשלח token, אם אין — נטען כאורח
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(
        `http://localhost:5000/api/posts/group/${id}`,
        {
          headers,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        // בקבוצה פרטית אורח או משתמש לא חבר לא אמור לראות פוסטים
        if (response.status === 403) {
          setPosts([]);
          return;
        }

        setMessage(data.message || "Could not fetch posts");
        return;
      }

      setPosts(data.posts || []);
    } catch (error) {
      setMessage("Could not connect to the server");
    }
  };

  // טעינת פרטי קבוצה + טעינת המשתמש המחובר + טעינת פוסטים
  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      setLoggedUser(JSON.parse(storedUser));
    }

    loadGroup();
    loadGroupPosts();
  }, [id]);

  // בדיקה האם משתמש מסוים הוא בעל הקבוצה
  const isOwner = (memberId) => {
    return group?.owner?._id === memberId;
  };

  // בדיקה האם משתמש מסוים הוא מנהל בקבוצה
  const isAdmin = (memberId) => {
    return group?.admins?.some((admin) => admin._id === memberId);
  };

  // קבלת ה-id של המשתמש המחובר
  // לפעמים המשתמש נשמר ב-localStorage עם id ולפעמים עם _id
  const loggedUserId = loggedUser?._id || loggedUser?.id;

  // בדיקה האם המשתמש המחובר הוא בעל הקבוצה
  const isCurrentUserOwner =
    loggedUserId && group?.owner?._id === loggedUserId;

  // בדיקה האם המשתמש המחובר הוא מנהל בקבוצה
  const isCurrentUserAdmin =
    loggedUserId &&
    group?.admins?.some((admin) => admin._id === loggedUserId);

  // האם המשתמש יכול לערוך את הקבוצה
  const canEditGroup = isCurrentUserOwner || isCurrentUserAdmin;

  // בדיקה האם המשתמש המחובר הוא חבר בקבוצה
  const isCurrentUserMember =
    loggedUserId &&
    group?.members?.some((member) => member._id === loggedUserId);

  // בדיקה האם המשתמש כבר שלח בקשת הצטרפות
  const hasPendingRequest =
    loggedUserId &&
    group?.pendingRequests?.some((user) => user._id === loggedUserId);

  // האם המשתמש יכול לפרסם פוסט בקבוצה
  const canCreatePost =
    loggedUser && (isCurrentUserOwner || isCurrentUserMember);

  // האם המשתמש יכול לראות פוסטים
  // קבוצה ציבורית פתוחה לצפייה, קבוצה פרטית רק לחברים/בעלים
  const canViewPosts =
    !group?.isPrivate || isCurrentUserOwner || isCurrentUserMember;

  // פתיחת טופס עריכת קבוצה
  const handleOpenEditGroupForm = () => {
    setEditGroupName(group?.name || "");
    setEditGroupDescription(group?.description || "");
    setEditGroupCategory(group?.category || "");
    setEditGroupIsPrivate(Boolean(group?.isPrivate));
    setShowEditGroupForm(true);
    setMessage("");
  };

  // עדכון קבוצה
  const handleUpdateGroup = async (event) => {
    event.preventDefault();

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setMessage("You must be logged in to update a group");
        return;
      }

      if (!editGroupName.trim()) {
        setMessage("Group name is required");
        return;
      }

      if (!editGroupCategory.trim()) {
        setMessage("Group category is required");
        return;
      }

      setIsUpdatingGroup(true);
      setMessage("Updating group...");

      const response = await fetch(`http://localhost:5000/api/groups/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editGroupName,
          description: editGroupDescription,
          category: editGroupCategory,
          isPrivate: editGroupIsPrivate,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Could not update group");
        return;
      }

      setMessage("Group updated successfully");
      setShowEditGroupForm(false);

      await loadGroup();
    } catch (error) {
      setMessage("Could not connect to the server");
    } finally {
      setIsUpdatingGroup(false);
    }
  };

  // מחיקת קבוצה
  const handleDeleteGroup = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this group? This action cannot be undone."
    );

    if (!confirmDelete) {
      return;
    }

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setMessage("You must be logged in to delete a group");
        return;
      }

      const response = await fetch(`http://localhost:5000/api/groups/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Could not delete group");
        return;
      }

      setMessage("Group deleted successfully");

      // מעבר חזרה לעמוד הקבוצות אחרי מחיקה
      router.push("/groups");
    } catch (error) {
      setMessage("Could not connect to the server");
    }
  };

  // שליחת בקשת הצטרפות לקבוצה פרטית
  const handleRequestJoinGroup = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setMessage("You must be logged in to request joining a group");
        return;
      }

      const response = await fetch(
        `http://localhost:5000/api/groups/${id}/request-join`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Could not send join request");
        return;
      }

      setMessage("Join request sent successfully");

      // טעינת הקבוצה מחדש כדי לעדכן pendingRequests
      await loadGroup();
    } catch (error) {
      setMessage("Could not connect to the server");
    }
  };

  // אישור בקשת הצטרפות
const handleApproveJoinRequest = async (userId) => {
  try {
    const token = localStorage.getItem("token");

    if (!token) {
      setMessage("You must be logged in to approve requests");
      return;
    }

    const response = await fetch(
      `http://localhost:5000/api/groups/${id}/approve-request/${userId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.message || "Could not approve request");
      return;
    }

    setMessage("Join request approved successfully");
    setGroup(data.group);
    await loadGroupPosts();
  } catch (error) {
    setMessage("Could not connect to the server");
  }
};

  // דחיית בקשת הצטרפות
  const handleRejectJoinRequest = async (userId) => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setMessage("You must be logged in to reject requests");
        return;
      }

      const response = await fetch(
        `http://localhost:5000/api/groups/${id}/reject-request/${userId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Could not reject request");
        return;
      }

      setMessage("Join request rejected successfully");
      setGroup(data.group);
    } catch (error) {
      setMessage("Could not connect to the server");
    }
  };

  // הצטרפות לקבוצה ציבורית
  const handleJoinGroup = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setMessage("You must be logged in to join a group");
        return;
      }

      const response = await fetch(
        `http://localhost:5000/api/groups/${id}/join`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Could not join group");
        return;
      }

      setMessage("");
      await loadGroup();
      await loadGroupPosts();
    } catch (error) {
      setMessage("Could not connect to the server");
    }
  };

  // יציאה מקבוצה
  const handleLeaveGroup = async () => {
    const confirmLeave = window.confirm(
      "Are you sure you want to leave this group?"
    );

    if (!confirmLeave) {
      return;
    }

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setMessage("You must be logged in to leave a group");
        return;
      }

      const response = await fetch(
        `http://localhost:5000/api/groups/${id}/leave`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Could not leave group");
        return;
      }

      setMessage("");
      setPosts([]);
      await loadGroup();
    } catch (error) {
      setMessage("Could not connect to the server");
    }
  };

  // יצירת פוסט חדש
  const handleCreatePost = async (event) => {
    event.preventDefault();

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setMessage("You must be logged in to create a post");
        return;
      }

      if (!postText.trim() && !postImage && !postVideo) {
        setMessage("Post must contain text, an image, or a video");
        return;
      }

      setIsCreatingPost(true);
      setMessage("Creating post...");

      // יצירת FormData כדי לשלוח גם טקסט וגם קבצים
      const formData = new FormData();
      formData.append("groupId", id);
      formData.append("text", postText);

      if (postImage) {
        formData.append("image", postImage);
      }

      if (postVideo) {
        formData.append("video", postVideo);
      }

      const response = await fetch("http://localhost:5000/api/posts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Could not create post");
        return;
      }

      // ניקוי הטופס אחרי יצירה מוצלחת
      setPostText("");
      setPostImage(null);
      setPostVideo(null);
      setDrawingText("");
      setHasDrawingImage(false);
      setShowDrawingCanvas(false);
      setShowCreatePostForm(false);
      setMessage("Post created successfully");

      const canvas = drawingCanvasRef.current;

      if (canvas) {
        const context = canvas.getContext("2d");
        context.clearRect(0, 0, canvas.width, canvas.height);
      }

      // טעינה מחדש של הפוסטים כדי להציג את הפוסט החדש
      await loadGroupPosts();
    } catch (error) {
      setMessage("Could not connect to the server");
    } finally {
      setIsCreatingPost(false);
    }
  };

  // קבלת מיקום העכבר בתוך הקנבס
  const getCanvasPosition = (event) => {
    const canvas = drawingCanvasRef.current;
    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  };

  // ציור תמונת הבסיס מחדש על הקנבס
  const drawBaseImageToCanvas = (image) => {
    const canvas = drawingCanvasRef.current;

    if (!canvas || !image) {
      return;
    }

    const context = canvas.getContext("2d");

    context.clearRect(0, 0, canvas.width, canvas.height);

    // רקע לבן למקרה שהתמונה לא ממלאת את כל הקנבס
    context.fillStyle = "#fffaf5";
    context.fillRect(0, 0, canvas.width, canvas.height);

    const canvasRatio = canvas.width / canvas.height;
    const imageRatio = image.width / image.height;

    let drawWidth = canvas.width;
    let drawHeight = canvas.height;
    let drawX = 0;
    let drawY = 0;

    // התאמת התמונה לקנבס בלי לעוות אותה
    if (imageRatio > canvasRatio) {
      drawWidth = canvas.width;
      drawHeight = canvas.width / imageRatio;
      drawY = (canvas.height - drawHeight) / 2;
    } else {
      drawHeight = canvas.height;
      drawWidth = canvas.height * imageRatio;
      drawX = (canvas.width - drawWidth) / 2;
    }

    context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
  };

  // טעינת תמונה שנבחרה לתוך הקנבס
  const handleImageSelected = (event) => {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    setPostImage(file);
    setHasDrawingImage(false);
    setShowDrawingCanvas(true);
    setMessage("");

    const imageUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      baseImageRef.current = image;
      drawBaseImageToCanvas(image);
      URL.revokeObjectURL(imageUrl);
    };

    image.src = imageUrl;
  };

  // התחלת ציור או בחירת מיקום לטקסט
  const handleCanvasMouseDown = (event) => {
    const canvas = drawingCanvasRef.current;

    if (!canvas) {
      return;
    }

    const position = getCanvasPosition(event);

    // במצב טקסט — לחיצה על הקנבס בוחרת מיקום לטקסט
    if (editorMode === "text") {
      setTextPosition(position);
      setMessage("Text position selected");
      return;
    }

    const context = canvas.getContext("2d");

    context.beginPath();
    context.moveTo(position.x, position.y);

    setIsDrawing(true);
  };

  // ציור על הקנבס
  const handleDraw = (event) => {
    if (!isDrawing || editorMode !== "draw") {
      return;
    }

    const canvas = drawingCanvasRef.current;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    const position = getCanvasPosition(event);

    context.lineWidth = 4;
    context.lineCap = "round";
    context.strokeStyle = drawingColor;

    context.lineTo(position.x, position.y);
    context.stroke();
  };

  // סיום ציור
  const handleStopDrawing = () => {
    setIsDrawing(false);
  };

  // איפוס העריכה וחזרה לתמונה המקורית
  const handleClearDrawing = () => {
    if (baseImageRef.current) {
      drawBaseImageToCanvas(baseImageRef.current);
    } else {
      const canvas = drawingCanvasRef.current;

      if (!canvas) {
        return;
      }

      const context = canvas.getContext("2d");
      context.clearRect(0, 0, canvas.width, canvas.height);
    }

    setHasDrawingImage(false);
    setMessage("Editor reset");
  };

  // הוספת טקסט במיקום שנבחר
  const handleAddTextToDrawing = () => {
    const canvas = drawingCanvasRef.current;

    if (!canvas || !drawingText.trim()) {
      setMessage("Write text before adding it to the image");
      return;
    }

    const context = canvas.getContext("2d");

    context.font = "28px Georgia";
    context.fillStyle = drawingColor;
    context.fillText(drawingText.trim(), textPosition.x, textPosition.y);

    setDrawingText("");
    setMessage("Text added to image");
  };

  // שימוש בתמונה הערוכה כתמונה של הפוסט
  const handleUseDrawingAsImage = () => {
    const canvas = drawingCanvasRef.current;

    if (!canvas) {
      return;
    }

    canvas.toBlob((blob) => {
      if (!blob) {
        setMessage("Could not create image from editor");
        return;
      }

      const editedImageFile = new File([blob], "edited-post-image.png", {
        type: "image/png",
      });

      setPostImage(editedImageFile);
      setHasDrawingImage(true);
      setMessage("Edited image attached to post");
    }, "image/png");
  };

  // חיפוש פוסטים בקבוצה
  const handleSearchPosts = async (event) => {
    event.preventDefault();

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setMessage("You must be logged in to search posts");
        return;
      }

      setIsSearchingPosts(true);
      setMessage("Searching posts...");

      const params = new URLSearchParams();

      // חיפוש רק בתוך הקבוצה הנוכחית
      params.append("groupId", id);

      if (searchText.trim()) {
        params.append("text", searchText.trim());
      }

      if (searchAuthor.trim()) {
        params.append("author", searchAuthor.trim());
      }

      if (searchMediaType) {
        params.append("mediaType", searchMediaType);
      }

      if (searchDateFrom) {
        params.append("dateFrom", searchDateFrom);
      }

      if (searchDateTo) {
        params.append("dateTo", searchDateTo);
      }

      const response = await fetch(
        `http://localhost:5000/api/posts/search?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Could not search posts");
        return;
      }

      setPosts(data.posts || []);
      setMessage(`Found ${data.count || 0} posts`);
    } catch (error) {
      setMessage("Could not connect to the server");
    } finally {
      setIsSearchingPosts(false);
    }
  };

  // ניקוי חיפוש פוסטים
  const handleClearPostSearch = async () => {
    setSearchText("");
    setSearchAuthor("");
    setSearchMediaType("");
    setSearchDateFrom("");
    setSearchDateTo("");
    setMessage("");

    await loadGroupPosts();
  };

  // פתיחת מצב עריכה לפוסט
  const handleStartEditPost = (post) => {
    setEditingPostId(post._id);
    setEditingText(post.text || "");
    setMessage("");
  };

  // ביטול עריכת פוסט
  const handleCancelEditPost = () => {
    setEditingPostId(null);
    setEditingText("");
  };

  // עדכון פוסט
  const handleUpdatePost = async (postId) => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setMessage("You must be logged in to update a post");
        return;
      }

      setIsUpdatingPost(true);
      setMessage("Updating post...");

      const response = await fetch(
        `http://localhost:5000/api/posts/${postId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            text: editingText,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Could not update post");
        return;
      }

      setMessage("Post updated successfully");
      setEditingPostId(null);
      setEditingText("");

      // טעינה מחדש של הפוסטים אחרי עדכון
      await loadGroupPosts();
    } catch (error) {
      setMessage("Could not connect to the server");
    } finally {
      setIsUpdatingPost(false);
    }
  };

  // מחיקת פוסט
  const handleDeletePost = async (postId) => {
    // הודעת אישור לפני מחיקה
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this post?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setMessage("You must be logged in to delete a post");
        return;
      }

      const response = await fetch(
        `http://localhost:5000/api/posts/${postId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Could not delete post");
        return;
      }

      setMessage("Post deleted successfully");

      // טעינה מחדש של הפוסטים אחרי מחיקה
      await loadGroupPosts();
    } catch (error) {
      setMessage("Could not connect to the server");
    }
  };

  // תצוגת טעינה
  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#f8f3ed] flex items-center justify-center">
        <p className="text-[#5f4b4b] text-lg">Loading group...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f3ed] px-6 py-12">
      <section className="mx-auto max-w-4xl">
        <div className="bg-white rounded-2xl shadow-sm p-8 border border-[#eadfd4]">
          {message && (
            <p className="mb-5 text-center text-[#5f4b4b]">{message}</p>
          )}

          {group && (
            <>
              {/* פרטי הקבוצה */}
              <h1 className="text-4xl font-bold text-[#3b2f2f]">
                {group.name}
              </h1>

              <p className="mt-3 text-[#5f4b4b]">
                {group.description || "No description yet."}
              </p>

              {/* כפתורי ניהול קבוצה */}
              {canEditGroup && (
                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleOpenEditGroupForm}
                    className="rounded-xl border border-[#6f4e37] px-5 py-2 text-[#6f4e37] hover:bg-[#f8f3ed] transition"
                  >
                    Edit Group
                  </button>

                  {isCurrentUserOwner && (
                    <button
                      type="button"
                      onClick={handleDeleteGroup}
                      className="rounded-xl border border-red-600 px-5 py-2 text-red-600 hover:bg-red-50 transition"
                    >
                      Delete Group
                    </button>
                  )}
                </div>
              )}

              {/* טופס עריכת קבוצה */}
              {canEditGroup && showEditGroupForm && (
                <form
                  onSubmit={handleUpdateGroup}
                  className="mt-5 rounded-2xl border border-[#eadfd4] bg-[#f8f3ed] p-5"
                >
                  <h2 className="text-xl font-bold text-[#3b2f2f]">
                    Edit Group
                  </h2>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <input
                      type="text"
                      value={editGroupName}
                      onChange={(event) => setEditGroupName(event.target.value)}
                      placeholder="Group name"
                      className="rounded-xl border border-[#eadfd4] bg-white px-4 py-3 text-[#3b2f2f] outline-none focus:border-[#6f4e37]"
                    />

                    <input
                      type="text"
                      value={editGroupCategory}
                      onChange={(event) =>
                        setEditGroupCategory(event.target.value)
                      }
                      placeholder="Category"
                      className="rounded-xl border border-[#eadfd4] bg-white px-4 py-3 text-[#3b2f2f] outline-none focus:border-[#6f4e37]"
                    />
                  </div>

                  <textarea
                    value={editGroupDescription}
                    onChange={(event) =>
                      setEditGroupDescription(event.target.value)
                    }
                    placeholder="Group description"
                    rows={4}
                    className="mt-4 w-full rounded-xl border border-[#eadfd4] bg-white px-4 py-3 text-[#3b2f2f] outline-none focus:border-[#6f4e37]"
                  />

                  <label className="mt-4 flex items-center gap-2 text-[#5f4b4b]">
                    <input
                      type="checkbox"
                      checked={editGroupIsPrivate}
                      onChange={(event) =>
                        setEditGroupIsPrivate(event.target.checked)
                      }
                    />
                    Private group
                  </label>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="submit"
                      disabled={isUpdatingGroup}
                      className="rounded-xl bg-[#6f4e37] px-5 py-2 text-white hover:bg-[#5a3f2d] transition disabled:opacity-60"
                    >
                      {isUpdatingGroup ? "Saving..." : "Save Changes"}
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowEditGroupForm(false)}
                      className="rounded-xl border border-[#6f4e37] px-5 py-2 text-[#6f4e37] hover:bg-white transition"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* תגיות מידע על הקבוצה */}
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="rounded-full bg-[#f8f3ed] px-3 py-1 text-sm text-[#6f4e37]">
                  Category: {group.category}
                </span>

                <span className="rounded-full bg-[#f8f3ed] px-3 py-1 text-sm text-[#6f4e37]">
                  {group.isPrivate ? "Private Group" : "Public Group"}
                </span>

                <button
                  type="button"
                  onClick={() => setShowMembers(!showMembers)}
                  className="rounded-full bg-[#f8f3ed] px-3 py-1 text-sm text-[#6f4e37] hover:bg-[#eadfd4] transition cursor-pointer"
                >
                  Members: {group.members?.length || 0}
                </button>
              </div>

              {/* בעל הקבוצה */}
              <p className="mt-5 text-sm text-[#5f4b4b]">
                Owner:{" "}
                {group.owner?._id ? (
                  <Link
                    href={`/users/${group.owner._id}`}
                    className="font-medium text-[#6f4e37] hover:underline"
                  >
                    {group.owner.fullName}
                  </Link>
                ) : (
                  "Unknown"
                )}
              </p>

              {/* אזור סטטוס / הצטרפות / יציאה מהקבוצה */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                {!loggedUser && (
                  <Link
                    href="/login"
                    className="inline-block rounded-xl bg-[#6f4e37] px-5 py-2 text-white hover:bg-[#5a3f2d] transition"
                  >
                    Login to join
                  </Link>
                )}

                {loggedUser && isCurrentUserOwner && (
                  <p className="inline-block rounded-xl bg-[#f8f3ed] px-4 py-2 text-sm text-[#6f4e37] border border-[#eadfd4]">
                    Owner of this group
                  </p>
                )}

                {loggedUser && !isCurrentUserOwner && isCurrentUserMember && (
                  <>
                    <p className="inline-block rounded-xl bg-[#f8f3ed] px-4 py-2 text-sm text-[#6f4e37] border border-[#eadfd4]">
                      Member of this group
                    </p>

                    <button
                      type="button"
                      onClick={handleLeaveGroup}
                      className="rounded-xl border border-red-600 px-5 py-2 text-red-600 hover:bg-red-50 transition"
                    >
                      Leave Group
                    </button>
                  </>
                )}

                {loggedUser &&
                  !isCurrentUserOwner &&
                  !isCurrentUserMember &&
                  !group.isPrivate && (
                    <button
                      type="button"
                      onClick={handleJoinGroup}
                      className="rounded-xl bg-[#6f4e37] px-5 py-2 text-white hover:bg-[#5a3f2d] transition"
                    >
                      Join Group
                    </button>
                  )}

                {loggedUser &&
                  !isCurrentUserOwner &&
                  !isCurrentUserMember &&
                  group.isPrivate &&
                  !hasPendingRequest && (
                    <button
                      type="button"
                      onClick={handleRequestJoinGroup}
                      className="rounded-xl bg-[#6f4e37] px-5 py-2 text-white hover:bg-[#5a3f2d] transition"
                    >
                      Request to Join
                    </button>
                  )}

                {loggedUser &&
                  !isCurrentUserOwner &&
                  !isCurrentUserMember &&
                  group.isPrivate &&
                  hasPendingRequest && (
                    <p className="inline-block rounded-xl bg-[#f8f3ed] px-4 py-2 text-sm text-[#6f4e37] border border-[#eadfd4]">
                      Join request sent
                    </p>
                  )}
              </div>

              {/* בקשות הצטרפות שממתינות לאישור */}
              {canEditGroup && group.pendingRequests?.length > 0 && (
                <div className="mt-6 rounded-2xl border border-[#eadfd4] bg-[#f8f3ed] p-5">
                  <h2 className="text-xl font-bold text-[#3b2f2f]">
                    Pending Requests
                  </h2>

                  <ul className="mt-4 space-y-3">
                    {group.pendingRequests.map((requestUser) => (
                      <li
                        key={requestUser._id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white px-4 py-3"
                      >
                        <div>
                          <Link
                            href={`/users/${requestUser._id}`}
                            className="font-medium text-[#6f4e37] hover:underline"
                          >
                            {requestUser.fullName}
                          </Link>

                          <p className="text-sm text-[#5f4b4b]">
                            {requestUser.email}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleApproveJoinRequest(requestUser._id)}
                            className="rounded-lg bg-[#6f4e37] px-4 py-2 text-sm text-white hover:bg-[#5a3f2d] transition"
                          >
                            Approve
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRejectJoinRequest(requestUser._id)}
                            className="rounded-lg border border-red-600 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                          >
                            Reject
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* רשימת חברי הקבוצה שנפתחת בלחיצה על Members */}
              {showMembers && (
                <div className="mt-6">
                  <h2 className="text-xl font-bold text-[#3b2f2f]">
                    Group Members
                  </h2>

                  {group.members && group.members.length > 0 ? (
                    <ul className="mt-3 space-y-2">
                      {group.members.map((member) => (
                        <li
                          key={member._id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#f8f3ed] px-4 py-3 text-[#5f4b4b]"
                        >
                          <div>
                            <Link
                              href={`/users/${member._id}`}
                              className="font-medium text-[#6f4e37] hover:underline"
                            >
                              {member.fullName}
                            </Link>

                            <span className="text-sm">
                              {" "}
                              — {member.email}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {isOwner(member._id) && (
                              <span className="rounded-full bg-white px-3 py-1 text-xs text-[#6f4e37] border border-[#eadfd4]">
                                Owner
                              </span>
                            )}

                            {!isOwner(member._id) && isAdmin(member._id) && (
                              <span className="rounded-full bg-white px-3 py-1 text-xs text-[#6f4e37] border border-[#eadfd4]">
                                Admin
                              </span>
                            )}

                            {!isOwner(member._id) && !isAdmin(member._id) && (
                              <span className="rounded-full bg-white px-3 py-1 text-xs text-[#6f4e37] border border-[#eadfd4]">
                                Member
                              </span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-[#5f4b4b]">No members yet.</p>
                  )}
                </div>
              )}

              {/* אזור פוסטים של הקבוצה */}
              <div className="mt-10 border-t border-[#eadfd4] pt-8">
                {/* חיפוש פוסטים */}
                {loggedUser && canViewPosts && (
                  <form
                    onSubmit={handleSearchPosts}
                    className="mt-5 rounded-2xl border border-[#eadfd4] bg-[#f8f3ed] p-5"
                  >
                    <h3 className="text-lg font-bold text-[#3b2f2f]">
                      Search Posts
                    </h3>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <input
                        type="text"
                        value={searchText}
                        onChange={(event) => setSearchText(event.target.value)}
                        placeholder="Search by post text"
                        className="rounded-xl border border-[#eadfd4] bg-white px-4 py-3 text-[#3b2f2f] outline-none focus:border-[#6f4e37]"
                      />

                      <input
                        type="text"
                        value={searchAuthor}
                        onChange={(event) =>
                          setSearchAuthor(event.target.value)
                        }
                        placeholder="Search by author name or email"
                        className="rounded-xl border border-[#eadfd4] bg-white px-4 py-3 text-[#3b2f2f] outline-none focus:border-[#6f4e37]"
                      />

                      <select
                        value={searchMediaType}
                        onChange={(event) =>
                          setSearchMediaType(event.target.value)
                        }
                        className="rounded-xl border border-[#eadfd4] bg-white px-4 py-3 text-[#3b2f2f] outline-none focus:border-[#6f4e37]"
                      >
                        <option value="">All media types</option>
                        <option value="text">Text only</option>
                        <option value="image">With image</option>
                        <option value="video">With video</option>
                      </select>

                      <div className="grid gap-3 md:grid-cols-2">
                        <input
                          type="date"
                          value={searchDateFrom}
                          onChange={(event) =>
                            setSearchDateFrom(event.target.value)
                          }
                          className="rounded-xl border border-[#eadfd4] bg-white px-4 py-3 text-[#3b2f2f] outline-none focus:border-[#6f4e37]"
                        />

                        <input
                          type="date"
                          value={searchDateTo}
                          onChange={(event) =>
                            setSearchDateTo(event.target.value)
                          }
                          className="rounded-xl border border-[#eadfd4] bg-white px-4 py-3 text-[#3b2f2f] outline-none focus:border-[#6f4e37]"
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="submit"
                        disabled={isSearchingPosts}
                        className="rounded-xl bg-[#6f4e37] px-5 py-2 text-white hover:bg-[#5a3f2d] transition disabled:opacity-60"
                      >
                        {isSearchingPosts ? "Searching..." : "Search"}
                      </button>

                      <button
                        type="button"
                        onClick={handleClearPostSearch}
                        className="rounded-xl border border-[#6f4e37] px-5 py-2 text-[#6f4e37] hover:bg-white transition"
                      >
                        Clear
                      </button>
                    </div>
                  </form>
                )}

                {/* כפתור פתיחת טופס יצירת פוסט */}
                {canCreatePost && (
                  <div className="mt-5 flex justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        setShowCreatePostForm(!showCreatePostForm)
                      }
                      className="rounded-xl bg-[#6f4e37] px-5 py-2 text-white hover:bg-[#5a3f2d] transition"
                    >
                      {showCreatePostForm ? "Cancel" : "Create Post +"}
                    </button>
                  </div>
                )}

                {/* טופס יצירת פוסט */}
                {canCreatePost && showCreatePostForm && (
                  <form
                    onSubmit={handleCreatePost}
                    className="mt-5 rounded-2xl border border-[#eadfd4] bg-[#f8f3ed] p-5"
                  >
                    <label className="block text-sm font-medium text-[#3b2f2f]">
                      Write a post
                    </label>

                    <textarea
                      value={postText}
                      onChange={(event) => setPostText(event.target.value)}
                      placeholder="Share something with the group..."
                      rows={4}
                      className="mt-2 w-full rounded-xl border border-[#eadfd4] bg-white px-4 py-3 text-[#3b2f2f] outline-none focus:border-[#6f4e37]"
                    />

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-[#3b2f2f]">
                          Image
                        </label>

                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={handleImageSelected}
                          className="mt-2 w-full rounded-xl border border-[#eadfd4] bg-white px-3 py-2 text-sm text-[#5f4b4b]"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[#3b2f2f]">
                          Video
                        </label>

                        <input
                          type="file"
                          accept="video/mp4,video/webm,video/quicktime"
                          onChange={(event) =>
                            setPostVideo(event.target.files[0])
                          }
                          className="mt-2 w-full rounded-xl border border-[#eadfd4] bg-white px-3 py-2 text-sm text-[#5f4b4b]"
                        />
                      </div>
                    </div>

                    {/* ציור Canvas כחלק מהפוסט */}
                    <div className="mt-5 rounded-2xl border border-[#eadfd4] bg-white p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h3 className="font-bold text-[#3b2f2f]">
                            Edit Image with Canvas
                          </h3>

                          <p className="mt-1 text-sm text-[#5f4b4b]">
                            Upload an image, draw on it, add text, and attach the edited result to the post.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => setShowDrawingCanvas(!showDrawingCanvas)}
                          className="rounded-xl border border-[#6f4e37] px-4 py-2 text-[#6f4e37] hover:bg-[#f8f3ed] transition"
                        >
                          {showDrawingCanvas ? "Hide Editor" : "Open Editor"}
                        </button>
                      </div>

                      {showDrawingCanvas && (
                        <div className="mt-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => setDrawingColor("#6f4e37")}
                              className="rounded-xl bg-[#6f4e37] px-4 py-2 text-white hover:scale-105 transition"
                            >
                              Brown
                            </button>

                            <button
                              type="button"
                              onClick={() => setDrawingColor("#3b2f2f")}
                              className="rounded-xl bg-[#3b2f2f] px-4 py-2 text-white hover:scale-105 transition"
                            >
                              Dark
                            </button>

                            <button
                              type="button"
                              onClick={() => setDrawingColor("#b45309")}
                              className="rounded-xl bg-[#b45309] px-4 py-2 text-white hover:scale-105 transition"
                            >
                              Orange
                            </button>

                            <button
                              type="button"
                              onClick={handleClearDrawing}
                              className="rounded-xl border border-red-600 px-4 py-2 text-red-600 hover:bg-red-50 transition"
                            >
                              Clear
                            </button>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => setEditorMode("draw")}
                              className={`rounded-xl px-4 py-2 transition ${
                                editorMode === "draw"
                                  ? "bg-[#6f4e37] text-white"
                                  : "border border-[#6f4e37] text-[#6f4e37] hover:bg-[#f8f3ed]"
                              }`}
                            >
                              Draw Mode
                            </button>

                            <button
                              type="button"
                              onClick={() => setEditorMode("text")}
                              className={`rounded-xl px-4 py-2 transition ${
                                editorMode === "text"
                                  ? "bg-[#6f4e37] text-white"
                                  : "border border-[#6f4e37] text-[#6f4e37] hover:bg-[#f8f3ed]"
                              }`}
                            >
                              Choose Text Position
                            </button>

                            <span className="rounded-full bg-[#f8f3ed] px-3 py-2 text-sm text-[#6f4e37] border border-[#eadfd4]">
                              Text position: X {Math.round(textPosition.x)}, Y{" "}
                              {Math.round(textPosition.y)}
                            </span>
                          </div>

                          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
                            <input
                              type="text"
                              value={drawingText}
                              onChange={(event) => setDrawingText(event.target.value)}
                              placeholder="Optional text inside the drawing"
                              className="rounded-xl border border-[#eadfd4] bg-white px-4 py-3 text-[#3b2f2f] outline-none focus:border-[#6f4e37]"
                            />

                            <button
                              type="button"
                              onClick={handleAddTextToDrawing}
                              className="rounded-xl border border-[#6f4e37] px-4 py-2 text-[#6f4e37] hover:bg-[#f8f3ed] transition"
                            >
                              Add Text
                            </button>
                          </div>

                          <div className="mt-4 overflow-hidden rounded-2xl border border-[#eadfd4] bg-[#fffaf5]">
                            <canvas
                              ref={drawingCanvasRef}
                              width={700}
                              height={320}
                              onMouseDown={handleCanvasMouseDown}
                              onMouseMove={handleDraw}
                              onMouseUp={handleStopDrawing}
                              onMouseLeave={handleStopDrawing}
                              className="block w-full cursor-crosshair"
                            />
                          </div>

                          <div className="mt-4 flex flex-wrap items-center gap-3">
                            <button
                              type="button"
                              onClick={handleUseDrawingAsImage}
                              className="rounded-xl bg-[#6f4e37] px-5 py-2 text-white hover:bg-[#5a3f2d] transition"
                            >
                              Use Edited Image
                            </button>

                            {hasDrawingImage && (
                              <span className="rounded-full bg-[#f8f3ed] px-3 py-1 text-sm text-[#6f4e37] border border-[#eadfd4]">
                                Edited image attached
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>


                    <button
                      type="submit"
                      disabled={isCreatingPost}
                      className="mt-4 rounded-xl bg-[#6f4e37] px-5 py-2 text-white hover:bg-[#5a3f2d] transition disabled:opacity-60"
                    >
                      {isCreatingPost ? "Creating..." : "Create Post"}
                    </button>
                  </form>
                )}

                {!loggedUser && group.isPrivate && (
                  <p className="mt-4 rounded-xl border border-[#eadfd4] bg-[#f8f3ed] px-4 py-3 text-[#5f4b4b]">
                    Private group — login and become an approved member to see posts.
                  </p>
                )}

                {!loggedUser && !group.isPrivate && (
                  <p className="mt-4 rounded-xl border border-[#eadfd4] bg-[#f8f3ed] px-4 py-3 text-[#5f4b4b]">
                    You are viewing this public group as a guest. Login to join, create posts,
                    or comment.
                  </p>
                )}

                {loggedUser && group.isPrivate && !canViewPosts && (
                  <p className="mt-4 rounded-xl border border-[#eadfd4] bg-[#f8f3ed] px-4 py-3 text-[#5f4b4b]">
                    Private group — only approved members can see posts.
                  </p>
                )}

                {canViewPosts && posts.length === 0 && (
                  <p className="mt-4 text-[#5f4b4b]">
                    No posts in this group yet.
                  </p>
                )}

                {canViewPosts && posts.length > 0 && (
                  <div className="mt-5 flex flex-col items-center gap-5">
                    {posts.map((post) => (
                      <article
                        key={post._id}
                        className="w-full max-w-[430px] rounded-2xl border border-[#eadfd4] bg-[#f8f3ed] p-5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="font-semibold text-[#3b2f2f]">
                              {post.author?.fullName || "Unknown user"}
                            </p>

                            <p className="text-xs text-[#8a7474]">
                              {new Date(post.createdAt).toLocaleString()}
                            </p>
                          </div>

                          {(post.author?._id === loggedUserId ||
                            post.author === loggedUserId) && (
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleStartEditPost(post)}
                                className="rounded-lg border border-[#6f4e37] px-3 py-1 text-sm text-[#6f4e37] hover:bg-white transition"
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeletePost(post._id)}
                                className="rounded-lg border border-red-600 px-3 py-1 text-sm text-red-600 hover:bg-red-50 transition"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>

                        {editingPostId === post._id ? (
                          <div className="mt-4">
                            <textarea
                              value={editingText}
                              onChange={(event) =>
                                setEditingText(event.target.value)
                              }
                              rows={4}
                              className="w-full rounded-xl border border-[#eadfd4] bg-white px-4 py-3 text-[#3b2f2f] outline-none focus:border-[#6f4e37]"
                            />

                            <div className="mt-3 flex gap-2">
                              <button
                                type="button"
                                disabled={isUpdatingPost}
                                onClick={() => handleUpdatePost(post._id)}
                                className="rounded-xl bg-[#6f4e37] px-4 py-2 text-sm text-white hover:bg-[#5a3f2d] transition disabled:opacity-60"
                              >
                                {isUpdatingPost ? "Saving..." : "Save"}
                              </button>

                              <button
                                type="button"
                                onClick={handleCancelEditPost}
                                className="rounded-xl border border-[#6f4e37] px-4 py-2 text-sm text-[#6f4e37] hover:bg-white transition"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          post.text && (
                            <p className="mt-4 whitespace-pre-wrap text-[#5f4b4b]">
                              {post.text}
                            </p>
                          )
                        )}

                        {(post.imageFileId || post.imageUrl) && (
                          <div className="mt-4 overflow-hidden rounded-xl bg-white">
                            <img
                              src={
                                post.imageFileId
                                  ? `http://localhost:5000/api/posts/file/${post.imageFileId}`
                                  : `http://localhost:5000${post.imageUrl}`
                              }
                              alt="Post image"
                              className="w-full h-auto rounded-xl object-contain"
                            />
                          </div>
                        )}

                        {(post.videoFileId || post.videoUrl) && (
                          <video
                            controls
                            src={
                              post.videoFileId
                                ? `http://localhost:5000/api/posts/file/${post.videoFileId}`
                                : `http://localhost:5000${post.videoUrl}`
                            }
                            className="mt-4 w-full rounded-xl"
                          />
                        )}

                        <PostComments
                          post={post}
                          loggedUserId={loggedUserId}
                          onPostUpdated={(updatedPost) => {
                            setPosts((prevPosts) =>
                              prevPosts.map((item) =>
                                item._id === updatedPost._id ? updatedPost : item
                              )
                            );
                          }}
                        />
                      </article>
                    ))}
                  </div>
                )}
              </div>

              <Link
                href="/groups"
                className="inline-block mt-8 rounded-xl border border-[#6f4e37] px-4 py-2 text-[#6f4e37] hover:bg-[#f8f3ed] transition"
              >
                Back to Groups
              </Link>
            </>
          )}
        </div>
      </section>
    </main>
  );
}