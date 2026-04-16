export interface EditModeBannerProps {
  visible: boolean;
}

/**
 * EditModeBanner - A thin yellow banner indicating edit mode
 *
 * Displays a visual indicator when the offer letter is in edit mode,
 * informing the user that the document hasn't been saved yet and can be modified.
 *
 * Requirements: 1.1, 1.2
 */
export function EditModeBanner({ visible }: EditModeBannerProps) {
  if (!visible) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border-b border-yellow-200 text-yellow-800 px-4 py-2 text-center text-sm">
      <span className="font-medium">Edit Mode</span>
      <span className="mx-2">—</span>
      <span>
        You can modify the content below. Changes will be saved when you click
        Save.
      </span>
    </div>
  );
}
