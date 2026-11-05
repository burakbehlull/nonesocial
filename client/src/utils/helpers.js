// Format timestamp
export const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

// Copy to clipboard
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy:', error);
    return false;
  }
};

// Generate room link
export const generateRoomLink = (roomId) => {
  return `${window.location.origin}/room/${roomId}`;
};

// Check if mobile device
export const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

// Validate room name
export const validateRoomName = (name) => {
  if (!name || name.trim().length === 0) {
    return 'Oda adı gerekli';
  }
  if (name.length > 30) {
    return 'Oda adı 30 karakterden kısa olmalı';
  }
  return null;
};

// Validate password
export const validatePassword = (password) => {
  if (password && password.length < 4) {
    return 'Parola en az 4 karakter olmalı';
  }
  return null;
};
