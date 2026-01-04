import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Copy, Eye, EyeOff, Trash2, Plus, AlertCircle } from 'lucide-react';

interface ApiKey {
  id: string;
  key_prefix: string;
  name: string;
  tier: string;
  rate_limit: number;
  calls_used: number;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
}

export default function ApiKeys() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyTier, setNewKeyTier] = useState('starter');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    fetchApiKeys();
  }, []);

  async function fetchApiKeys() {
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setApiKeys(data);
    }
    setLoading(false);
  }

  async function generateApiKey() {
    if (!newKeyName.trim()) {
      alert('Please enter a name for your API key');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/keys/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newKeyName,
          tier: newKeyTier
        })
      });

      const result = await response.json();

      if (result.api_key) {
        setGeneratedKey(result.api_key);
        setShowNewKeyModal(false);
        setNewKeyName('');
        fetchApiKeys();
      } else {
        alert('Failed to generate API key');
      }
    } catch (error) {
      console.error('Error generating API key:', error);
      alert('Failed to generate API key');
    }
  }

  async function deleteApiKey(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) {
      return;
    }

    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', id);

    if (!error) {
      fetchApiKeys();
    } else {
      alert('Failed to delete API key');
    }
  }

  async function toggleKeyStatus(id: string, currentStatus: boolean) {
    const { error } = await supabase
      .from('api_keys')
      .update({ is_active: !currentStatus })
      .eq('id', id);

    if (!error) {
      fetchApiKeys();
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  }

  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <div className="text-gray-900 dark:text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">API Keys</h1>
          <p className="text-gray-600 dark:text-gray-300">Manage your RavGateway API keys for programmatic access</p>
        </div>
        <button
          onClick={() => setShowNewKeyModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
        >
          <Plus size={20} />
          Create API Key
        </button>
      </div>

      {/* Generated Key Display */}
      {generatedKey && (
        <div className="bg-green-50 dark:bg-green-900 dark:bg-opacity-30 border border-green-200 dark:border-green-500 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle className="text-green-600 dark:text-green-400 mt-1" size={24} />
            <div>
              <h3 className="font-semibold text-green-900 dark:text-green-300 mb-1">API Key Created Successfully!</h3>
              <p className="text-green-700 dark:text-green-200 text-sm">
                Make sure to copy your API key now. You won't be able to see it again!
              </p>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-green-300 dark:border-green-500 rounded p-4 flex items-center justify-between">
            <code className="text-sm font-mono text-gray-900 dark:text-green-300">
              {showKey ? generatedKey : '••••••••••••••••••••••••••••••••'}
            </code>
            <div className="flex gap-2">
              <button
                onClick={() => setShowKey(!showKey)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-700 dark:text-green-300"
              >
                {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              <button
                onClick={() => copyToClipboard(generatedKey)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-700 dark:text-green-300"
              >
                <Copy size={18} />
              </button>
            </div>
          </div>
          <button
            onClick={() => setGeneratedKey(null)}
            className="mt-4 text-sm text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100"
          >
            I've saved my key, close this message
          </button>
        </div>
      )}

      {/* API Keys Table */}
      {apiKeys.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 dark:bg-opacity-50 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-300 mb-4">No API keys yet</p>
          <button
            onClick={() => setShowNewKeyModal(true)}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            Create your first API key
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 dark:bg-opacity-50 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 dark:bg-opacity-50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-200">Name</th>
                <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-200">Key</th>
                <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-200">Tier</th>
                <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-200">Usage</th>
                <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-200">Status</th>
                <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-200">Last Used</th>
                <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-200">Actions</th>
              </tr>
            </thead>
            <tbody>
              {apiKeys.map((key) => (
                <tr key={key.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 dark:hover:bg-opacity-30">
                  <td className="p-4 text-gray-900 dark:text-white">{key.name || 'Unnamed'}</td>
                  <td className="p-4">
                    <code className="text-sm bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-200 px-2 py-1 rounded">
                      {key.key_prefix}...
                    </code>
                  </td>
                  <td className="p-4">
                    <span className="capitalize text-sm bg-blue-100 dark:bg-blue-900 dark:bg-opacity-50 text-blue-800 dark:text-blue-300 px-2 py-1 rounded border border-blue-200 dark:border-blue-700">
                      {key.tier}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      {key.calls_used.toLocaleString()} / {key.rate_limit.toLocaleString()}
                      <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                        <div
                          className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full"
                          style={{ width: `${Math.min((key.calls_used / key.rate_limit) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => toggleKeyStatus(key.id, key.is_active)}
                      className={`text-sm px-3 py-1 rounded border ${
                        key.is_active
                          ? 'bg-green-100 dark:bg-green-900 dark:bg-opacity-30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-600'
                      }`}
                    >
                      {key.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="p-4 text-sm text-gray-600 dark:text-gray-400">
                    {key.last_used_at
                      ? new Date(key.last_used_at).toLocaleDateString()
                      : 'Never'}
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => deleteApiKey(key.id, key.name)}
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 p-2"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Key Modal */}
      {showNewKeyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Create New API Key</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-200">Key Name</label>
              <input
                type="text"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g., Production API, Development"
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg p-2 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-200">Tier</label>
              <select
                value={newKeyTier}
                onChange={(e) => setNewKeyTier(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg p-2 focus:border-blue-500 focus:outline-none"
              >
                <option value="starter">Starter - 1,000 calls/month</option>
                <option value="growth">Growth - 10,000 calls/month</option>
                <option value="enterprise">Enterprise - 100,000 calls/month</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={generateApiKey}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Generate Key
              </button>
              <button
                onClick={() => {
                  setShowNewKeyModal(false);
                  setNewKeyName('');
                }}
                className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}