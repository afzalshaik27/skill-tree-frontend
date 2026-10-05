'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

const API_BASE = 'http://localhost:5000/api/nodes';

type NodeData = {
  _id: string;
  name: string;
  explanation: string;
  status: string;
  generated: boolean;
  children: { _id: string; name: string }[];
};

export default function TreeNodePage() {
  const params = useParams();
  const nodeId = params.nodeId as string;

  const [node, setNode] = useState<NodeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadNode();
  }, [nodeId]);

  async function loadNode() {
    setLoading(true);
    setError('');
    try {
      // fetch the node first
      const res = await fetch(`${API_BASE}/${nodeId}`);
      if (!res.ok) throw new Error('Failed to fetch node');
      const data: NodeData = await res.json();

      if (data.generated) {
        // already generated — just show it (caching in action)
        setNode(data);
      } else {
        // not generated yet — expand it now (sub-nodes skip intake, straight to generation)
        const expandRes = await fetch(`${API_BASE}/${nodeId}/expand`, { method: 'POST' });
        if (!expandRes.ok) throw new Error('Failed to expand node');
        const expandedData: NodeData = await expandRes.json();
        setNode(expandedData);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <main className="max-w-2xl mx-auto p-8">Loading...</main>;
  if (error) return <main className="max-w-2xl mx-auto p-8 text-red-600">{error}</main>;
  if (!node) return null;

  return (
    <main className="max-w-2xl mx-auto p-8 space-y-4">
      <Link href="/" className="text-sm text-gray-500 hover:underline">
        &larr; Back to start
      </Link>

      <h2 className="text-xl font-semibold">{node.name}</h2>
      <p className="whitespace-pre-line">{node.explanation}</p>

      {node.children.length > 0 && (
        <>
          <h3 className="font-semibold mt-6">Sub-topics</h3>
          <ul className="list-disc list-inside space-y-1">
            {node.children.map(child => (
              <li key={child._id}>
                <Link href={`/tree/${child._id}`} className="text-blue-600 hover:underline">
                  {child.name}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      {node.children.length === 0 && (
        <p className="text-gray-500 italic mt-4">
          This is a leaf node — no further breakdown needed.
        </p>
      )}
    </main>
  );
}