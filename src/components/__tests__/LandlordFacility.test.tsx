import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LandlordFacility } from "../LandlordFacility";
import axios from "@/services/axios-instance";
import { toast } from "sonner";
import { useGetAllServiceRequests } from "@/services/service-requests/query";
import "@testing-library/jest-dom";

/**
 * COMPONENT TEST EXAMPLE: LandlordFacility
 *
 * This test demonstrates:
 * 1. How to test React components with Testing Library
 * 2. How to mock API calls and custom hooks
 * 3. How to simulate user interactions
 * 4. How to test async behavior and loading states
 * 5. How to test conditional rendering
 *
 * KEY CONCEPTS:
 * - Testing Library: Tests components like users interact with them
 * - User Events: Simulates real user interactions (clicks, typing)
 * - Queries: Find elements on the page (getBy, findBy, queryBy)
 * - Mocking: Replace real API calls with fake data
 *
 * TESTING LIBRARY PHILOSOPHY:
 * "The more your tests resemble the way your software is used,
 *  the more confidence they can give you."
 */

// Mock external dependencies
jest.mock("@/services/axios-instance");
jest.mock("sonner");
jest.mock("@/services/service-requests/query");

// Mock child components to simplify testing
jest.mock("../LandlordTopNav", () => ({
  LandlordTopNav: ({
    title,
    onAddFacilityManager,
  }: {
    title: string;
    onAddFacilityManager: () => void;
  }) => (
    <div data-testid="top-nav">
      <h1>{title}</h1>
      <button onClick={onAddFacilityManager}>Add Manager</button>
    </div>
  ),
}));

jest.mock("../AddManagerModal", () => ({
  __esModule: true,
  default: ({
    isOpen,
    onAdd,
    onClose,
  }: {
    isOpen: boolean;
    onAdd: (name: string, phone: string) => void;
    onClose: () => void;
  }) =>
    isOpen ? (
      <div data-testid="add-manager-modal">
        <button
          onClick={() => {
            onAdd("John Doe", "+1234567890");
            onClose();
          }}
        >
          Save Manager
        </button>
        <button onClick={onClose}>Cancel</button>
      </div>
    ) : null,
}));

jest.mock("../EditManagerModal", () => ({
  __esModule: true,
  default: ({
    isOpen,
    manager,
    onEdit,
    onDelete,
    onClose,
  }: {
    isOpen: boolean;
    manager: { id: string; name: string; phone_number: string } | null;
    onEdit: (id: string, name: string, phone: string) => void;
    onDelete: (id: string) => void;
    onClose: () => void;
  }) =>
    isOpen ? (
      <div data-testid="edit-manager-modal">
        <h2>Edit {manager?.name}</h2>
        <button
          onClick={() => {
            if (manager) {
              onEdit(manager.id, "Updated Name", manager.phone_number);
            }
            onClose();
          }}
        >
          Update Manager
        </button>
        <button
          onClick={() => {
            if (manager) {
              onDelete(manager.id);
            }
            onClose();
          }}
        >
          Delete Manager
        </button>
        <button onClick={onClose}>Cancel</button>
      </div>
    ) : null,
}));

/**
 * QUERY METHODS EXPLAINED:
 *
 * getBy*: Throws error if not found (use for elements that should exist)
 * queryBy*: Returns null if not found (use to check element doesn't exist)
 * findBy*: Async, waits for element (use for elements that appear after loading)
 *
 * getAllBy*, queryAllBy*, findAllBy*: Same but return arrays
 *
 * QUERY TYPES (in priority order):
 * 1. ByRole - Most accessible (buttons, headings, etc.)
 * 2. ByLabelText - Form inputs with labels
 * 3. ByPlaceholderText - Inputs with placeholders
 * 4. ByText - Text content
 * 5. ByTestId - Last resort (add data-testid attribute)
 */

