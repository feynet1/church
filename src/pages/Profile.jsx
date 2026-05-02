import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

// Derive display name from profile (supports both old `name` and new first/last)
function getDisplayName(profile) {
  if (!profile) return ''
  if (profile.first_name || profile.last_name) {
    return [profile.first_name, profile.middle_name, profile.last_name]
      .filter(Boolean)
      .join(' ')
  }
  return profile.name || ''
}

function buildFormFromProfile(profile) {
  return {
    first_name: profile?.first_name || '',
    middle_name: profile?.middle_name || '',
    last_name: profile?.last_name || '',
    phone: profile?.phone || '',
    gender: profile?.gender || '',
    age: profile?.age ? String(profile.age) : '',
    address: profile?.address || '',
    education_level: profile?.education_level || '',
    christian_since: profile?.christian_since ? String(profile.christian_since) : '',
    baptism_status: profile?.baptism_status || false
  }
}

function Profile() {
  const { user, profile, updateProfile } = useAuth()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [groupName, setGroupName] = useState(null)
  const [form, setForm] = useState(buildFormFromProfile(profile))

  // Re-sync form when profile loads (handles async profile fetch)
  useEffect(() => {
    if (profile) setForm(buildFormFromProfile(profile))
  }, [profile])

  // Fetch the actual group name instead of showing "Group #3"
  useEffect(() => {
    async function fetchGroupName() {
      if (!profile?.group_id) { setGroupName(null); return }
      const { data } = await supabase
        .from('groups')
        .select('name')
        .eq('id', profile.group_id)
        .single()
      setGroupName(data?.name || null)
    }
    fetchGroupName()
  }, [profile?.group_id])

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  async function handleSave() {
    if (!form.first_name.trim() || !form.last_name.trim()) {
      alert('First name and last name are required.')
      return
    }
    setSaving(true)
    const fullName = [form.first_name.trim(), form.middle_name.trim(), form.last_name.trim()]
      .filter(Boolean)
      .join(' ')

    const { error } = await updateProfile({
      first_name: form.first_name.trim(),
      middle_name: form.middle_name.trim() || null,
      last_name: form.last_name.trim(),
      name: fullName, // keep backward-compat field in sync
      phone: form.phone.trim() || null,
      gender: form.gender || null,
      age: form.age ? Number(form.age) : null,
      address: form.address.trim() || null,
      education_level: form.education_level || null,
      christian_since: form.christian_since ? Number(form.christian_since) : null,
      baptism_status: form.baptism_status
    })
    setSaving(false)
    if (error) {
      alert('Error saving profile: ' + error.message)
    } else {
      setEditing(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  function handleCancel() {
    setForm(buildFormFromProfile(profile))
    setEditing(false)
  }

  const displayName = getDisplayName(profile)
  const avatarLetter = (displayName || user?.email || 'U')[0].toUpperCase()

  const roleBadgeStyle = {
    ...s.roleBadge,
    backgroundColor: profile?.role === 'admin' ? '#ede9fe' : '#dbeafe',
    color: profile?.role === 'admin' ? '#5b21b6' : '#1e40af'
  }

  return (
    <div style={s.container}>
      <div style={s.header}>
        <h1 style={s.title}>👤 My Profile</h1>
        {!editing && (
          <button onClick={() => setEditing(true)} style={s.editBtn}>
            ✏️ Edit Profile
          </button>
        )}
      </div>

      {/* Success banner */}
      {saved && (
        <div style={s.successBanner}>
          ✅ Profile updated successfully!
        </div>
      )}

      <div style={s.card}>
        {/* Avatar + identity */}
        <div style={s.avatarSection}>
          <div style={s.avatar}>{avatarLetter}</div>
          <div>
            <h2 style={s.profileName}>{displayName || 'No name set'}</h2>
            <p style={s.profileEmail}>{user?.email}</p>
            <span style={roleBadgeStyle}>
              {profile?.role === 'admin' ? '⭐ Administrator' : '👤 Member'}
            </span>
          </div>
        </div>

        <hr style={s.divider} />

        {editing ? (
          /* ── Edit form ──────*/
          <div>
            <div style={s.formGrid}>
              <Field label="First Name *">
                <input
                  name="first_name"
                  value={form.first_name}
                  onChange={handleChange}
                  style={s.input}
                  placeholder="First name"
                />
              </Field>
              <Field label="Middle Name">
                <input
                  name="middle_name"
                  value={form.middle_name}
                  onChange={handleChange}
                  style={s.input}
                  placeholder="Middle name (optional)"
                />
              </Field>
              <Field label="Last Name *">
                <input
                  name="last_name"
                  value={form.last_name}
                  onChange={handleChange}
                  style={s.input}
                  placeholder="Last name"
                />
              </Field>
              <Field label="Phone">
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  style={s.input}
                  placeholder="Phone number"
                />
              </Field>
              <Field label="Gender">
                <select name="gender" value={form.gender} onChange={handleChange} style={s.input}>
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </Field>
              <Field label="Age">
                <input
                  name="age"
                  type="number"
                  value={form.age}
                  onChange={handleChange}
                  style={s.input}
                  placeholder="Age"
                  min="0"
                  max="150"
                />
              </Field>
              <Field label="Education Level">
                <select name="education_level" value={form.education_level} onChange={handleChange} style={s.input}>
                  <option value="">Select level</option>
                  <option value="Primary">Primary</option>
                  <option value="Secondary">Secondary</option>
                  <option value="Diploma">Diploma</option>
                  <option value="Bachelor">Bachelor&apos;s Degree</option>
                  <option value="Master">Master&apos;s Degree</option>
                  <option value="PhD">PhD</option>
                  <option value="Other">Other</option>
                </select>
              </Field>
              <Field label="Christian Since (Year)">
                <input
                  name="christian_since"
                  value={form.christian_since}
                  onChange={handleChange}
                  style={s.input}
                  placeholder="e.g. 2010"
                  type="number"
                  min="1900"
                  max={new Date().getFullYear()}
                />
              </Field>
            </div>

            <Field label="Address">
              <input
                name="address"
                value={form.address}
                onChange={handleChange}
                style={s.input}
                placeholder="Residential address"
              />
            </Field>

            <div style={s.checkboxField}>
              <label style={s.checkboxLabel}>
                <input
                  name="baptism_status"
                  type="checkbox"
                  checked={form.baptism_status}
                  onChange={handleChange}
                  style={s.checkbox}
                />
                <span>Baptized</span>
              </label>
            </div>

            <div style={s.formActions}>
              <button onClick={handleCancel} style={s.cancelBtn}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={s.saveBtn}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        ) : (
          /* ── Read-only view ────────────────────────────────────── */
          <div style={s.infoGrid}>
            <InfoRow label="First Name" value={profile?.first_name} />
            <InfoRow label="Middle Name" value={profile?.middle_name} />
            <InfoRow label="Last Name" value={profile?.last_name} />
            <InfoRow label="Phone" value={profile?.phone} />
            <InfoRow label="Gender" value={profile?.gender} />
            <InfoRow label="Age" value={profile?.age} />
            <InfoRow label="Address" value={profile?.address} />
            <InfoRow label="Education Level" value={profile?.education_level} />
            <InfoRow label="Christian Since" value={profile?.christian_since} />
            <InfoRow
              label="Baptized"
              value={profile?.baptism_status ? '✓ Yes' : 'No'}
              valueStyle={profile?.baptism_status ? { color: '#059669', fontWeight: 700 } : {}}
            />
            <InfoRow
              label="Group"
              value={groupName || (profile?.group_id ? `Group #${profile.group_id}` : null)}
              emptyText="Not assigned to a group"
            />
          </div>
        )}
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={s.field}>
      <label style={s.label}>{label}</label>
      {children}
    </div>
  )
}

function InfoRow({ label, value, valueStyle = {}, emptyText = '—' }) {
  return (
    <div style={s.infoRow}>
      <span style={s.infoLabel}>{label}</span>
      <span style={{ ...s.infoValue, ...valueStyle }}>{value || emptyText}</span>
    </div>
  )
}

const s = {
  container: { padding: '20px', maxWidth: '700px' },
  header: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: '24px'
  },
  title: { fontSize: '28px', color: '#1f2937', margin: 0, fontWeight: '700' },
  editBtn: {
    padding: '9px 18px', borderRadius: '8px',
    background: '#4f46e5', color: '#fff',
    border: 'none', fontSize: '14px', fontWeight: '600', cursor: 'pointer'
  },
  successBanner: {
    background: '#d1fae5', color: '#065f46',
    border: '1px solid #6ee7b7', borderRadius: '8px',
    padding: '12px 16px', marginBottom: '16px',
    fontSize: '14px', fontWeight: '600'
  },
  card: {
    backgroundColor: '#fff', borderRadius: '12px',
    padding: '28px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
  },
  avatarSection: { display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' },
  avatar: {
    width: '72px', height: '72px', borderRadius: '50%',
    background: 'linear-gradient(135deg,#7c3aed,#a78bfa)',
    color: '#fff', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: '28px', fontWeight: '800', flexShrink: 0
  },
  profileName: { margin: '0 0 4px 0', fontSize: '22px', fontWeight: '700', color: '#1f2937' },
  profileEmail: { margin: '0 0 8px 0', fontSize: '14px', color: '#6b7280' },
  roleBadge: {
    display: 'inline-block', padding: '4px 12px',
    borderRadius: '12px', fontSize: '13px', fontWeight: '600'
  },
  divider: { border: 'none', borderTop: '1px solid #e5e7eb', margin: '0 0 20px 0' },
  // Info view
  infoGrid: { display: 'flex', flexDirection: 'column' },
  infoRow: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', padding: '12px 0',
    borderBottom: '1px solid #f3f4f6'
  },
  infoLabel: { fontSize: '14px', color: '#6b7280', fontWeight: '500' },
  infoValue: { fontSize: '14px', color: '#1f2937', fontWeight: '600', textAlign: 'right', maxWidth: '60%' },
  // Form
  formGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr',
    gap: '16px', marginBottom: '16px'
  },
  field: { marginBottom: '4px' },
  label: {
    display: 'block', marginBottom: '6px',
    fontSize: '13px', color: '#374151', fontWeight: '600'
  },
  input: {
    width: '100%', padding: '10px 12px', borderRadius: '8px',
    border: '1.5px solid #e5e7eb', fontSize: '14px',
    boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit',
    background: '#fafafa'
  },
  checkboxField: {
    marginBottom: '16px', padding: '12px 16px',
    backgroundColor: '#f9fafb', borderRadius: '8px',
    border: '1px solid #e5e7eb'
  },
  checkboxLabel: {
    display: 'flex', alignItems: 'center', gap: '10px',
    fontSize: '14px', color: '#374151', cursor: 'pointer', fontWeight: '500'
  },
  checkbox: { width: '18px', height: '18px', cursor: 'pointer', accentColor: '#4f46e5' },
  formActions: {
    display: 'flex', justifyContent: 'flex-end',
    gap: '10px', marginTop: '20px', paddingTop: '16px',
    borderTop: '1px solid #f3f4f6'
  },
  cancelBtn: {
    padding: '9px 20px', borderRadius: '8px',
    background: '#f3f4f6', color: '#374151',
    border: '1px solid #e5e7eb', fontSize: '14px',
    fontWeight: '600', cursor: 'pointer'
  },
  saveBtn: {
    padding: '9px 20px', borderRadius: '8px',
    background: '#4f46e5', color: '#fff',
    border: 'none', fontSize: '14px',
    fontWeight: '600', cursor: 'pointer'
  }
}

export default Profile
