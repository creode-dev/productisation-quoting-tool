import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SidebarStore {
  isOpen: boolean;
  expandedFolders: Set<string>;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleFolder: (folderPath: string) => void;
  isFolderExpanded: (folderPath: string) => boolean;
}

export const useSidebarStore = create<SidebarStore>()(
  persist(
    (set, get) => ({
      isOpen: true, // Default to open on desktop
      expandedFolders: new Set<string>(),

      toggleSidebar: () => set((state) => ({ isOpen: !state.isOpen })),

      setSidebarOpen: (open: boolean) => set({ isOpen: open }),

      toggleFolder: (folderPath: string) =>
        set((state) => {
          const newExpanded = new Set(state.expandedFolders);
          if (newExpanded.has(folderPath)) {
            newExpanded.delete(folderPath);
          } else {
            newExpanded.add(folderPath);
          }
          return { expandedFolders: newExpanded };
        }),

      isFolderExpanded: (folderPath: string) => {
        return get().expandedFolders.has(folderPath);
      },
    }),
    {
      name: 'sidebar-storage',
      // Custom serialization for Set
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const parsed = JSON.parse(str);
          return {
            ...parsed,
            state: {
              ...parsed.state,
              expandedFolders: new Set(parsed.state.expandedFolders || []),
            },
          };
        },
        setItem: (name, value) => {
          localStorage.setItem(
            name,
            JSON.stringify({
              ...value,
              state: {
                ...value.state,
                expandedFolders: Array.from(value.state.expandedFolders),
              },
            })
          );
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);

