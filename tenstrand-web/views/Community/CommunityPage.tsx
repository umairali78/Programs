'use client'
import { useEffect, useRef, useState } from 'react'
import { Camera, Heart, MessageCircle, MoreHorizontal, Send, Share2, UserCheck, UserPlus, Users, X, Image as ImageIcon, Leaf, Quote } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { useAuthStore } from '@/store/auth.store'
import { toast } from 'sonner'

interface Post {
  id: string
  authorName: string
  authorInitials: string
  authorColor: string
  authorSchool: string
  timeAgo: string
  content: string
  imageUrl?: string
  likes: number
  comments: PostComment[]
  liked: boolean
  tags: string[]
  programName?: string
}

interface PostComment {
  id: string
  authorName: string
  authorInitials: string
  authorColor: string
  text: string
  timeAgo: string
}

interface TeacherFriend {
  id: string
  name: string
  initials: string
  color: string
  school: string
  county: string
  grades: string
  subjects: string
  connected: boolean
}

const AVATAR_COLORS = ['#1B6B3A', '#2563EB', '#7C3AED', '#C2410C', '#0F766E', '#B91C1C', '#0369A1', '#065F46']

const INITIAL_FRIENDS: TeacherFriend[] = [
  { id: 'f1', name: 'Sarah Chen', initials: 'SC', color: '#2563EB', school: 'Lincoln Elementary', county: 'Alameda', grades: '3-5', subjects: 'Science, Climate', connected: true },
  { id: 'f2', name: 'Marcus Johnson', initials: 'MJ', color: '#7C3AED', school: 'Bay View Middle', county: 'Contra Costa', grades: '6-8', subjects: 'Environmental Science', connected: true },
  { id: 'f3', name: 'Priya Nair', initials: 'PN', color: '#0F766E', school: 'Sunset High School', county: 'San Mateo', grades: '9-12', subjects: 'Biology, Ecology', connected: false },
  { id: 'f4', name: 'James Okafor', initials: 'JO', color: '#C2410C', school: 'Riverside Charter', county: 'Santa Clara', grades: 'K-2', subjects: 'Science, Agriculture', connected: false },
  { id: 'f5', name: 'Elena Rodriguez', initials: 'ER', color: '#065F46', school: 'Oakland STEM', county: 'Alameda', grades: '4-8', subjects: 'Earth Science, Wetlands', connected: true },
]

const INITIAL_POSTS: Post[] = [
  {
    id: 'p1',
    authorName: 'Umair Ali',
    authorInitials: 'UA',
    authorColor: '#1B6B3A',
    authorSchool: 'Hillsdale Academy, Alameda County',
    timeAgo: '2 hours ago',
    content: 'Just came back from an incredible riparian habitat walk with my 5th graders along San Lorenzo Creek! The students were completely blown away by the diversity of bird species — we spotted a great blue heron right next to an egret. This was part of the CBP Wetland Wonders program and I cannot recommend it enough. The hands-on journaling and scientific sketching approach really connected with students who usually struggle with attention. One student told me it was "the best day of school ever." That\'s what outdoor learning is all about! 🌿',
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80',
    likes: 24,
    liked: false,
    tags: ['Wetlands', 'Field Trip', 'CBP'],
    programName: 'Wetland Wonders — Bay Area Wetlands Institute',
    comments: [
      { id: 'c1', authorName: 'Sarah Chen', authorInitials: 'SC', authorColor: '#2563EB', text: 'This is amazing! My students would love this. Can you share the program contact info?', timeAgo: '1h ago' },
      { id: 'c2', authorName: 'Marcus Johnson', authorInitials: 'MJ', authorColor: '#7C3AED', text: 'We did a similar walk last spring — the heron sighting is always the highlight! Great documentation 📸', timeAgo: '45m ago' },
    ],
  },
  {
    id: 'p2',
    authorName: 'Sarah Chen',
    authorInitials: 'SC',
    authorColor: '#2563EB',
    authorSchool: 'Lincoln Elementary, Alameda County',
    timeAgo: '1 day ago',
    content: 'Finished our school garden "soil detectives" unit today — 3 weeks of worm composting, pH testing, and now the kids are growing native wildflowers 🌸 The Urban Roots program provided everything: tools, seeds, curriculum guides, AND came on-site twice to help! Best part? My most disengaged student became the class compost expert. Sharing the before/after photos from week 1 vs. week 3!',
    imageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80',
    likes: 38,
    liked: true,
    tags: ['Gardening', 'Soil Science', 'Native Plants'],
    programName: 'Soil Detectives — Urban Roots California',
    comments: [
      { id: 'c3', authorName: 'Umair Ali', authorInitials: 'UA', authorColor: '#1B6B3A', text: 'The transformation is incredible! Love the worm composting angle 🪱', timeAgo: '20h ago' },
      { id: 'c4', authorName: 'Elena Rodriguez', authorInitials: 'ER', authorColor: '#065F46', text: 'Urban Roots is fantastic. Did they leave you the composters to keep?', timeAgo: '18h ago' },
    ],
  },
  {
    id: 'p3',
    authorName: 'Elena Rodriguez',
    authorInitials: 'ER',
    authorColor: '#065F46',
    authorSchool: 'Oakland STEM Academy, Alameda County',
    timeAgo: '3 days ago',
    content: 'Quick reflection: we took our 7th graders to the estuary for macroinvertebrate sampling yesterday. Watching them use the same protocols as real scientists — it completely shifted how they see themselves. One student said "I\'m basically a biologist right now." Another recorded 12 different species in her field journal. If you\'re in the Bay Area and haven\'t tried the SF Bay Living Observatory curriculum, it\'s absolutely worth it. Free, flexible scheduling, and the scientists who guide you are incredibly patient with middle schoolers.',
    likes: 19,
    liked: false,
    tags: ['Marine Science', 'Field Research', 'Bay Area'],
    programName: 'Estuary Explorers — SF Bay Living Observatory',
    comments: [],
  },
]

