'use client';

import { useState } from 'react';
import { useNotes } from '@/hooks/useNotes';
import { Note } from '@/types';

export default function NotesPage() {
  const [search, setSearch] = useState('');
  const [showPinned, setShowPinned] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [newNote, setNewNote] = useState({ title: '', content: '' });
  const [isCreating, setIsCreating] = useState(false);

  const { notes, isLoading, createNote, updateNote, deleteNote, togglePin } = useNotes({
    pinned: showPinned || undefined,
    search: search || undefined,
  });

  const handleCreateNote = async () => {
    if (!newNote.content.trim()) return;
    
    await createNote.mutateAsync({
      title: newNote.title.trim() || null,
      content: newNote.content.trim(),
      content_type: 'markdown',
      prompt_id: null,
      generation_id: null,
      tags: [],
      is_pinned: false,
      color: null,
    });
    
    setNewNote({ title: '', content: '' });
    setIsCreating(false);
  };

  const handleUpdateNote = async () => {
    if (!editingNote) return;
    
    await updateNote.mutateAsync({
      id: editingNote.id,
      title: editingNote.title,
      content: editingNote.content,
    });
    
    setEditingNote(null);
  };

  const handleDeleteNote = async (note: Note) => {
    if (confirm('Are you sure you want to delete this note?')) {
      await deleteNote.mutateAsync(note.id);
    }
  };

  const handleTogglePin = async (note: Note) => {
    await togglePin.mutateAsync({ id: note.id, isPinned: !note.is_pinned });
  };

  return (
    <div className="min-h-screen bg-black p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extralight text-white mb-2">
          <span className="font-bold text-orange-500">Notes</span>
        </h1>
        <p className="text-white/40 text-sm">
          Document your creative process and ideas
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes..."
            className="w-full max-w-md bg-white/[0.03] border border-white/10 rounded-lg px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors"
          />
        </div>
        <button
          onClick={() => setShowPinned(!showPinned)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
            showPinned
              ? 'border-orange-500/50 bg-orange-500/10 text-orange-500'
              : 'border-white/10 text-white/60 hover:text-white hover:border-white/20'
          }`}
        >
          <span>📌</span>
          Pinned
        </button>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-black rounded-lg font-medium hover:bg-orange-600 transition-colors"
        >
          <span>+</span>
          New Note
        </button>
      </div>

      {/* Create Note Form */}
      {isCreating && (
        <div className="mb-6 p-6 bg-white/[0.02] rounded-xl border border-white/10 animate-slideDown">
          <input
            type="text"
            value={newNote.title}
            onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Note title (optional)"
            className="w-full bg-transparent border-b border-white/10 pb-2 mb-4 text-lg text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors"
            autoFocus
          />
          <textarea
            value={newNote.content}
            onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
            placeholder="Write your note... (Markdown supported)"
            rows={6}
            className="w-full bg-transparent text-white placeholder-white/30 focus:outline-none resize-none"
          />
          <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-white/10">
            <button
              onClick={() => {
                setIsCreating(false);
                setNewNote({ title: '', content: '' });
              }}
              className="px-4 py-2 text-white/60 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateNote}
              disabled={!newNote.content.trim()}
              className="px-6 py-2 bg-orange-500 text-black rounded-lg font-medium hover:bg-orange-600 transition-colors disabled:opacity-50"
            >
              Save Note
            </button>
          </div>
        </div>
      )}

      {/* Notes List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-4xl mb-4 opacity-20">◫</div>
          <h3 className="text-lg font-medium text-white mb-2">No notes yet</h3>
          <p className="text-white/40 text-sm">
            Create your first note to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {notes.map((note) => (
            <div
              key={note.id}
              className={`group relative p-5 rounded-xl border bg-white/[0.02] hover:bg-white/[0.04] transition-all ${
                editingNote?.id === note.id 
                  ? 'border-orange-500/50' 
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              {editingNote?.id === note.id ? (
                // Edit Mode
                <div>
                  <input
                    type="text"
                    value={editingNote.title || ''}
                    onChange={(e) => setEditingNote(prev => prev ? { ...prev, title: e.target.value } : null)}
                    placeholder="Note title"
                    className="w-full bg-transparent border-b border-white/10 pb-2 mb-3 text-white placeholder-white/30 focus:outline-none"
                    autoFocus
                  />
                  <textarea
                    value={editingNote.content}
                    onChange={(e) => setEditingNote(prev => prev ? { ...prev, content: e.target.value } : null)}
                    rows={6}
                    className="w-full bg-transparent text-white placeholder-white/30 focus:outline-none resize-none text-sm"
                  />
                  <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-white/10">
                    <button
                      onClick={() => setEditingNote(null)}
                      className="px-3 py-1 text-xs text-white/60 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateNote}
                      className="px-3 py-1 text-xs bg-orange-500 text-black rounded font-medium hover:bg-orange-600 transition-colors"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-white">
                      {note.title || 'Untitled'}
                    </h3>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleTogglePin(note)}
                        className={`p-1 rounded transition-colors ${
                          note.is_pinned ? 'text-orange-500' : 'text-white/30 hover:text-white/60'
                        }`}
                      >
                        📌
                      </button>
                      <button
                        onClick={() => setEditingNote(note)}
                        className="p-1 rounded text-white/30 hover:text-white/60 transition-colors"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note)}
                        className="p-1 rounded text-white/30 hover:text-red-400 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-sm text-white/60 line-clamp-4 whitespace-pre-wrap">
                    {note.content}
                  </p>
                  
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      {note.is_pinned && (
                        <span className="text-xs text-orange-500">📌 Pinned</span>
                      )}
                    </div>
                    <span className="text-[10px] text-white/30">
                      {new Date(note.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
