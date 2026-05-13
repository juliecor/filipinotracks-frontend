import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Box, Typography, Avatar, IconButton, TextField,
  Badge, CircularProgress, Tooltip,
} from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import ChatIcon from '@mui/icons-material/Chat'
import CloseIcon from '@mui/icons-material/Close'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import SendIcon from '@mui/icons-material/Send'
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions'
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate'
import CancelIcon from '@mui/icons-material/Cancel'
import api from '../../api/axios'
import { NAVY, GOLD } from '../../theme/theme'
import { useAuth } from '../../context/AuthContext'

const SERVICE_SHORT = {
  'title-verification':    'Title Verification',
  'title-transfer':        'Title Transfer',
  'tax-declaration':       'Tax Declaration',
  'mortgage-annotation':   'Mortgage Annotation',
  'title-cancellation':    'Title Cancellation',
  'land-registration':     'Land Registration',
  'property-consultation': 'Property Consultation',
  'document-processing':   'Document Processing',
}

const EMOJIS = [
  '😀','😃','😄','😁','😆','😅','😂','🤣',
  '😊','😇','🙂','🙃','😉','😍','🥰','😘',
  '😋','😛','😝','😜','🤩','🥳','😏','😒',
  '😞','😔','😢','😭','😤','😠','😡','🤬',
  '😱','😨','😳','🤗','🤔','🤭','🤫','😶',
  '😐','😑','😬','🙄','😯','😮','🥺','😴',
  '👍','👎','👋','🤝','👏','🙏','🤞','✌️',
  '❤️','🧡','💛','💚','💙','💜','💔','💕',
  '🔥','✨','🎉','🎊','💯','⚡','🌟','💫',
  '✅','❌','🌈','🎵','🎶','🤑','💎','🏆',
]

function formatTime(dt) {
  if (!dt) return ''
  const d = new Date(dt)
  const now = new Date()
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
}

