import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer'; // Optional: if using Immer

// Define the interface for the store's state
interface MyStoreState {
  count: number;
  data: string | null;
  isLoading: boolean;
  // Add other state properties here, e.g.:
  // items: SomeType[];
  // selectedItemId: string | null;
}

// Define the interface for the store's actions
interface MyStoreActions {
  increment: () => void;
  decrement: (amount: number) => void;
  fetchData: () => Promise<void>;
  reset: () => void;
  // Add other action signatures here, e.g.:
  // addItem: (item: SomeType) => void;
  // selectItem: (id: string) => void;
}

// Define the initial state for the store
const initialState: MyStoreState = {
  count: 0,
  data: null,
  isLoading: false,
  // Initialize other state properties here
  // items: [],
  // selectedItemId: null,
};

/**
 * Creates a Zustand store for managing [Describe the purpose of this store].
 *
 * Includes state for [mention key state variables] and actions for [mention key actions].
 */
export const useMyStore = create<MyStoreState & MyStoreActions>()(
  // Optional: Wrap with immer middleware for direct state mutation syntax
  immer((set, get) => ({
    // Spread the initial state
    ...initialState,

    // --- Actions Implementation ---

    /**
     * Increments the count state by 1.
     */
    increment: () => {
      set((state) => {
        // Immer allows direct mutation syntax
        state.count += 1;
      });
      // OR: Standard Zustand syntax without Immer
      // set((state) => ({ count: state.count + 1 }));
    },

    /**
     * Decrements the count state by the specified amount.
     * @param amount - The number to decrement by.
     */
    decrement: (amount) => {
      // Standard syntax is often fine for simple updates
      set((state) => ({ count: state.count - amount }));
    },

    /**
     * Fetches data asynchronously and updates the store state.
     * Handles loading and error states.
     */
    fetchData: async () => {
      // Set loading state to true before starting the fetch
      set({ isLoading: true });
      try {
        // Replace with your actual API client call
        // const responseData = await apiClient.fetchMyData();
        // Simulate API call
        const mockData = await new Promise<string>(resolve => setTimeout(() => resolve('Mock data fetched!'), 1000));

        // Update state on successful fetch
        set((state) => {
          state.data = mockData;
          state.isLoading = false;
        });
      } catch (error) {
        // Log the error and update state to reflect the error
        console.error('Failed to fetch data:', error);
        set({ isLoading: false, data: null }); // Consider adding an error state field
      }
    },

    /**
     * Resets the store state to its initial values.
     */
    reset: () => {
      // Set the state back to the defined initial state
      set(initialState);
    },

    // Implement other actions defined in MyStoreActions here...
    // Example:
    // addItem: (item) => {
    //   set((state) => {
    //     state.items.push(item);
    //   });
    // },
    // selectItem: (id) => {
    //   set({ selectedItemId: id });
    // },

  })) // Close immer wrapper if used
);

// --- Optional: Selectors ---
// Example selector for deriving data
// export const selectItemCount = (state: MyStoreState) => state.items.length;
// Usage in component: const count = useMyStore(selectItemCount);

