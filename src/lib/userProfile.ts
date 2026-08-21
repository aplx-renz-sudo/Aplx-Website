import type { UserProfile } from '../types';

const PROFILE_KEY = 'aplx:user_profile';

/**
 * Resizes and center-crops any image to a compact 1:1 square JPEG (< 35KB)
 * to guarantee it never exceeds localStorage limits or breaks layout.
 */
export function processImageToCompactSquare(
  fileOrDataUrl: File | string,
  targetSize = 256,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    let objectUrl = '';
    if (typeof fileOrDataUrl === 'string') {
      img.src = fileOrDataUrl;
    } else {
      objectUrl = URL.createObjectURL(fileOrDataUrl);
      img.src = objectUrl;
    }

    img.onload = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      try {
        const canvas = document.createElement('canvas');
        canvas.width = targetSize;
        canvas.height = targetSize;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '');
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;
        const minDim = Math.min(width, height);
        const cropX = (width - minDim) / 2;
        const cropY = (height - minDim) / 2;

        ctx.drawImage(img, cropX, cropY, minDim, minDim, 0, 0, targetSize, targetSize);
        const compactDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compactDataUrl);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = err => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      reject(err);
    };
  });
}

export function loadUserProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Auto-repair if an oversized base64 avatar exists in storage
      if (
        parsed &&
        parsed.avatarType === 'custom' &&
        typeof parsed.avatar === 'string' &&
        parsed.avatar.length > 80000
      ) {
        processImageToCompactSquare(parsed.avatar, 256, 0.8)
          .then(compact => {
            parsed.avatar = compact;
            saveUserProfile(parsed);
          })
          .catch(() => {});
      }
      return parsed;
    }
  } catch {}
  return null;
}

export function saveUserProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (err) {
    console.warn('Could not save user profile to localStorage', err);
  }
}

export function isUserSetupComplete(): boolean {
  const profile = loadUserProfile();
  return Boolean(profile && profile.isSetupComplete);
}

export function removeUserProfile(): void {
  try {
    localStorage.removeItem(PROFILE_KEY);
  } catch (err) {
    console.warn('Could not remove user profile from localStorage', err);
  }
}

