import { storage } from './config';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { compressImage } from '../utils/fileHelpers';

/**
 * Upload a file to Firebase Storage and return its public download URL.
 * For 2D images we compress before upload; for 3D models we upload directly.
 */
export const uploadFile = async (
  file: File,
  folder: string,
  isImage: boolean = false
): Promise<string> => {
  // Optional client‑side compression for images (max 5 MB, target width 1200)
  const fileToUpload = isImage ? await compressImage(file, 1200, 0.8) : file;
  const storageRef = ref(storage, `${folder}/${fileToUpload.name}`);
  const uploadTask = uploadBytesResumable(storageRef, fileToUpload);

  return new Promise<string>((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      // progress – can be used for UI if needed
      () => {},
      (error) => reject(error),
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(downloadURL);
      }
    );
  });
};