function AvatarCircle({ initials, color, size = 'md' }: { initials: string; color: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'sm' ? 'w-7 h-7 text-xs' : size === 'lg' ? 'w-12 h-12 text-base' : 'w-9 h-9 text-sm'
  return (
    <div className={`${sizeClass} rounded-full flex items-center justify-center font-bold text-white shrink-0`} style={{ backgroundColor: color }}>
      {initials}
    </div>
  )
}

function PostCard({ post, onLike, onComment }: {
  post: Post
  onLike: (id: string) => void
  onComment: (id: string, text: string) => void
}) {
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [showAllComments, setShowAllComments] = useState(false)
  const { teacherName } = useAuthStore()

  const handleComment = () => {
    if (!commentText.trim()) return
    onComment(post.id, commentText.trim())
    setCommentText('')
    setShowComments(true)
  }

  const visibleComments = showAllComments ? post.comments : post.comments.slice(0, 2)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Post header */}
      <div className="flex items-center justify-between p-4 pb-3">
        <div className="flex items-center gap-3">
          <AvatarCircle initials={post.authorInitials} color={post.authorColor} />
          <div>
            <p className="text-sm font-bold text-gray-900">{post.authorName}</p>
            <p className="text-xs text-gray-400">{post.authorSchool} · {post.timeAgo}</p>
          </div>
        </div>
        <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><MoreHorizontal className="w-4 h-4" /></button>
      </div>

      {/* Post content */}
      <div className="px-4 pb-3">
        {post.programName && (
          <div className="flex items-center gap-1.5 mb-2">
            <Leaf className="w-3 h-3 text-green-600" />
            <span className="text-xs font-semibold text-green-700">{post.programName}</span>
          </div>
        )}
        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">{post.content}</p>
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {post.tags.map((tag) => (
              <span key={tag} className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-green-50 text-green-700">#{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* Post image */}
      {post.imageUrl && (
        <div className="mx-4 mb-3 rounded-xl overflow-hidden">
          <img src={post.imageUrl} alt="Post" className="w-full h-56 object-cover" />
        </div>
      )}

      {/* Action bar */}
      <div className="flex items-center gap-1 px-4 py-2 border-t border-gray-50">
        <button
          onClick={() => onLike(post.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            post.liked ? 'text-red-500 bg-red-50' : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${post.liked ? 'fill-current' : ''}`} />
          {post.likes}
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          {post.comments.length}
        </button>
        <button
          onClick={() => { navigator.clipboard?.writeText(window.location.href); toast.success('Link copied!') }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-50 transition-colors"
        >
          <Share2 className="w-3.5 h-3.5" />
          Share
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="px-4 pb-4 space-y-3">
          {visibleComments.map((c) => (
            <div key={c.id} className="flex items-start gap-2.5">
              <AvatarCircle initials={c.authorInitials} color={c.authorColor} size="sm" />
              <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2">
                <p className="text-xs font-bold text-gray-900">{c.authorName}</p>
                <p className="text-xs text-gray-700 mt-0.5">{c.text}</p>
              </div>
            </div>
          ))}
          {post.comments.length > 2 && !showAllComments && (
            <button onClick={() => setShowAllComments(true)} className="text-xs text-brand font-medium hover:underline ml-9">
              View {post.comments.length - 2} more comments
            </button>
          )}

          {/* Add comment */}
          <div className="flex items-center gap-2 mt-2">
            <AvatarCircle
              initials={teacherName ? teacherName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'ME'}
              color="#1B6B3A"
              size="sm"
            />
            <div className="flex-1 flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleComment() } }}
                placeholder="Add a comment…"
                className="flex-1 text-xs bg-transparent focus:outline-none text-gray-800 placeholder-gray-400"
              />
              <button onClick={handleComment} disabled={!commentText.trim()} className="text-brand disabled:opacity-40">
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function NewPostModal({ onClose, onPublish }: { onClose: () => void; onPublish: (content: string, tags: string[], image?: string) => void }) {
  const [content, setContent] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [imageUrl, setImageUrl] = useState('')
  const [showImageInput, setShowImageInput] = useState(false)
  const { teacherName } = useAuthStore()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { textareaRef.current?.focus() }, [])

  const addTag = () => {
    const tag = tagInput.trim().replace(/^#/, '')
    if (tag && !tags.includes(tag)) setTags((prev) => [...prev, tag])
    setTagInput('')
  }

  const handlePublish = () => {
    if (!content.trim()) { toast.error('Write something before sharing!'); return }
    onPublish(content.trim(), tags, imageUrl.trim() || undefined)
    onClose()
  }

  const initials = teacherName ? teacherName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'ME'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Share your outdoor lesson</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-start gap-3">
            <AvatarCircle initials={initials} color="#1B6B3A" />
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`What did your students experience today, ${teacherName?.split(' ')[0] ?? 'Teacher'}? Share your outdoor lesson story, observations, and moments that sparked curiosity…`}
              rows={6}
              className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
            />
          </div>

          {/* Tags */}
          <div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag() } }}
                placeholder="Add a tag (e.g. Wetlands, Field Trip)…"
                className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
              />
              <button onClick={addTag} className="px-3 py-2 text-xs font-medium text-brand border border-brand rounded-xl hover:bg-brand-light">Add</button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map((t) => (
                  <span key={t} className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-green-50 text-green-700">
                    #{t}
                    <button onClick={() => setTags(tags.filter((x) => x !== t))} className="text-green-400 hover:text-red-500"><X className="w-2.5 h-2.5" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Image URL input */}
          {showImageInput && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Image URL (optional)</label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://…"
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500"
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-5 pb-5">
          <button
            onClick={() => setShowImageInput(!showImageInput)}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 px-2 py-1.5 rounded-lg hover:bg-gray-50"
          >
            <ImageIcon className="w-4 h-4" />Photo URL
          </button>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-xl hover:bg-gray-100">Cancel</button>
            <button onClick={handlePublish} disabled={!content.trim()}
              className="flex items-center gap-1.5 px-4 py-2 bg-brand text-white text-sm font-semibold rounded-xl hover:bg-brand-dark transition-colors disabled:opacity-50">
              <Send className="w-3.5 h-3.5" />Post
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function CommunityPage() {
  const { teacherName } = useAuthStore()
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS)
  const [friends, setFriends] = useState<TeacherFriend[]>(INITIAL_FRIENDS)
  const [showNewPost, setShowNewPost] = useState(false)
  const [activeTab, setActiveTab] = useState<'feed' | 'network'>('feed')

  const handleLike = (postId: string) => {
    setPosts((prev) => prev.map((p) =>
      p.id === postId ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p
    ))
  }

  const handleComment = (postId: string, text: string) => {
    const initials = teacherName ? teacherName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'ME'
    setPosts((prev) => prev.map((p) =>
      p.id === postId
        ? { ...p, comments: [...p.comments, { id: `c${Date.now()}`, authorName: teacherName ?? 'You', authorInitials: initials, authorColor: '#1B6B3A', text, timeAgo: 'just now' }] }
        : p
    ))
  }

  const handlePublish = (content: string, tags: string[], imageUrl?: string) => {
    const initials = teacherName ? teacherName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'ME'
    const newPost: Post = {
      id: `p${Date.now()}`,
      authorName: teacherName ?? 'You',
      authorInitials: initials,
      authorColor: '#1B6B3A',
      authorSchool: 'Your School',
      timeAgo: 'just now',
      content,
      imageUrl,
      likes: 0,
      liked: false,
      tags,
      comments: [],
    }
    setPosts((prev) => [newPost, ...prev])
    toast.success('Post shared with the community!')
  }

  const toggleConnect = (friendId: string) => {
    setFriends((prev) => prev.map((f) => {
      if (f.id !== friendId) return f
      const wasConnected = f.connected
      toast.success(wasConnected ? `Unfollowed ${f.name}` : `Now following ${f.name}!`)
      return { ...f, connected: !f.connected }
    }))
  }

  const connectedCount = friends.filter((f) => f.connected).length
  const initials = teacherName ? teacherName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'ME'

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopBar title="Community" />
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">Teacher Community</h2>
              <p className="text-xs text-gray-500 mt-0.5">Share outdoor lessons, experiences, and connect with fellow educators</p>
            </div>
            <button
              onClick={() => setShowNewPost(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-brand text-white text-sm font-semibold rounded-xl hover:bg-brand-dark transition-colors"
            >
              <Camera className="w-4 h-4" />Share Experience
            </button>
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
            {([['feed', 'Community Feed'], ['network', 'My Network']] as [string, string][]).map(([tab, label]) => (
              <button key={tab} onClick={() => setActiveTab(tab as 'feed' | 'network')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
                  activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}>{label}</button>
            ))}
          </div>

          {activeTab === 'feed' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
              {/* Main feed */}
              <div className="xl:col-span-2 space-y-4">
                {/* Compose prompt */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-center gap-3">
                    <AvatarCircle initials={initials} color="#1B6B3A" />
                    <button
                      onClick={() => setShowNewPost(true)}
                      className="flex-1 text-left text-sm text-gray-400 bg-gray-50 rounded-xl px-4 py-2.5 hover:bg-gray-100 transition-colors border border-gray-100"
                    >
                      What outdoor lesson did you lead today, {teacherName?.split(' ')[0] ?? 'Teacher'}?
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50">
                    <button onClick={() => setShowNewPost(true)} className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-50 transition-colors">
                      <Camera className="w-3.5 h-3.5 text-green-600" />Photo
                    </button>
                    <button onClick={() => setShowNewPost(true)} className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
                      <Quote className="w-3.5 h-3.5 text-blue-600" />Experience
                    </button>
                    <button onClick={() => setShowNewPost(true)} className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-purple-700 px-3 py-1.5 rounded-lg hover:bg-purple-50 transition-colors">
                      <Leaf className="w-3.5 h-3.5 text-purple-600" />Program Review
                    </button>
                  </div>
                </div>

                {posts.map((post) => (
                  <PostCard key={post.id} post={post} onLike={handleLike} onComment={handleComment} />
                ))}
              </div>

              {/* Sidebar: connections */}
              <div className="space-y-4">
                {/* My profile quick stat */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <AvatarCircle initials={initials} color="#1B6B3A" size="lg" />
                    <div>
                      <p className="text-sm font-bold text-gray-900">{teacherName ?? 'Teacher'}</p>
                      <p className="text-xs text-gray-400">Hillsdale Academy</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {[['Posts', posts.filter(p => p.authorName === teacherName).length + (teacherName === 'Umair Ali' ? 1 : 0)], ['Connections', connectedCount], ['Likes', posts.reduce((s, p) => s + (p.liked ? 1 : 0), 0)]].map(([label, val]) => (
                      <div key={String(label)} className="bg-gray-50 rounded-xl py-2">
                        <p className="text-sm font-bold text-gray-900">{val}</p>
                        <p className="text-[10px] text-gray-400">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* People to follow */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <p className="text-xs font-bold text-gray-900 flex items-center gap-1.5 mb-3"><Users className="w-3.5 h-3.5 text-gray-400" />Teachers to Connect With</p>
                  <div className="space-y-3">
                    {friends.filter(f => !f.connected).slice(0, 3).map((f) => (
                      <div key={f.id} className="flex items-center gap-2.5">
                        <AvatarCircle initials={f.initials} color={f.color} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-900 truncate">{f.name}</p>
                          <p className="text-[10px] text-gray-400 truncate">{f.school}</p>
                        </div>
                        <button onClick={() => toggleConnect(f.id)}
                          className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-brand border border-brand rounded-lg hover:bg-brand hover:text-white transition-colors shrink-0">
                          <UserPlus className="w-2.5 h-2.5" />Follow
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'network' && (
            <div>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {friends.map((f) => (
                  <div key={f.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
                    <AvatarCircle initials={f.initials} color={f.color} size="lg" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900">{f.name}</p>
                      <p className="text-xs text-gray-400">{f.school}</p>
                      <p className="text-xs text-gray-400">{f.county} County</p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        <span className="px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-blue-50 text-blue-700">Gr. {f.grades}</span>
                        {f.subjects.split(', ').slice(0, 2).map((s) => (
                          <span key={s} className="px-1.5 py-0.5 text-[10px] font-medium rounded-full bg-green-50 text-green-700">{s}</span>
                        ))}
                      </div>
                    </div>
                    <button onClick={() => toggleConnect(f.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors shrink-0 ${
                        f.connected
                          ? 'bg-brand-light text-brand border border-brand/30 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                          : 'bg-brand text-white hover:bg-brand-dark'
                      }`}
                    >
                      {f.connected ? <><UserCheck className="w-3.5 h-3.5" />Following</> : <><UserPlus className="w-3.5 h-3.5" />Follow</>}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showNewPost && <NewPostModal onClose={() => setShowNewPost(false)} onPublish={handlePublish} />}
    </div>
  )
}
