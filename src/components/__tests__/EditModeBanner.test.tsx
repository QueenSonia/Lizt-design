import { render, screen } from "@testing-library/react";
import { EditModeBanner } from "../EditModeBanner";
import "@testing-library/jest-dom";

/**
 * EditModeBanner Component Tests
 *
 * Tests the edit mode banner component that displays a visual indicator
 * when the offer letter is in edit mode.
 *
 * Requirements: 1.1, 1.2
 */
describe("EditModeBanner Component", () => {
  /**
   * TEST SUITE 1: Visibility Control
   *
   * Tests that the banner renders/hides based on the visible prop
   */
  describe("Visibility Control", () => {
    /**
     * TEST 1: Banner renders when visible is true
     *
     * Validates: Requirement 1.1 - Display thin yellow banner at top of preview
     */
    it("should render the banner when visible is true", () => {
      // ===== ACT =====
      render(<EditModeBanner visible={true} />);

      // ===== ASSERT =====
      expect(screen.getByText("Edit Mode")).toBeInTheDocument();
      expect(
        screen.getByText(/You can modify the content below/),
      ).toBeInTheDocument();
    });

    /**
     * TEST 2: Banner does not render when visible is false
     *
     * Validates: Requirement 1.3 - Hide banner when offer letter is saved
     */
    it("should not render the banner when visible is false", () => {
      // ===== ACT =====
      render(<EditModeBanner visible={false} />);

      // ===== ASSERT =====
      expect(screen.queryByText("Edit Mode")).not.toBeInTheDocument();
      expect(
        screen.queryByText(/You can modify the content below/),
      ).not.toBeInTheDocument();
    });
  });

  /**
   * TEST SUITE 2: Content Display
   *
   * Tests that the banner displays the correct content
   */
  describe("Content Display", () => {
    /**
     * TEST 3: Banner contains edit mode indicator text
     *
     * Validates: Requirement 1.2 - Banner contains text indicating edit mode
     */
    it("should display edit mode indicator text", () => {
      // ===== ACT =====
      render(<EditModeBanner visible={true} />);

      // ===== ASSERT =====
      expect(screen.getByText("Edit Mode")).toBeInTheDocument();
      expect(
        screen.getByText(
          "You can modify the content below. Changes will be saved when you click Save.",
        ),
      ).toBeInTheDocument();
    });
  });

  /**
   * TEST SUITE 3: Styling
   *
   * Tests that the banner has the correct Tailwind classes
   */
  describe("Styling", () => {
    /**
     * TEST 4: Banner has correct yellow styling classes
     *
     * Validates: Design spec - Uses Tailwind classes: bg-yellow-50 border-yellow-200 text-yellow-800
     */
    it("should have the correct yellow styling classes", () => {
      // ===== ACT =====
      const { container } = render(<EditModeBanner visible={true} />);

      // ===== ASSERT =====
      const banner = container.firstChild as HTMLElement;
      expect(banner).toHaveClass("bg-yellow-50");
      expect(banner).toHaveClass("border-yellow-200");
      expect(banner).toHaveClass("text-yellow-800");
    });

    /**
     * TEST 5: Banner is thin (has appropriate padding)
     *
     * Validates: Requirement 1.1 - Display a "thin" yellow banner
     */
    it("should have thin styling with appropriate padding", () => {
      // ===== ACT =====
      const { container } = render(<EditModeBanner visible={true} />);

      // ===== ASSERT =====
      const banner = container.firstChild as HTMLElement;
      expect(banner).toHaveClass("py-2"); // Thin vertical padding
      expect(banner).toHaveClass("px-4"); // Horizontal padding
    });
  });
});
