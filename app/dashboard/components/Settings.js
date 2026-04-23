'use client';

import { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { createClient } from '@/lib/supabase/client';

export default function Settings({ onAvatarUpdate, currentAvatar, userRole }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState(userRole || 'Viewer');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });

  const [avatarPreview, setAvatarPreview] = useState(currentAvatar || null);
  const fileInputRef = useRef(null);

  const supabase = createClient();

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || '');
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          try {
            const res = await fetch('http://localhost:3000/api/profile', {
              headers: { 'Authorization': `Bearer ${session.access_token}` },
            });
            if (res.ok) {
              const data = await res.json();
              if (data.full_name) setFullName(data.full_name);
              if (data.avatar_url) setAvatarPreview(data.avatar_url);
              if (data.role) setRole(data.role);
            }
          } catch (e) {
            console.error('Failed to load profile data', e);
          }
        }
      }
    }
    loadUser();
  }, [supabase]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileMessage({ type: '', text: '' });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const payload = { full_name: fullName, avatar_url: avatarPreview };
      if (userRole === 'Admin') {
        payload.role = role;
      }
      
      console.log("📤 SENDING TO API:", payload);
      const res = await fetch('http://localhost:3000/api/profile', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('Backend returned error:', errorData);
        throw new Error(errorData.error || 'Failed to update profile');
      }
      setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      console.error('Update Request Error:', err);
      setProfileMessage({ type: 'error', text: err.message });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
    if (onAvatarUpdate) {
      onAvatarUpdate(url);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">System Settings</h2>
        <p className="text-gray-500 text-sm">Manage your profile, security, and application preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* SECTION 1: Profile Management */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative">
          <div className="flex items-center space-x-3 mb-4">
            <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <i className="fa-regular fa-user"></i>
            </div>
            <h3 className="text-lg font-bold text-gray-800">Account Profile</h3>
          </div>
          
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-gray-50 text-gray-600"
                readOnly
              />
              <p className="text-xs text-gray-400 mt-1">Email is tied to your authentication system.</p>
            </div>

            {userRole === 'Admin' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role Selection</label>
                <div className="relative">
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none bg-white cursor-pointer"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Auditor">Auditor</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    <i className="fa-solid fa-chevron-down text-gray-400 text-xs"></i>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-1">Control access level. Only Admins can modify this.</p>
              </div>
            )}
            
            {profileMessage.text && (
              <div className={`p-3 rounded-lg text-sm ${profileMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {profileMessage.text}
              </div>
            )}

            <button
              type="submit"
              disabled={isUpdatingProfile}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
            >
              {isUpdatingProfile ? <><i className="fa-solid fa-spinner fa-spin mr-2"></i> Saving...</> : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* SECTION 2: White Labeling / Avatar */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3 mb-4">
            <div className="h-8 w-8 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center">
              <i className="fa-solid fa-camera"></i>
            </div>
            <h3 className="text-lg font-bold text-gray-800">Profile Branding</h3>
          </div>
          <p className="text-sm text-gray-500 mb-6">Upload a custom profile picture to display across the FortiGRC dashboard headers.</p>
          
          <div className="flex items-center space-x-6">
            <div className="shrink-0 h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-gray-200">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar Preview" className="h-full w-full object-cover" />
              ) : (
                <i className="fa-regular fa-image text-3xl text-gray-400"></i>
              )}
            </div>
            <div>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition mb-2"
              >
                Choose Image
              </button>
              <p className="text-xs text-gray-400">PNG, JPG up to 2MB. 1:1 aspect ratio recommended.</p>
            </div>
          </div>
        </div>

        {/* SECTION 3: API Integration */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 col-span-1 lg:col-span-2">
          <div className="flex items-center mb-4">
            <div className="h-8 w-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center mr-3">
              <i className="fa-solid fa-plug"></i>
            </div>
            <h3 className="text-lg font-bold text-gray-800">External Data Ingestion</h3>
          </div>
          <p className="text-sm text-gray-500 mb-6">Configure external vulnerability scanners (e.g. Tenable, Qualys) to push findings directly into FortiGRC.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Webhook URL</label>
                <div className="pl-4 pr-2 py-2 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between">
                    <code className="text-sm text-gray-600 select-all">http://localhost:3000/api/ingest/vulnerabilities</code>
                    <button onClick={() => { navigator.clipboard.writeText('http://localhost:3000/api/ingest/vulnerabilities'); window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'URL Copied', type: 'success' } })); }} className="text-gray-400 hover:text-blue-600 transition p-1.5" title="Copy URL">
                        <i className="fa-regular fa-copy"></i>
                    </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API Key (INGEST_SECRET)</label>
                <div className="pl-4 pr-2 py-2 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between">
                    <code className="text-sm text-gray-600 tracking-wider">fk_live_89a3x...</code>
                    <button onClick={() => { navigator.clipboard.writeText('fk_live_89a3x_dummy_secret_key'); window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'API Key Copied', type: 'success' } })); }} className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded text-xs font-semibold transition">
                        Copy API Key
                    </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">Pass this key in the Authorization header as a Bearer token.</p>
              </div>
            </div>
            
            <div className="bg-gray-900 rounded-lg p-5 overflow-x-auto relative shadow-inner">
                <span className="absolute top-2 right-3 text-[10px] text-gray-500 font-mono uppercase tracking-widest">Payload Format</span>
<pre className="text-green-400 text-[11px] font-mono leading-relaxed mt-2">
{`{
  "scanner": "Tenable.io",
  "vulnerability_id": "CVE-2023-1234",
  "title": "Critical RCE in Web Server",
  "severity_level": "Critical",
  "likelihood": 5,
  "impact": 5,
  "jncsf_capability": "Operations"
}`}
</pre>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
