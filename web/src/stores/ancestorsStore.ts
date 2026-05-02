import { create } from "zustand";
import {
  type Ancestor,
  type AncestorInput,
  type AncestorListItem,
  createAncestor,
  getAncestor,
  listAncestors,
} from "../api/client";

interface AncestorsState {
  list: AncestorListItem[];
  current: Ancestor | null;
  loading: boolean;
  error: string | null;
  fetchList: () => Promise<void>;
  fetchOne: (id: string) => Promise<void>;
  create: (input: AncestorInput) => Promise<Ancestor>;
}

export const useAncestorsStore = create<AncestorsState>((set) => ({
  list: [],
  current: null,
  loading: false,
  error: null,
  async fetchList() {
    set({ loading: true, error: null });
    try {
      const list = await listAncestors();
      set({ list, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },
  async fetchOne(id) {
    set({ loading: true, error: null, current: null });
    try {
      const current = await getAncestor(id);
      set({ current, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },
  async create(input) {
    set({ loading: true, error: null });
    try {
      const created = await createAncestor(input);
      set((s) => ({
        loading: false,
        list: [
          ...s.list,
          {
            id: created.id,
            name: created.name,
            relation: created.relation,
            birth_year: created.birth_year,
            death_year: created.death_year,
          },
        ],
      }));
      return created;
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
      throw e;
    }
  },
}));
