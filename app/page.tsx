'use client';

import { useState } from 'react';
import Link from 'next/link';

const API_BASE = 'http://localhost:5000/api/nodes';

type ClarifyingAnswer = { question: string; answer: string };

type NodeData = {
  _id: string;
  name: string;
  goal: string;
  explanation: string;
  clarifyingQuestions: string[];
  status: string;
  generated: boolean;
  children: { _id: string; name: string }[];
};

export default function Home() {
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [node, setNode] = useState<NodeData | null>(null);
  const [answers, setAnswers] = useState<ClarifyingAnswer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: submit topic + goal, get back clarifying questions
  async function handleCreateNode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, goal }),
      });
      if (!res.ok) throw new Error('Failed to create node');
      const data: NodeData = await res.json();
      setNode(data);
      setAnswers(data.clarifyingQuestions.map(q => ({ question: q, answer: '' })));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  // Step 2: submit answers, get back explanation + sub-nodes
  async function handleSubmitAnswers(e: React.FormEvent) {
    e.preventDefault();
    if (!node) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/${node._id}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });
      if (!res.ok) throw new Error('Failed to generate node');
      const data: NodeData = await res.json();
      setNode(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function updateAnswer(index: number, value: string) {
    setAnswers(prev =>
      prev.map((a, i) => (i === index ? { ...a, answer: value } : a))
    );
  }

  return (
    <main className="max-w-2xl mx-auto p-8 space-y-6">
      <h1 className="text-2xl font-bold">Recursive Skill Tree Agent</h1>

      {error && <p className="text-red-600">{error}</p>}

      {/* Phase 1: no node yet — show topic/goal form */}
      {!node && (
        <form onSubmit={handleCreateNode} className="space-y-4">
          <div>
            <label className="block font-medium mb-1">Skill or task</label>
            <input
              className="border rounded w-full p-2"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. React Hooks"
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Your goal</label>
            <textarea
              className="border rounded w-full p-2"
              value={goal}
              onChange={e => setGoal(e.target.value)}
              placeholder="What do you want to achieve through this?"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? 'Thinking...' : 'Start'}
          </button>
        </form>
      )}

      {/* Phase 2: node exists but not yet generated — show intake questions */}
      {node && node.status === 'awaiting_intake' && (
        <form onSubmit={handleSubmitAnswers} className="space-y-4">
          <h2 className="text-lg font-semibold">A few quick questions</h2>
          {answers.map((a, i) => (
            <div key={i}>
              <label className="block font-medium mb-1">{a.question}</label>
              <input
                className="border rounded w-full p-2"
                value={a.answer}
                onChange={e => updateAnswer(i, e.target.value)}
                required
              />
            </div>
          ))}
          <button
            type="submit"
            disabled={loading}
            className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate'}
          </button>
        </form>
      )}

      {/* Phase 3: fully generated — show explanation + sub-nodes */}
      {node && node.status === 'ready' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">{node.name}</h2>
          <p className="whitespace-pre-line">{node.explanation}</p>

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
        </div>
      )}
    </main>
  );
}