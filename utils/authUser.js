const USER_STORAGE_KEY = "carent_user";
const API_BASE_URL = "https://carent-ymkk.onrender.com";

const normalizeName = (value) => value?.toString().trim() || "";

export const buildDisplayName = (name, email) => {
  const candidate = normalizeName(name) || normalizeName(email);

  if (!candidate) return "User";

  if (candidate.includes("@")) {
    const localPart = candidate.split("@")[0];
    return (
      localPart
        .replace(/[._-]+/g, " ")
        .split(/\s+/)
        .filter(Boolean)
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
        )
        .join(" ") || "User"
    );
  }

  return candidate
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

export const buildInitials = (name, email) => {
  const displayName = buildDisplayName(name, email);
  const parts = displayName.split(" ").filter(Boolean);

  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0][0].toUpperCase();

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

export const persistUser = (userData = {}) => {
  const user = {
    id: userData.id || userData._id || null,
    email: userData.email || "",
    name: buildDisplayName(userData.name, userData.email),
    avatar: userData.avatar || userData.picture || userData.photo || "",
    role: userData.role || "user",
    initials: buildInitials(userData.name, userData.email),
  };

  if (typeof window !== "undefined") {
    window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    window.dispatchEvent(new Event("auth:update"));
  }

  return user;
};

export const getStoredUser = () => {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(USER_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const clearStoredUser = () => {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(USER_STORAGE_KEY);
  window.dispatchEvent(new Event("auth:update"));
};

export const fetchCurrentUser = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      credentials: "include",
    });

    if (!response.ok) {
      clearStoredUser();
      return null;
    }

    const data = await response.json();
    return persistUser(data.user || data);
  } catch (error) {
    console.error("Failed to load current user", error);
    return null;
  }
};

export const getAvatarUrl = (user) => {
  if (user?.avatar) return user.avatar;

  const name = user?.name || user?.email || "User";
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4f46e5&color=fff&size=128`;
};
