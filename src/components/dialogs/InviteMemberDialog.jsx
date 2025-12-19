import { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

const InviteMemberDialog = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    role: 'worker',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.full_name) {
      toast.error('Email and name are required');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/.netlify/functions/users-invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          email: formData.email,
          full_name: formData.full_name,
          role: formData.role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to invite user');
      }

      toast.success(`Invitation sent to ${formData.email}! They will receive an email to set their password.`);
      setFormData({
        email: '',
        full_name: '',
        role: 'worker',
      });
      onClose();
    } catch (error) {
      console.error('Error inviting user:', error);
      toast.error(error.message || 'Failed to invite user');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/70 transition-opacity"
          onClick={onClose}
        />

        {/* Dialog */}
        <div className="relative bg-zinc-900 border border-zinc-800 rounded-lg max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Add Team Member</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-black border border-zinc-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-black border border-zinc-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Role
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-black border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="worker">Worker</option>
                <option value="contractor">Contractor</option>
                <option value="project_manager">Project Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-3 mt-4">
              <p className="text-xs text-gray-400">
                The user will receive an email invitation to set their own password and join Construction Team.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 text-sm rounded-lg border border-zinc-700 text-gray-300 hover:bg-zinc-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white transition"
              >
                {loading ? 'Creating...' : 'Add Member'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InviteMemberDialog;