export default function ChatWidget() {
  const { user } = useAuth()
  const [open, setOpen]                   = useState(false)
  const [conversations, setConversations] = useState([])
  const [active, setActive]               = useState(null)
  const [messages, setMessages]           = useState([])
  const [input, setInput]                 = useState('')
  const [sending, setSending]             = useState(false)
  const [totalUnread, setTotalUnread]     = useState(0)
  const [emojiOpen, setEmojiOpen]         = useState(false)
  const [imageFile, setImageFile]         = useState(null)
  const [imagePreview, setImagePreview]   = useState(null)
  const [lightbox, setLightbox]           = useState(null)

  const chatBottomRef = useRef(null)
  const msgPollRef    = useRef(null)
  const convPollRef   = useRef(null)
  const fileRef       = useRef(null)

  const fetchConversations = useCallback(() => {
    api.get('/messages/conversations')
      .then(({ data }) => {
        setConversations(data)
        setTotalUnread(data.reduce((s, c) => s + (c.unread_count || 0), 0))
      })
      .catch(() => {})
  }, [])

  const fetchMessages = useCallback((txId) => {
    if (!txId) return
    api.get(`/transactions/${txId}/messages`)
      .then(({ data }) => setMessages(data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetchConversations()
    convPollRef.current = setInterval(fetchConversations, 8000)
    return () => clearInterval(convPollRef.current)
  }, [fetchConversations])

  useEffect(() => {
    clearInterval(msgPollRef.current)
    if (active) {
      fetchMessages(active.transaction_id)
      msgPollRef.current = setInterval(() => fetchMessages(active.transaction_id), 4000)
    } else {
      setMessages([])
    }
    return () => clearInterval(msgPollRef.current)
  }, [active, fetchMessages])

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const openConversation = (conv) => {
    setActive(conv)
    setEmojiOpen(false)
    setImageFile(null)
    setImagePreview(null)
    setTimeout(fetchConversations, 800)
  }

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = ev => setImagePreview(ev.target.result)
    reader.readAsDataURL(file)
    e.target.value = ''
    setEmojiOpen(false)
  }

  const removeImage = () => { setImageFile(null); setImagePreview(null) }

  const sendMessage = async () => {
    const body = input.trim()
    if (!body && !imageFile) return
    if (sending) return

    setSending(true)
    const prevInput = body
    const prevFile  = imageFile
    const prevPreview = imagePreview
    setInput('')
    setImageFile(null)
    setImagePreview(null)
    setEmojiOpen(false)

    try {
      let data
      if (prevFile) {
        const fd = new FormData()
        if (prevInput) fd.append('body', prevInput)
        fd.append('attachment', prevFile)
        const res = await api.post(
          `/transactions/${active.transaction_id}/messages`,
          fd,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        )
        data = res.data
      } else {
        const res = await api.post(
          `/transactions/${active.transaction_id}/messages`,
          { body: prevInput }
        )
        data = res.data
      }
      setMessages(prev => [...prev, data])
      fetchConversations()
    } catch {
      setInput(prevInput)
      setImageFile(prevFile)
      setImagePreview(prevPreview)
    } finally {
      setSending(false)
    }
  }

  const insertEmoji = (emoji) => {
    setInput(prev => prev + emoji)
  }

  const handleToggle = () => {
    const next = !open
    setOpen(next)
    if (next) { setActive(null); fetchConversations() }
    else { setEmojiOpen(false) }
  }

  const handleClose = () => {
    setOpen(false)
    setActive(null)
    setEmojiOpen(false)
    setImageFile(null)
    setImagePreview(null)
  }

  // dynamic messages area height
  const msgAreaHeight = 310 - (emojiOpen ? 128 : 0) - (imagePreview ? 74 : 0)

  const panelSx = {
    position: 'absolute', bottom: 68, right: 0,
    width: 330,
    borderRadius: '18px',
    overflow: 'hidden',
    background: 'rgba(255,255,255,0.97)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    boxShadow: '0 24px 64px rgba(10,22,40,0.22), 0 4px 16px rgba(10,22,40,0.1)',
    border: '1px solid rgba(255,255,255,0.7)',
  }

  const headerSx = {
    px: 2, py: 1.6,
    background: `linear-gradient(135deg, ${NAVY} 0%, #1A3A6E 100%)`,
    display: 'flex', alignItems: 'center',
  }

  return (
    <>
      {/* Image lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
            style={{
              position: 'fixed', inset: 0, zIndex: 2000,
              background: 'rgba(0,0,0,0.85)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'zoom-out',
            }}
          >
            <img
              src={lightbox}
              alt="attachment"
              style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12, objectFit: 'contain' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <Box sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1300 }}>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.94 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              <Box sx={panelSx}>

                {/* ── Conversation list ── */}
                {!active && (
                  <>
                    <Box sx={headerSx}>
                      <ChatIcon sx={{ color: GOLD, fontSize: 17, mr: 1 }} />
                      <Typography sx={{ color: 'white', fontWeight: 800, fontSize: '0.93rem', flex: 1 }}>
                        Messages
                      </Typography>
                      {totalUnread > 0 && (
                        <Box sx={{ bgcolor: '#EF4444', color: 'white', borderRadius: '10px', px: 0.9, py: 0.1, fontSize: '0.62rem', fontWeight: 800, mr: 1 }}>
                          {totalUnread > 99 ? '99+' : totalUnread}
                        </Box>
                      )}
                      <IconButton size="small" onClick={handleClose}
                        sx={{ color: 'rgba(255,255,255,0.65)', '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>
                        <CloseIcon sx={{ fontSize: 17 }} />
                      </IconButton>
                    </Box>

                    <Box sx={{ maxHeight: 400, overflowY: 'auto', '&::-webkit-scrollbar': { width: 3 }, '&::-webkit-scrollbar-thumb': { bgcolor: '#E2E8F0', borderRadius: 4 } }}>
                      {conversations.length === 0 ? (
                        <Box sx={{ py: 6, textAlign: 'center' }}>
                          <ChatIcon sx={{ fontSize: 38, color: '#E2E8F0', mb: 1 }} />
                          <Typography variant="body2" sx={{ color: '#94A3B8', fontWeight: 600, mb: 0.3 }}>No conversations yet</Typography>
                          <Typography variant="caption" sx={{ color: '#CBD5E1' }}>Start a chat inside a transaction</Typography>
                        </Box>
                      ) : conversations.map((conv) => (
                        <Box
                          key={conv.transaction_id}
                          onClick={() => openConversation(conv)}
                          sx={{
                            px: 2, py: 1.6, display: 'flex', gap: 1.4, alignItems: 'center',
                            cursor: 'pointer',
                            bgcolor: conv.unread_count > 0 ? `${GOLD}09` : 'transparent',
                            borderBottom: '1px solid #F4F6FA',
                            '&:hover': { bgcolor: '#F8FAFC' },
                            transition: 'background 0.15s',
                          }}
                        >
                          <Box sx={{ position: 'relative', flexShrink: 0 }}>
                            <Avatar src={conv.other_avatar || undefined}
                              sx={{ width: 42, height: 42, bgcolor: NAVY, color: GOLD, fontWeight: 800, fontSize: '0.88rem' }}>
                              {!conv.other_avatar && (conv.other_name?.[0] ?? 'S')}
                            </Avatar>
                            <Box sx={{ position: 'absolute', bottom: 1, right: 1, width: 10, height: 10, borderRadius: '50%', bgcolor: '#22C55E', border: '2px solid white' }} />
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.2 }}>
                              <Typography variant="body2" sx={{ fontWeight: conv.unread_count > 0 ? 800 : 600, color: NAVY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                                {conv.other_name ?? 'Support Team'}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#B0BAC9', fontSize: '0.6rem', flexShrink: 0, ml: 0.8 }}>
                                {formatTime(conv.last_message_at)}
                              </Typography>
                            </Box>
                            <Typography variant="caption" sx={{ color: GOLD, fontWeight: 700, fontSize: '0.63rem', fontFamily: 'monospace', display: 'block', mb: 0.2 }}>
                              {conv.transaction_code} · {SERVICE_SHORT[conv.service_type] || conv.service_type}
                            </Typography>
                            <Typography variant="body2" sx={{ color: conv.unread_count > 0 ? '#1E293B' : '#94A3B8', fontWeight: conv.unread_count > 0 ? 600 : 400, fontSize: '0.77rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {conv.last_message ?? 'No messages yet'}
                            </Typography>
                          </Box>
                          {conv.unread_count > 0 && (
                            <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: '#EF4444', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem', fontWeight: 800, flexShrink: 0 }}>
                              {conv.unread_count > 9 ? '9+' : conv.unread_count}
                            </Box>
                          )}
                        </Box>
                      ))}
                    </Box>
                  </>
                )}

                {/* ── Chat window ── */}
                {active && (
                  <>
                    {/* Header */}
                    <Box sx={headerSx}>
                      <IconButton size="small" onClick={() => { setActive(null); setEmojiOpen(false); removeImage() }}
                        sx={{ color: 'rgba(255,255,255,0.65)', mr: 0.5, '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>
                        <ArrowBackIcon sx={{ fontSize: 17 }} />
                      </IconButton>
                      <Avatar src={active.other_avatar || undefined}
                        sx={{ width: 33, height: 33, bgcolor: GOLD, color: NAVY, fontWeight: 800, fontSize: '0.78rem', mr: 1.2, flexShrink: 0 }}>
                        {!active.other_avatar && (active.other_name?.[0] ?? 'S')}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ color: 'white', fontWeight: 800, fontSize: '0.85rem', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {active.other_name ?? 'Support Team'}
                        </Typography>
                        <Typography sx={{ color: GOLD, fontSize: '0.6rem', fontWeight: 700, fontFamily: 'monospace', lineHeight: 1.3 }}>
                          {active.transaction_code}
                        </Typography>
                        <Typography sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.58rem', lineHeight: 1.2 }}>
                          {SERVICE_SHORT[active.service_type] || active.service_type || 'Transaction'}
                        </Typography>
                      </Box>
                      <IconButton size="small" onClick={handleClose}
                        sx={{ color: 'rgba(255,255,255,0.65)', '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>
                        <CloseIcon sx={{ fontSize: 17 }} />
                      </IconButton>
                    </Box>

                    {/* Messages */}
                    <Box sx={{
                      height: msgAreaHeight, overflowY: 'auto',
                      px: 2, py: 1.5,
                      display: 'flex', flexDirection: 'column', gap: 0.8,
                      bgcolor: '#FAFBFC',
                      transition: 'height 0.2s ease',
                      '&::-webkit-scrollbar': { width: 3 },
                      '&::-webkit-scrollbar-thumb': { bgcolor: '#E2E8F0', borderRadius: 4 },
                    }}>
                      {messages.length === 0 ? (
                        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                          <ChatIcon sx={{ fontSize: 32, color: '#E2E8F0' }} />
                          <Typography variant="caption" sx={{ color: '#94A3B8' }}>No messages yet — say hello!</Typography>
                        </Box>
                      ) : messages.map((msg) => {
                        const isMe = msg.sender_id === user?.id
                        return (
                          <Box key={msg.id} sx={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', gap: 0.7, alignItems: 'flex-end' }}>
                            <Avatar src={msg.sender_avatar || undefined}
                              sx={{ width: 24, height: 24, bgcolor: isMe ? GOLD : NAVY, color: isMe ? NAVY : GOLD, fontWeight: 800, fontSize: '0.58rem', flexShrink: 0 }}>
                              {!msg.sender_avatar && msg.sender_name?.[0]}
                            </Avatar>
                            <Box sx={{ maxWidth: '75%' }}>
                              {/* Image attachment */}
                              {msg.attachment_url && (
                                <Box
                                  component="img"
                                  src={msg.attachment_url}
                                  alt="photo"
                                  onClick={() => setLightbox(msg.attachment_url)}
                                  sx={{
                                    display: 'block',
                                    maxWidth: '100%', maxHeight: 180,
                                    borderRadius: isMe ? '12px 12px 3px 12px' : '12px 12px 12px 3px',
                                    objectFit: 'cover',
                                    cursor: 'zoom-in',
                                    border: '1px solid #EEF2F7',
                                    mb: msg.body ? 0.5 : 0,
                                  }}
                                />
                              )}
                              {/* Text body */}
                              {msg.body && (
                                <Box sx={{
                                  px: 1.4, py: 0.9,
                                  borderRadius: isMe ? '14px 14px 3px 14px' : '14px 14px 14px 3px',
                                  bgcolor: isMe ? NAVY : 'white',
                                  boxShadow: isMe ? `0 2px 8px ${NAVY}22` : '0 1px 4px rgba(10,22,40,0.06)',
                                  border: isMe ? 'none' : '1px solid #EEF2F7',
                                  wordBreak: 'break-word', whiteSpace: 'pre-wrap',
                                }}>
                                  <Typography variant="body2" sx={{ color: isMe ? 'white' : '#1E293B', fontSize: '0.82rem', lineHeight: 1.5 }}>
                                    {msg.body}
                                  </Typography>
                                </Box>
                              )}
                              <Typography sx={{ fontSize: '0.58rem', color: '#CBD5E1', display: 'block', mt: 0.25, textAlign: isMe ? 'right' : 'left' }}>
                                {formatTime(msg.created_at)}
                              </Typography>
                            </Box>
                          </Box>
                        )
                      })}
                      <div ref={chatBottomRef} />
                    </Box>

                    {/* Emoji picker */}
                    {emojiOpen && (
                      <Box sx={{
                        height: 128, overflowY: 'auto', px: 1.5, py: 1,
                        borderTop: '1px solid #EEF2F7',
                        bgcolor: 'white',
                        display: 'flex', flexWrap: 'wrap', gap: 0.2,
                        alignContent: 'flex-start',
                        '&::-webkit-scrollbar': { width: 3 },
                        '&::-webkit-scrollbar-thumb': { bgcolor: '#E2E8F0', borderRadius: 4 },
                      }}>
                        {EMOJIS.map((emoji, i) => (
                          <Box
                            key={i}
                            onClick={() => insertEmoji(emoji)}
                            sx={{
                              fontSize: '1.35rem', cursor: 'pointer', px: 0.4, py: 0.2,
                              borderRadius: '6px', lineHeight: 1.3,
                              '&:hover': { bgcolor: '#F0F4F8', transform: 'scale(1.2)' },
                              transition: 'all 0.1s',
                              userSelect: 'none',
                            }}
                          >
                            {emoji}
                          </Box>
                        ))}
                      </Box>
                    )}

                    {/* Image preview */}
                    {imagePreview && (
                      <Box sx={{ px: 1.5, py: 1, borderTop: '1px solid #EEF2F7', bgcolor: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ position: 'relative', flexShrink: 0 }}>
                          <Box
                            component="img"
                            src={imagePreview}
                            alt="preview"
                            sx={{ width: 52, height: 52, borderRadius: '8px', objectFit: 'cover', border: '1px solid #EEF2F7' }}
                          />
                          <IconButton
                            size="small"
                            onClick={removeImage}
                            sx={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, bgcolor: '#EF4444', color: 'white', '&:hover': { bgcolor: '#DC2626' } }}
                          >
                            <CancelIcon sx={{ fontSize: 12 }} />
                          </IconButton>
                        </Box>
                        <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.72rem' }}>
                          {imageFile?.name}
                        </Typography>
                      </Box>
                    )}

                    {/* Input row */}
                    <Box sx={{ px: 1.2, py: 1, borderTop: '1px solid #EEF2F7', display: 'flex', gap: 0.5, alignItems: 'flex-end', bgcolor: 'white' }}>
                      {/* Emoji button */}
                      <Tooltip title="Emoji" placement="top">
                        <IconButton
                          size="small"
                          onClick={() => setEmojiOpen(o => !o)}
                          sx={{ color: emojiOpen ? GOLD : '#94A3B8', '&:hover': { color: GOLD, bgcolor: `${GOLD}10` }, flexShrink: 0 }}
                        >
                          <EmojiEmotionsIcon sx={{ fontSize: 20 }} />
                        </IconButton>
                      </Tooltip>

                      {/* Image button */}
                      <Tooltip title="Send photo" placement="top">
                        <IconButton
                          size="small"
                          onClick={() => fileRef.current?.click()}
                          sx={{ color: imageFile ? '#3B82F6' : '#94A3B8', '&:hover': { color: '#3B82F6', bgcolor: '#EFF6FF' }, flexShrink: 0 }}
                        >
                          <AddPhotoAlternateIcon sx={{ fontSize: 20 }} />
                        </IconButton>
                      </Tooltip>

                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        style={{ display: 'none' }}
                        onChange={handleImageSelect}
                      />

                      <TextField
                        fullWidth multiline maxRows={3} size="small"
                        placeholder="Aa"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '18px', fontSize: '0.85rem', bgcolor: '#F4F6FA',
                            '& fieldset': { borderColor: 'transparent' },
                            '&:hover fieldset': { borderColor: '#E2E8F0' },
                            '&.Mui-focused fieldset': { borderColor: `${GOLD}70` },
                          },
                        }}
                      />

                      <IconButton
                        onClick={sendMessage}
                        disabled={(!input.trim() && !imageFile) || sending}
                        sx={{
                          width: 35, height: 35, bgcolor: NAVY, color: 'white', flexShrink: 0,
                          '&:hover': { bgcolor: '#1E3A6E' },
                          '&:disabled': { bgcolor: '#E2E8F0', color: '#94A3B8' },
                        }}
                      >
                        {sending
                          ? <CircularProgress size={13} color="inherit" />
                          : <SendIcon sx={{ fontSize: 15 }} />
                        }
                      </IconButton>
                    </Box>
                  </>
                )}

              </Box>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating chat button */}
        <Tooltip title={open ? '' : 'Messages'} placement="left">
          <Badge
            badgeContent={totalUnread}
            color="error"
            max={99}
            sx={{ '& .MuiBadge-badge': { fontWeight: 800, fontSize: '0.62rem', minWidth: 18, height: 18 } }}
          >
            <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}>
              <IconButton
                onClick={handleToggle}
                sx={{
                  width: 54, height: 54,
                  background: open
                    ? `linear-gradient(135deg, #1A3A6E 0%, ${NAVY} 100%)`
                    : `linear-gradient(135deg, ${NAVY} 0%, #1A3A6E 100%)`,
                  color: 'white',
                  boxShadow: '0 6px 24px rgba(10,22,40,0.32)',
                  border: `2px solid ${GOLD}40`,
                  '&:hover': { boxShadow: `0 8px 28px rgba(10,22,40,0.4)` },
                }}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={open ? 'close' : 'chat'}
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    style={{ display: 'flex' }}
                  >
                    {open ? <CloseIcon sx={{ fontSize: 22 }} /> : <ChatIcon sx={{ fontSize: 24 }} />}
                  </motion.div>
                </AnimatePresence>
              </IconButton>
            </motion.div>
          </Badge>
        </Tooltip>

      </Box>
    </>
  )
}
