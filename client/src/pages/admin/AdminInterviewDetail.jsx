import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { serverUrl } from '../../App';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaClock } from 'react-icons/fa';

const ScoreBadge = ({ label, value }) => (
  <div className="text-center bg-gray-50 rounded-xl p-3">
    <p className="text-lg font-bold text-emerald-600">{value !== undefined ? Number(value).toFixed(1) : '—'}</p>
    <p className="text-xs text-gray-500 mt-0.5">{label}</p>
  </div>
);

const difficultyColor = { easy: 'bg-green-100 text-green-700', medium: 'bg-amber-100 text-amber-700', hard: 'bg-red-100 text-red-700' };

export default function AdminInterviewDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    axios.get(`${serverUrl}/api/admin/interviews/${id}`, { withCredentials: true })
      .then(res => setInterview(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!interview) {
    return <div className="text-center py-12 text-gray-400">Interview not found</div>;
  }

  const { userId: candidate, questions = [] } = interview;

  // Compute averages from questions
  const evaluated = questions.filter(q => q.score > 0);
  const avgConf = evaluated.length ? (evaluated.reduce((s, q) => s + q.confidence, 0) / evaluated.length).toFixed(1) : 0;
  const avgComm = evaluated.length ? (evaluated.reduce((s, q) => s + q.communication, 0) / evaluated.length).toFixed(1) : 0;
  const avgCorr = evaluated.length ? (evaluated.reduce((s, q) => s + q.correctness, 0) / evaluated.length).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/admin/interviews')} className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50">
          <FaArrowLeft className="text-gray-600" size={14} />
        </button>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Interview Detail</h2>
          <p className="text-gray-500 text-sm">Full inspection including all questions, answers, and AI feedback</p>
        </div>
      </div>

      {/* Info + Scores */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Candidate + meta */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h3 className="font-semibold text-gray-800 text-sm">Candidate</h3>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
              {candidate?.name?.slice(0, 1).toUpperCase() || '?'}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{candidate?.name || 'Unknown'}</p>
              <p className="text-xs text-gray-400">{candidate?.email}</p>
            </div>
          </div>
          <div className="space-y-2 pt-2 border-t border-gray-50">
            {[
              ['Role',        interview.role],
              ['Experience',  interview.experience],
              ['Mode',        interview.mode],
              ['Status',      interview.status],
              ['Created',     new Date(interview.createdAt).toLocaleString()],
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="text-gray-400">{label}</span>
                <span className="font-medium text-gray-800">{val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Scores */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-800 text-sm mb-4">Performance Scores</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ScoreBadge label="Final Score"    value={interview.finalScore} />
            <ScoreBadge label="Avg Confidence"    value={avgConf} />
            <ScoreBadge label="Avg Communication" value={avgComm} />
            <ScoreBadge label="Avg Correctness"   value={avgCorr} />
          </div>
          {interview.resumeText && interview.resumeText !== 'None' && (
            <div className="mt-4 p-3 bg-gray-50 rounded-xl">
              <p className="text-xs font-semibold text-gray-500 mb-1">Resume Context</p>
              <p className="text-xs text-gray-600 line-clamp-3">{interview.resumeText}</p>
            </div>
          )}
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-800">Questions & Answers ({questions.length})</h3>
        {questions.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-400 border border-gray-100">
            No questions recorded
          </div>
        ) : (
          questions.map((q, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              {/* Question header */}
              <div className="flex flex-wrap items-start gap-3 mb-4">
                <span className="bg-gray-900 text-white text-xs px-2.5 py-1 rounded-full font-medium">
                  Q{i + 1}
                </span>
                {q.difficulty && (
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${difficultyColor[q.difficulty] || 'bg-gray-100 text-gray-600'}`}>
                    {q.difficulty}
                  </span>
                )}
                {q.timeLimit && (
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <FaClock size={10} /> {q.timeLimit}s limit
                  </span>
                )}
                <span className="ml-auto bg-emerald-100 text-emerald-700 text-xs px-3 py-1 rounded-full font-semibold">
                  Score: {q.score ?? 0}/10
                </span>
              </div>

              {/* Question text */}
              <p className="text-gray-900 font-medium mb-4 leading-relaxed">{q.question}</p>

              {/* Per-question scores */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <ScoreBadge label="Confidence"    value={q.confidence} />
                <ScoreBadge label="Communication" value={q.communication} />
                <ScoreBadge label="Correctness"   value={q.correctness} />
              </div>

              {/* Answer */}
              <div className="bg-gray-50 rounded-xl p-4 mb-3">
                <p className="text-xs font-semibold text-gray-500 mb-1">Candidate's Answer</p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {q.answer && q.answer.trim() ? q.answer : <em className="text-gray-400">No answer submitted</em>}
                </p>
              </div>

              {/* AI Feedback */}
              {q.feedback && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-emerald-600 mb-1">AI Feedback</p>
                  <p className="text-sm text-gray-700">{q.feedback}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
