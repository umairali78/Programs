import { useState, useRef, useEffect } from 'react'
import { X, Send, Loader2, MessageSquare } from 'lucide-react'
import { invoke } from '@/lib/api'
import { useUiStore } from '@/store/ui.store'
import { useAppStore } from '@/store/app.store'
import { cn } from '@/lib/utils'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTIONS = [
  'What programs fit my grade level nearby?',
  'Show free programs happening this spring',
  'Which partners have the best reviews?',
  'Generate a pre-visit lesson plan outline'
]

export function CopilotPanel() {
  const { setCopilotOpen } = useUiStore()
  const activeTeacher = useAppStore((s) => s.activeTeacher)

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async (text?: string) => {
    const userMessage = text ?? input.trim()
    if (!userMessage || loading) return

    setInput('')
    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }]
    setMessages(newMessages)
    setLoading(true)

    try {
      const reply = await invoke<string>('ai:copilotTurn', {
        teacherId: activeTeacher?.id ?? '',
        history: messages,
        message: userMessage
      })
      setMessages([...newMessages, { role: 'assistant', content: reply }])
    } catch (err: any) {
      setMessages([
        ...newMessages,
        { role: 'assistant', content: `Error: ${err.message}` }
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="absolute right-0 top-0 bottom-0 w-96 bg-white border-l border-app-border shadow-2xl flex flex-col z-20 slide-in-right">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-app-border bg-purple-50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">AI Copilot</p>
            <p className="text-[10px] text-purple-600">
              {activeTeacher ? `Helping ${activeTeacher.name.split(' ')[0]}` : 'No active teacher set'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setCopilotOpen(false)}
          className="p-1.5 rounded-lg hover:bg-purple-100 text-gray-400 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-xs text-gray-400 text-center">
              Ask about programs, field trips, or curriculum connections
            </p>
            <div className="space-y-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="w-full text-left px-3 py-2.5 text-xs text-gray-600 bg-gray-50 hover:bg-brand-light rounded-lg transition-colors border border-app-border hover:border-brand"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              'flex',
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            <div
              className={cn(
                'max-w-[85%] rounded-2xl px-3 py-2.5 text-xs leading-relaxed',
                msg.role === 'user'
                  ? 'bg-brand text-white rounded-br-sm'
                  : 'bg-gray-100 text-gray-800 rounded-bl-sm'
              )}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-3 py-2.5">
              <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-app-border">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
            placeholder="Ask about programs near you..."
            className="flex-1 text-xs border border-app-border rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-purple-400 bg-white"
            disabled={loading}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="w-8 h-8 flex items-center justify-center bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-40 transition-colors shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="mt-2 text-[10px] text-gray-400 hover:text-gray-600 w-full text-center"
          >
            Clear conversation
          </button>
        )}
      </div>
    </div>
  )
}
