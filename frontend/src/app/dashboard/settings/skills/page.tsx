'use client';

import { useState, useEffect } from 'react';
import { getSkills, createSkill, updateSkill, deleteSkill } from './actions';
import { Plus, Edit, Trash2, Save, X, Power, PowerOff } from 'lucide-react';

interface Skill {
  id: string;
  name: string;
  description: string;
  instructions: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    instructions: '',
    is_active: true,
  });

  useEffect(() => {
    loadSkills();
  }, []);

  async function loadSkills() {
    try {
      setLoading(true);
      const data = await getSkills();
      setSkills(data);
    } catch (error) {
      console.error('Error loading skills:', error);
      alert('Failed to load skills');
    } finally {
      setLoading(false);
    }
  }

  function startCreate() {
    setFormData({
      name: '',
      description: '',
      instructions: '',
      is_active: true,
    });
    setIsCreating(true);
    setEditingSkill(null);
  }

  function startEdit(skill: Skill) {
    setFormData({
      name: skill.name,
      description: skill.description || '',
      instructions: skill.instructions,
      is_active: skill.is_active,
    });
    setEditingSkill(skill);
    setIsCreating(false);
  }

  function cancelEdit() {
    setEditingSkill(null);
    setIsCreating(false);
    setFormData({ name: '', description: '', instructions: '', is_active: true });
  }

  async function handleSave() {
    try {
      if (!formData.name.trim()) {
        alert('Name is required');
        return;
      }
      if (!formData.instructions.trim()) {
        alert('Instructions are required');
        return;
      }

      const data = {
        name: formData.name,
        description: formData.description,
        instructions: formData.instructions,
        is_active: formData.is_active,
      };

      if (editingSkill) {
        await updateSkill(editingSkill.id, data);
      } else {
        await createSkill(data);
      }

      await loadSkills();
      cancelEdit();
    } catch (error: any) {
      console.error('Error saving skill:', error);
      alert(error.message || 'Failed to save skill');
    }
  }

  async function handleToggleActive(skill: Skill) {
    try {
      await updateSkill(skill.id, { is_active: !skill.is_active });
      await loadSkills();
    } catch (error: any) {
      console.error('Error toggling skill:', error);
      alert(error.message || 'Failed to toggle skill');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this skill?')) {
      return;
    }

    try {
      await deleteSkill(id);
      await loadSkills();
    } catch (error: any) {
      console.error('Error deleting skill:', error);
      alert(error.message || 'Failed to delete skill');
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h1 className="text-3xl font-bold">Skills Management</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Create custom AI behaviors with instruction sets
            </p>
          </div>
          <button
            onClick={startCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Skill
          </button>
        </div>
      </div>

      {/* Skills List */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : skills.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No skills yet. Create your first AI skill!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {skills.map((skill) => (
            <div
              key={skill.id}
              className={`border rounded-lg p-4 ${
                skill.is_active
                  ? 'bg-white dark:bg-gray-800'
                  : 'bg-gray-50 dark:bg-gray-900 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold">{skill.name}</h3>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        skill.is_active
                          ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {skill.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {skill.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {skill.description}
                    </p>
                  )}
                  <details className="text-sm text-gray-700 dark:text-gray-300">
                    <summary className="cursor-pointer text-blue-600 hover:underline">
                      View Instructions
                    </summary>
                    <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-md overflow-x-auto whitespace-pre-wrap">
                      {skill.instructions}
                    </pre>
                  </details>
                  <p className="text-xs text-gray-500 mt-2">
                    Updated {new Date(skill.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleToggleActive(skill)}
                    className={`p-2 ${
                      skill.is_active
                        ? 'text-green-600 hover:text-green-700'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                    title={skill.is_active ? 'Deactivate' : 'Activate'}
                  >
                    {skill.is_active ? (
                      <Power className="w-4 h-4" />
                    ) : (
                      <PowerOff className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => startEdit(skill)}
                    className="p-2 text-gray-500 hover:text-blue-600"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(skill.id)}
                    className="p-2 text-gray-500 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor Modal */}
      {(editingSkill || isCreating) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="border-b p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">
                {editingSkill ? 'Edit Skill' : 'New Skill'}
              </h2>
              <button onClick={cancelEdit} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                  placeholder="e.g., Code Review Expert"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Brief description (optional)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Instructions *</label>
                <textarea
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 font-mono text-sm"
                  rows={15}
                  placeholder="When reviewing code, check for:&#10;1. Security vulnerabilities&#10;2. Performance bottlenecks&#10;3. Clean code principles..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="is_active" className="text-sm font-medium">
                  Active (visible in skill selector)
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t p-4 flex justify-end gap-2">
              <button
                onClick={cancelEdit}
                className="px-4 py-2 border rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
