import { useState } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  category: 'ent_admin' | 'decider' | 'employee' | 'platform_admin';
  entrepriseId: string;
  hedera_id: string;
}

interface Enterprise {
  id: string;
  name: string;
  symbol: string;
}

interface EditEmployeeModalProps {
  employee: User;
  enterprises: Enterprise[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditEmployeeModal({ employee, enterprises, onClose, onSuccess }: EditEmployeeModalProps) {
  const [formData, setFormData] = useState({
    name: employee.name,
    email: employee.email,
    role: employee.role,
    category: employee.category,
    entrepriseId: employee.entrepriseId,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/users/${employee.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
      } else {
        throw new Error(data.error || 'Failed to update employee');
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-background-dark border border-gray-700 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6 border-b border-gray-700 flex items-center justify-between bg-background-light/10">
          <h2 className="text-2xl font-bold text-white">Edit Employee</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg p-4">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Full Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-background-light/20 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Email Address</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-background-light/20 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Job Role</label>
            <input
              type="text"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full bg-background-light/20 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Enterprise</label>
            <select
              value={formData.entrepriseId}
              onChange={(e) => setFormData({ ...formData, entrepriseId: e.target.value })}
              className="w-full bg-background-light/20 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
              required
            >
              {enterprises.map((ent) => (
                <option key={ent.id} value={ent.id}>
                  {ent.name} ({ent.symbol})
                </option>
              ))}
            </select>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4">
            <p className="text-blue-400 text-sm flex items-start gap-2">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
              <span><strong>Note:</strong> Hedera Account ID ({employee.hedera_id}) cannot be modified.</span>
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-700 rounded-lg text-gray-300 hover:bg-background-light/10 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-primary rounded-lg text-white hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
