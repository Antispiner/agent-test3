import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAncestorsStore } from "../stores/ancestorsStore";
import { AncestorCard } from "../components/AncestorCard";

export function ListPage() {
  const { list, loading, error, fetchList } = useAncestorsStore();

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-fg text-lg font-mono">Ancestors</h1>
          <p className="text-muted-fg text-xs mt-0.5">
            Speak with the ones who came before.
          </p>
        </div>
        <Link to="/add" className="btn btn-primary">
          + Add
        </Link>
      </div>

      {error && (
        <div className="border border-red/40 bg-red/10 text-red rounded-lg px-3 py-2 text-xs mb-4 font-mono">
          {error}
        </div>
      )}

      {loading && list.length === 0 && (
        <div className="text-muted-fg text-sm font-mono">Loading...</div>
      )}

      {!loading && list.length === 0 && !error && (
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <p className="text-fg text-sm mb-1">No ancestors yet.</p>
          <p className="text-muted-fg text-xs mb-4">Add your first one.</p>
          <Link to="/add" className="btn btn-primary">
            + Add ancestor
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {list.map((a) => (
          <AncestorCard key={a.id} ancestor={a} />
        ))}
      </div>
    </div>
  );
}
