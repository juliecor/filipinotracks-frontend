import { useState, useRef } from 'react'
import {
  Box, Typography, Card, TextField, Button, Avatar, Grid,
  Alert, CircularProgress, IconButton, Tooltip,
} from '@mui/material'
import { motion } from 'framer-motion'
import SaveIcon from '@mui/icons-material/Save'
import LockIcon from '@mui/icons-material/Lock'
import PersonIcon from '@mui/icons-material/Person'
import SettingsIcon from '@mui/icons-material/Settings'
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera'
import DeleteIcon from '@mui/icons-material/Delete'
import api from '../../api/axios'
import { NAVY, GOLD, GOLD_DARK } from '../../theme/theme'
import { useAuth } from '../../context/AuthContext'

export default function SettingsPage() {
  const { user, setUser }       = useAuth()
  const fileRef                 = useRef(null)

  const [profile, setProfile]   = useState({
    name:    user?.name    || '',
    email:   user?.email   || '',
    phone:   user?.phone   || '',
    address: user?.address || '',
  })
  const [password, setPassword] = useState({ newPass: '', confirm: '' })

  const [avatarPreview, setAvatarPreview] = useState(user?.profile_picture_url || null)
  const [avatarFile, setAvatarFile]       = useState(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarMsg, setAvatarMsg]             = useState({ type: '', text: '' })

  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPw, setSavingPw]           = useState(false)
  const [profileMsg, setProfileMsg]       = useState({ type: '', text: '' })
  const [pwMsg, setPwMsg]                 = useState({ type: '', text: '' })

  /* ─── Avatar handlers ─── */
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setAvatarMsg({ type: 'error', text: 'Please select an image file (JPG, PNG, WEBP).' })
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setAvatarMsg({ type: 'error', text: 'Image must be under 2 MB.' })
      return
    }
    setAvatarFile(file)
    setAvatarMsg({ type: '', text: '' })
    const reader = new FileReader()
    reader.onload = (ev) => setAvatarPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  const handleUploadAvatar = async () => {
    if (!avatarFile) return
    setUploadingAvatar(true)
    setAvatarMsg({ type: '', text: '' })
    try {
      const formData = new FormData()
      formData.append('profile_picture', avatarFile)
      const { data } = await api.post('/auth/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      if (setUser) setUser(data)
      setAvatarFile(null)
      setAvatarMsg({ type: 'success', text: 'Profile picture updated.' })
    } catch (err) {
      setAvatarMsg({ type: 'error', text: err.response?.data?.message || 'Upload failed.' })
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleRemoveAvatar = () => {
    setAvatarPreview(null)
    setAvatarFile(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  /* ─── Profile save ─── */
  const handleSaveProfile = async () => {
    setSavingProfile(true)
    setProfileMsg({ type: '', text: '' })
    try {
      const { data } = await api.put('/auth/profile', profile)
      if (setUser) setUser(data)
      setProfileMsg({ type: 'success', text: 'Profile updated successfully.' })
    } catch (err) {
      const errors = err.response?.data?.errors
      const msg = errors ? Object.values(errors).flat().join(' ') : (err.response?.data?.message || 'Update failed.')
      setProfileMsg({ type: 'error', text: msg })
    } finally { setSavingProfile(false) }
  }

  /* ─── Password change ─── */
  const handleSavePassword = async () => {
    if (password.newPass !== password.confirm) {
      setPwMsg({ type: 'error', text: 'Passwords do not match.' })
      return
    }
    if (password.newPass.length < 8) {
      setPwMsg({ type: 'error', text: 'Password must be at least 8 characters.' })
      return
    }
    setSavingPw(true)
    setPwMsg({ type: '', text: '' })
    try {
      await api.put('/auth/profile', { password: password.newPass })
      setPassword({ newPass: '', confirm: '' })
      setPwMsg({ type: 'success', text: 'Password changed successfully.' })
    } catch (err) {
      setPwMsg({ type: 'error', text: err.response?.data?.message || 'Failed to change password.' })
    } finally { setSavingPw(false) }
  }

  const roleLabel = user?.roles?.[0]?.name
  const roleColor = roleLabel === 'admin' ? '#8B5CF6' : roleLabel === 'staff' ? '#3B82F6' : '#22C55E'

  return (
    <Box sx={{ minHeight: '100%', bgcolor: '#F4F6FA' }}>

      {/* Hero header */}
      <Box sx={{
        background: `linear-gradient(140deg, ${NAVY} 0%, #0F2744 55%, #153250 100%)`,
        px: { xs: 3, sm: 4, md: 5 }, pt: { xs: 4, md: 5 }, pb: { xs: 5, md: 6 },
      }}>
        <Box sx={{ maxWidth: 780, mx: 'auto' }}>
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.6, borderRadius: '20px',
              bgcolor: `${GOLD}20`, border: `1px solid ${GOLD}30`, mb: 1.5 }}>
              <SettingsIcon sx={{ fontSize: 12, color: GOLD }} />
              <Typography sx={{ color: GOLD, fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Account</Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'white', mb: 0.5, fontSize: { xs: '1.5rem', md: '1.8rem' } }}>
              Settings
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.93rem' }}>
              Manage your account information and security preferences
            </Typography>
          </motion.div>
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ px: { xs: 3, sm: 4, md: 5 }, py: { xs: 3, md: 4 }, maxWidth: 780, mx: 'auto' }}>

        {/* ─── Profile Picture Card ─── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card sx={{ boxShadow: '0 2px 12px rgba(10,22,40,0.07)', border: '1px solid #EDF0F7', mb: 3, overflow: 'hidden' }}>
            <Box sx={{ px: 3, pt: 3, pb: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: `${GOLD}14`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PhotoCameraIcon sx={{ fontSize: 17, color: GOLD }} />
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: NAVY }}>Profile Picture</Typography>
              </Box>
            </Box>

            <Box sx={{ px: 3, pb: 3 }}>
              {avatarMsg.text && <Alert severity={avatarMsg.type} sx={{ mb: 2, borderRadius: 2 }}>{avatarMsg.text}</Alert>}

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
                {/* Avatar preview */}
                <Box sx={{ position: 'relative', flexShrink: 0 }}>
                  <Avatar
                    src={avatarPreview || undefined}
                    sx={{
                      width: 100, height: 100,
                      bgcolor: `${roleColor}18`,
                      color: roleColor,
                      fontWeight: 800,
                      fontSize: '2rem',
                      border: `3px solid ${avatarPreview ? GOLD : '#E8EDF5'}`,
                      boxShadow: avatarPreview ? `0 0 0 3px ${GOLD}30` : 'none',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {!avatarPreview && user?.name?.charAt(0)}
                  </Avatar>
                  {/* Camera overlay */}
                  <Tooltip title="Choose photo">
                    <IconButton
                      onClick={() => fileRef.current?.click()}
                      sx={{
                        position: 'absolute', bottom: -2, right: -2,
                        width: 32, height: 32,
                        background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_DARK} 100%)`,
                        color: NAVY,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                        '&:hover': { background: `linear-gradient(135deg, ${GOLD_DARK} 0%, #8A6E20 100%)` },
                      }}
                    >
                      <PhotoCameraIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </Box>

                {/* Actions */}
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ color: '#5A6A85', mb: 1.5, lineHeight: 1.6 }}>
                    Upload a photo for your account. Supported formats: JPG, PNG, WEBP. Maximum size 2 MB.
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<PhotoCameraIcon />}
                      onClick={() => fileRef.current?.click()}
                      sx={{ borderColor: GOLD, color: GOLD, '&:hover': { borderColor: GOLD_DARK, bgcolor: `${GOLD}08` } }}
                    >
                      {avatarPreview ? 'Change Photo' : 'Upload Photo'}
                    </Button>
                    {avatarFile && (
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={uploadingAvatar ? <CircularProgress size={14} color="inherit" /> : <SaveIcon />}
                        onClick={handleUploadAvatar}
                        disabled={uploadingAvatar}
                        sx={{
                          background: `linear-gradient(135deg, ${GOLD} 0%, ${GOLD_DARK} 100%)`,
                          color: NAVY, fontWeight: 700,
                          boxShadow: `0 4px 12px ${GOLD}40`,
                        }}
                      >
                        Save Photo
                      </Button>
                    )}
                    {avatarPreview && !avatarFile && (
                      <Button
                        variant="outlined"
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={handleRemoveAvatar}
                      >
                        Remove
                      </Button>
                    )}
                  </Box>
                  {avatarFile && (
                    <Typography variant="caption" sx={{ color: '#94A3B8', mt: 1, display: 'block' }}>
                      Selected: {avatarFile.name}
                    </Typography>
                  )}
                </Box>
              </Box>

              {/* Hidden file input */}
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={handleAvatarChange}
              />
            </Box>
          </Card>
        </motion.div>

        {/* ─── Profile Identity Banner ─── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card sx={{ boxShadow: '0 2px 12px rgba(10,22,40,0.07)', border: '1px solid #EDF0F7', mb: 3, overflow: 'hidden' }}>
            <Box sx={{
              p: 3, display: 'flex', alignItems: 'center', gap: 2.5,
              background: `linear-gradient(135deg, ${NAVY}08 0%, ${GOLD}05 100%)`,
              borderBottom: '1px solid #EDF0F7',
            }}>
              <Avatar
                src={user?.profile_picture_url || undefined}
                sx={{ width: 64, height: 64, bgcolor: NAVY, color: GOLD, fontWeight: 800, fontSize: '1.4rem', flexShrink: 0, boxShadow: `0 4px 16px ${NAVY}30` }}
              >
                {!user?.profile_picture_url && user?.name?.charAt(0)}
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: NAVY, lineHeight: 1.2 }}>{user?.name}</Typography>
                <Typography variant="body2" sx={{ color: '#64748B', textTransform: 'capitalize', mt: 0.2 }}>
                  {roleLabel} Account
                </Typography>
                <Typography variant="caption" sx={{ color: '#94A3B8' }}>{user?.email}</Typography>
              </Box>
            </Box>

            {/* Profile form */}
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: `${NAVY}10`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PersonIcon sx={{ fontSize: 17, color: NAVY }} />
                </Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: NAVY }}>Profile Information</Typography>
              </Box>

              {profileMsg.text && <Alert severity={profileMsg.type} sx={{ mb: 2.5, borderRadius: 2 }}>{profileMsg.text}</Alert>}

              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Full Name" value={profile.name}
                    onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} size="small" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Email Address" value={profile.email}
                    onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} size="small" type="email" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Phone Number" value={profile.phone}
                    onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} size="small" />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Address" value={profile.address}
                    onChange={e => setProfile(p => ({ ...p, address: e.target.value }))}
                    size="small" multiline rows={2} />
                </Grid>
              </Grid>
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained" color="secondary"
                  startIcon={savingProfile ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                  onClick={handleSaveProfile} disabled={savingProfile}
                  sx={{ fontWeight: 700, px: 3, py: 1.2, boxShadow: `0 4px 12px ${GOLD}40` }}
                >
                  Save Profile
                </Button>
              </Box>
            </Box>
          </Card>
        </motion.div>

        {/* ─── Change Password ─── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card sx={{ boxShadow: '0 2px 12px rgba(10,22,40,0.07)', border: '1px solid #EDF0F7', overflow: 'hidden' }}>
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <LockIcon sx={{ fontSize: 17, color: '#EF4444' }} />
                </Box>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: NAVY }}>Change Password</Typography>
                  <Typography variant="caption" sx={{ color: '#94A3B8' }}>Use a strong password of at least 8 characters</Typography>
                </Box>
              </Box>

              {pwMsg.text && <Alert severity={pwMsg.type} sx={{ mb: 2.5, borderRadius: 2 }}>{pwMsg.text}</Alert>}

              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="New Password" type="password" value={password.newPass}
                    onChange={e => setPassword(p => ({ ...p, newPass: e.target.value }))} size="small" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Confirm New Password" type="password" value={password.confirm}
                    onChange={e => setPassword(p => ({ ...p, confirm: e.target.value }))} size="small" />
                </Grid>
              </Grid>
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  startIcon={savingPw ? <CircularProgress size={16} /> : <LockIcon />}
                  onClick={handleSavePassword} disabled={savingPw || !password.newPass}
                  sx={{ fontWeight: 700, borderColor: '#EF4444', color: '#EF4444', px: 3, py: 1.2,
                    '&:hover': { borderColor: '#DC2626', bgcolor: '#FEF2F2' } }}
                >
                  Change Password
                </Button>
              </Box>
            </Box>
          </Card>
        </motion.div>

      </Box>
    </Box>
  )
}