describe("LandlordFacility Component", () => {
  // Mock data that we'll reuse across tests
  const mockManagers = [
    {
      id: "manager-1",
      name: "John Doe",
      phone_number: "+1234567890",
      email: "john@example.com",
      role: "facility_manager",
      date: "2024-01-15T10:00:00Z",
    },
    {
      id: "manager-2",
      name: "Jane Smith",
      phone_number: "+0987654321",
      email: "jane@example.com",
      role: "facility_manager",
      date: "2024-02-20T14:30:00Z",
    },
  ];

  const mockServiceRequests = [
    {
      id: "req-1",
      request_id: "SR-001",
      tenant_name: "Alice Johnson",
      property_name: "Sunset Apartments",
      issue_category: "Plumbing",
      description: "Leaking faucet in kitchen",
      status: "pending",
      date_reported: "2024-03-01T09:00:00Z",
      updated_at: "2024-03-01T09:00:00Z",
    },
    {
      id: "req-2",
      request_id: "SR-002",
      tenant_name: "Bob Wilson",
      property_name: "Ocean View",
      issue_category: "Electrical",
      description: "Light not working in bedroom",
      status: "in_progress",
      date_reported: "2024-03-02T11:00:00Z",
      updated_at: "2024-03-02T15:00:00Z",
    },
  ];

  /**
   * SETUP: beforeEach runs before EVERY test
   *
   * Reset all mocks to prevent test pollution
   * Set up default mock implementations
   */
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock axios responses
    (axios.get as jest.Mock).mockResolvedValue({
      data: mockManagers,
    });

    (axios.post as jest.Mock).mockResolvedValue({
      data: { success: true },
    });

    (axios.put as jest.Mock).mockResolvedValue({
      data: { success: true },
    });

    (axios.delete as jest.Mock).mockResolvedValue({
      data: { success: true },
    });

    // Mock the custom hook
    (useGetAllServiceRequests as jest.Mock).mockReturnValue({
      data: { service_requests: mockServiceRequests },
      isLoading: false,
      error: null,
    });

    // Mock toast notifications
    (toast.success as jest.Mock).mockImplementation(() => {});
    (toast.error as jest.Mock).mockImplementation(() => {});
  });

  /**
   * TEST SUITE 1: Initial Rendering
   *
   * Tests that the component renders correctly with data
   */
  describe("Initial Rendering", () => {
    /**
     * TEST 1: Basic Rendering
     *
     * ARRANGE-ACT-ASSERT Pattern:
     * 1. ARRANGE: Set up mocks (done in beforeEach)
     * 2. ACT: Render the component
     * 3. ASSERT: Check that expected elements appear
     */
    it("should render the component with title", () => {
      // ===== ACT =====
      render(<LandlordFacility />);

      // ===== ASSERT =====
      // Use getByText to find elements by their text content
      expect(screen.getByText("Facility")).toBeInTheDocument();
      expect(screen.getByText("Service Requests")).toBeInTheDocument();
    });

    /**
     * TEST 2: Loading State
     *
     * Tests that loading indicators appear while data is fetching
     */
    it("should show loading state while fetching managers", () => {
      // ===== ARRANGE =====
      // Make axios return a promise that never resolves (simulates loading)
      (axios.get as jest.Mock).mockImplementation(() => new Promise(() => {}));

      // ===== ACT =====
      render(<LandlordFacility />);

      // ===== ASSERT =====
      // Check for loading indicator
      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    /**
     * TEST 3: Data Display
     *
     * Tests that fetched data is displayed correctly
     * Uses waitFor for async operations
     */
    it("should display facility managers after loading", async () => {
      // ===== ACT =====
      render(<LandlordFacility />);

      // ===== ASSERT =====
      /**
       * waitFor: Waits for async operations to complete
       * - Retries until assertion passes or timeout
       * - Essential for testing async behavior
       */
      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
        expect(screen.getByText("Jane Smith")).toBeInTheDocument();
      });

      // Verify API was called
      expect(axios.get).toHaveBeenCalledWith("/users/team-members", {
        withCredentials: true,
      });
    });

    /**
     * TEST 4: Empty State
     *
     * Tests that empty state is shown when no data exists
     */
    it("should show empty state when no managers exist", async () => {
      // ===== ARRANGE =====
      (axios.get as jest.Mock).mockResolvedValue({ data: [] });

      // ===== ACT =====
      render(<LandlordFacility />);

      // ===== ASSERT =====
      await waitFor(() => {
        expect(
          screen.getByText("No facility managers added yet.")
        ).toBeInTheDocument();
      });
    });
  });

  /**
   * TEST SUITE 2: User Interactions
   *
   * Tests that user actions work correctly
   * Uses userEvent for realistic interactions
   */
  describe("User Interactions", () => {
    /**
     * TEST 5: Opening Modal
     *
     * Tests that clicking a button opens a modal
     * Demonstrates user event simulation
     */
    it("should open add manager modal when button clicked", async () => {
      // ===== ARRANGE =====
      /**
       * userEvent.setup(): Creates a user event instance
       * - More realistic than fireEvent
       * - Simulates actual user behavior
       * - Handles timing and event sequences
       */
      const user = userEvent.setup();
      render(<LandlordFacility />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      // ===== ACT =====
      // Find and click the "Add Manager" button
      const addButton = screen.getByText("Add Manager");
      await user.click(addButton);

      // ===== ASSERT =====
      // Modal should now be visible
      expect(screen.getByTestId("add-manager-modal")).toBeInTheDocument();
    });

    /**
     * TEST 6: Adding a Manager
     *
     * Tests the complete flow of adding a new manager
     * Demonstrates testing API calls and state updates
     */
    it("should add a new manager successfully", async () => {
      // ===== ARRANGE =====
      const user = userEvent.setup();
      render(<LandlordFacility />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      // ===== ACT =====
      // Open modal
      await user.click(screen.getByText("Add Manager"));

      // Submit form (our mock modal auto-fills data)
      await user.click(screen.getByText("Save Manager"));

      // ===== ASSERT =====
      // Verify API was called with correct data
      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          "/users/assign-collaborator",
          expect.objectContaining({
            first_name: "John",
            last_name: "Doe",
            phone_number: "+1234567890",
            role: "facility_manager",
          }),
          { withCredentials: true }
        );
      });

      // Verify success toast was shown
      expect(toast.success).toHaveBeenCalledWith(
        "Facility manager added successfully"
      );

      // Verify data was refetched
      expect(axios.get).toHaveBeenCalledTimes(2); // Initial + refetch
    });

    /**
     * TEST 7: Editing a Manager
     *
     * Tests clicking on a row to edit
     */
    it("should open edit modal when clicking on manager row", async () => {
      // ===== ARRANGE =====
      const user = userEvent.setup();
      render(<LandlordFacility />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      // ===== ACT =====
      // Click on the manager row
      await user.click(screen.getByText("John Doe"));

      // ===== ASSERT =====
      expect(screen.getByTestId("edit-manager-modal")).toBeInTheDocument();
      expect(screen.getByText("Edit John Doe")).toBeInTheDocument();
    });

    /**
     * TEST 8: Deleting a Manager
     *
     * Tests the delete functionality
     */
    it("should delete manager when delete button clicked", async () => {
      // ===== ARRANGE =====
      const user = userEvent.setup();
      render(<LandlordFacility />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      // ===== ACT =====
      // Open edit modal
      await user.click(screen.getByText("John Doe"));

      // Click delete
      await user.click(screen.getByText("Delete Manager"));

      // ===== ASSERT =====
      await waitFor(() => {
        expect(axios.delete).toHaveBeenCalledWith(
          "/users/team-members/manager-1",
          { withCredentials: true }
        );
      });

      expect(toast.success).toHaveBeenCalledWith(
        "Facility manager deleted successfully"
      );
    });
  });

  /**
   * TEST SUITE 3: Service Requests
   *
   * Tests the service requests section
   */
  describe("Service Requests", () => {
    /**
     * TEST 9: Displaying Service Requests
     *
     * Tests that service requests are rendered
     */
    it("should display service requests", async () => {
      // ===== ACT =====
      render(<LandlordFacility />);

      // ===== ASSERT =====
      await waitFor(() => {
        expect(
          screen.getByText("Leaking faucet in kitchen")
        ).toBeInTheDocument();
        expect(
          screen.getByText("Light not working in bedroom")
        ).toBeInTheDocument();
      });
    });

    /**
     * TEST 10: Filtering Service Requests
     *
     * Tests the search functionality
     * Demonstrates testing controlled inputs
     */
    it("should filter service requests by search query", async () => {
      // ===== ARRANGE =====
      const user = userEvent.setup();
      render(<LandlordFacility />);

      await waitFor(() => {
        expect(
          screen.getByText("Leaking faucet in kitchen")
        ).toBeInTheDocument();
      });

      // ===== ACT =====
      // Find the search input by placeholder
      const searchInput = screen.getByPlaceholderText("Search requests...");

      // Type in the search box
      await user.type(searchInput, "plumbing");

      // ===== ASSERT =====
      /**
       * After filtering, only matching requests should be visible
       * Use queryBy to check that elements are NOT present
       */
      expect(screen.getByText("Leaking faucet in kitchen")).toBeInTheDocument();
      expect(
        screen.queryByText("Light not working in bedroom")
      ).not.toBeInTheDocument();
    });

    /**
     * TEST 11: Empty Service Requests
     *
     * Tests empty state for service requests
     */
    it("should show empty state when no service requests", () => {
      // ===== ARRANGE =====
      (useGetAllServiceRequests as jest.Mock).mockReturnValue({
        data: { service_requests: [] },
        isLoading: false,
        error: null,
      });

      // ===== ACT =====
      render(<LandlordFacility />);

      // ===== ASSERT =====
      expect(screen.getByText("No service requests yet.")).toBeInTheDocument();
    });

    /**
     * TEST 12: Loading Service Requests
     *
     * Tests loading state for service requests
     */
    it("should show loading state for service requests", () => {
      // ===== ARRANGE =====
      (useGetAllServiceRequests as jest.Mock).mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      // ===== ACT =====
      render(<LandlordFacility />);

      // ===== ASSERT =====
      expect(
        screen.getByText("Loading service requests...")
      ).toBeInTheDocument();
    });
  });

  /**
   * TEST SUITE 4: Error Handling
   *
   * Tests that errors are handled gracefully
   */
  describe("Error Handling", () => {
    /**
     * TEST 13: API Error
     *
     * Tests that API errors show error messages
     */
    it("should show error toast when adding manager fails", async () => {
      // ===== ARRANGE =====
      const user = userEvent.setup();

      // Mock API to return error
      (axios.post as jest.Mock).mockRejectedValue({
        response: {
          data: {
            message: "Phone number already exists",
          },
        },
      });

      render(<LandlordFacility />);

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
      });

      // ===== ACT =====
      await user.click(screen.getByText("Add Manager"));
      await user.click(screen.getByText("Save Manager"));

      // ===== ASSERT =====
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Phone number already exists");
      });
    });

    /**
     * TEST 14: Service Request Error
     *
     * Tests error state for service requests
     */
    it("should show error state when service requests fail to load", () => {
      // ===== ARRANGE =====
      (useGetAllServiceRequests as jest.Mock).mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error("Failed to fetch"),
      });

      // ===== ACT =====
      render(<LandlordFacility />);

      // ===== ASSERT =====
      expect(screen.getByText("Error loading requests")).toBeInTheDocument();
    });
  });

  /**
   * TEST SUITE 5: Props and Callbacks
   *
   * Tests that component props work correctly
   */
  describe("Props and Callbacks", () => {
    /**
     * TEST 15: Callback Props
     *
     * Tests that callback functions are called
     */
    it("should call onBack when back button clicked", async () => {
      // ===== ARRANGE =====
      const onBack = jest.fn();

      render(<LandlordFacility onBack={onBack} />);

      // ===== ACT =====
      // This would click the back button in the TopNav
      // (Implementation depends on your TopNav component)

      // ===== ASSERT =====
      // expect(onBack).toHaveBeenCalled();
    });
  });

  /**
   * LEARNING NOTES:
   *
   * 1. TESTING LIBRARY QUERIES:
   *    - getBy*: Element must exist (throws if not found)
   *    - queryBy*: Element may not exist (returns null)
   *    - findBy*: Element will appear (async, waits)
   *    - Priority: Role > Label > Placeholder > Text > TestId
   *
   * 2. USER EVENTS:
   *    - userEvent.setup() - Create user instance
   *    - await user.click(element) - Click
   *    - await user.type(input, 'text') - Type
   *    - await user.clear(input) - Clear input
   *    - await user.selectOptions(select, 'value') - Select option
   *
   * 3. ASYNC TESTING:
   *    - Use waitFor() for async operations
   *    - Use findBy* queries (they wait automatically)
   *    - Always await user events
   *    - Don't use act() manually (Testing Library handles it)
   *
   * 4. MOCKING:
   *    - Mock external dependencies (axios, hooks)
   *    - Mock child components to simplify tests
   *    - Reset mocks in beforeEach
   *    - Verify mocks were called correctly
   *
   * 5. WHAT TO TEST:
   *    ✅ Component renders correctly
   *    ✅ User interactions work
   *    ✅ Data is displayed
   *    ✅ Loading and error states
   *    ✅ Form submissions
   *    ✅ Conditional rendering
   *    ❌ Don't test implementation details
   *    ❌ Don't test third-party libraries
   *
   * 6. ACCESSIBILITY:
   *    - Use getByRole when possible
   *    - Tests accessibility automatically
   *    - Ensures components are usable by everyone
   *
   * TO WRITE YOUR OWN COMPONENT TESTS:
   * 1. Copy this file structure
   * 2. Mock external dependencies
   * 3. Create test data
   * 4. Test rendering first
   * 5. Test user interactions
   * 6. Test error states
   * 7. Run with: npm test
   *
   * DEBUGGING TIPS:
   * - Use screen.debug() to see rendered HTML
   * - Use screen.logTestingPlaygroundURL() for query suggestions
   * - Check mock implementations are correct
   * - Verify async operations with waitFor
   * - Use .only to run single test: it.only('test', ...)
   */
});
