import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Compress and resize an image before upload.
 * Returns base64 string (without data:image prefix).
 */
export async function compressImage(
  uri: string,
  maxWidth = 800,
  quality = 0.8,
): Promise<{ uri: string; base64: string }> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: maxWidth } }],
    {
      compress: quality,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    },
  );

  return {
    uri: result.uri,
    base64: result.base64!,
  };
}
