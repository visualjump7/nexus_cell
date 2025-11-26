'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { platforms } from '@/lib/platforms/index';

export default function SettingsPage() {
  const { profile, plan, updateProfile, isLoading } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [defaultPlatform, setDefaultPlatform] = useState(profile?.default_platform || 'midjourney');
  const [defaultAspectRatio, setDefaultAspectRatio] = useState(profile?.default_aspect_ratio || '16:9');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');
    
    try {
      await updateProfile({
        display_name: displayName,
        default_platform: defaultPlatform,
        default_aspect_ratio: defaultAspectRatio,
      });
      setSaveMessage('Settings saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      setSaveMessage('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extralight text-white mb-2">
          <span className="font-bold text-orange-500">Settings</span>
        </h1>
        <p className="text-white/40 text-sm">
          Manage your account preferences
        </p>
      </div>

      <div className="max-w-2xl space-y-8">
        {/* Profile Section */}
        <section className="p-6 bg-white/[0.02] rounded-xl border border-white/10">
          <h2 className="text-lg font-medium text-white mb-4">Profile</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-white/50 uppercase tracking-wider mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-white/30 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs text-white/50 uppercase tracking-wider mb-2">
                Email
              </label>
              <input
                type="email"
                value={profile?.email || ''}
                disabled
                className="w-full bg-white/[0.02] border border-white/5 rounded-lg px-4 py-3 text-white/50 cursor-not-allowed"
              />
              <p className="text-xs text-white/30 mt-1">Email cannot be changed</p>
            </div>
          </div>
        </section>

        {/* Defaults Section */}
        <section className="p-6 bg-white/[0.02] rounded-xl border border-white/10">
          <h2 className="text-lg font-medium text-white mb-4">Defaults</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-white/50 uppercase tracking-wider mb-2">
                Default Platform
              </label>
              <select
                value={defaultPlatform}
                onChange={(e) => setDefaultPlatform(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors"
              >
                {Object.values(platforms).map((platform) => (
                  <option key={platform.id} value={platform.id}>
                    {platform.icon} {platform.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-white/50 uppercase tracking-wider mb-2">
                Default Aspect Ratio
              </label>
              <select
                value={defaultAspectRatio}
                onChange={(e) => setDefaultAspectRatio(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors"
              >
                <option value="16:9">16:9 (Landscape)</option>
                <option value="9:16">9:16 (Portrait)</option>
                <option value="1:1">1:1 (Square)</option>
                <option value="21:9">21:9 (Cinematic)</option>
              </select>
            </div>
          </div>
        </section>

        {/* Subscription Section */}
        <section className="p-6 bg-white/[0.02] rounded-xl border border-white/10">
          <h2 className="text-lg font-medium text-white mb-4">Subscription</h2>
          
          <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-lg border border-white/5">
            <div>
              <div className="font-medium text-white">{plan?.name || 'Free'} Plan</div>
              <div className="text-sm text-white/50">
                {plan?.generations_per_month === -1 
                  ? 'Unlimited generations' 
                  : `${plan?.generations_per_month || 0} generations per month`}
              </div>
            </div>
            {plan?.id === 'free' && (
              <a
                href="/dashboard/settings/billing"
                className="px-4 py-2 bg-orange-500 text-black rounded-lg font-medium hover:bg-orange-600 transition-colors"
              >
                Upgrade
              </a>
            )}
            {plan?.id !== 'free' && (
              <a
                href="/dashboard/settings/billing"
                className="px-4 py-2 border border-white/20 text-white rounded-lg hover:bg-white/5 transition-colors"
              >
                Manage
              </a>
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-white/[0.02] rounded-lg">
              <div className="text-white/50">Custom Cards</div>
              <div className="text-white font-medium">
                {plan?.custom_cards_limit === -1 ? 'Unlimited' : plan?.custom_cards_limit || 0}
              </div>
            </div>
            <div className="p-3 bg-white/[0.02] rounded-lg">
              <div className="text-white/50">Presets</div>
              <div className="text-white font-medium">
                {plan?.presets_limit === -1 ? 'Unlimited' : plan?.presets_limit || 0}
              </div>
            </div>
            <div className="p-3 bg-white/[0.02] rounded-lg">
              <div className="text-white/50">Saved Prompts</div>
              <div className="text-white font-medium">
                {plan?.prompts_limit === -1 ? 'Unlimited' : plan?.prompts_limit || 0}
              </div>
            </div>
            <div className="p-3 bg-white/[0.02] rounded-lg">
              <div className="text-white/50">Storage</div>
              <div className="text-white font-medium">
                {plan?.storage_gb === -1 ? 'Unlimited' : `${plan?.storage_gb || 0} GB`}
              </div>
            </div>
          </div>
        </section>

        {/* Save Button */}
        <div className="flex items-center justify-between">
          {saveMessage && (
            <span className={`text-sm ${saveMessage.includes('success') ? 'text-green-500' : 'text-red-500'}`}>
              {saveMessage}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="ml-auto px-6 py-2 bg-orange-500 text-black rounded-lg font-medium hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
