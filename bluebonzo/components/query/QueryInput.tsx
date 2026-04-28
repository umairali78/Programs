'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Mic, MicOff, Loader2, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BrowserSpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
}

interface BrowserSpeechRecognition extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition

declare global {
  interface Window {
    SpeechRecognition?: BrowserSpeechRecognitionConstructor
    webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor
  }
}

const SUGGESTIONS = [
  'What is the current FOB price for semi-refined carrageenan from Indonesia?',
  'Has the EU changed its arsenic limits for seaweed food products?',
  'Which countries are the top importers of dried Kappaphycus?',
  'What is the global market size for seaweed biostimulants?',
  'Which certified suppliers in Philippines can supply EU food-grade agar?',
  'What funding rounds have seaweed biotech companies received in 2024?',
  'What are the import tariffs for seaweed in the United States?',
  'Compare carrageenan vs agar pricing trends for the last 6 months',
]

interface QueryInputProps {
  onSubmit: (query: string) => void
  loading: boolean
  initialQuery?: string
}

export function QueryInput({ onSubmit, loading, initialQuery }: QueryInputProps) {
  const [query, setQuery] = useState(initialQuery ?? '')
  const [listening, setListening] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null)

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery)
    }
  }, [initialQuery])

  useEffect(() => {
    if (query.length > 2) {
      const filtered = SUGGESTIONS.filter(s =>
        s.toLowerCase().includes(query.toLowerCase()) ||
        query.toLowerCase().split(' ').some(w => w.length > 3 && s.toLowerCase().includes(w))
      ).slice(0, 3)
      setSuggestions(filtered)
      setShowSuggestions(filtered.length > 0 && query !== filtered[0])
    } else {
      setShowSuggestions(false)
    }
  }, [query])

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    const q = query.trim()
    if (!q || loading) return
    setShowSuggestions(false)
    onSubmit(q)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleSubmit()
    if (e.key === 'Escape') setShowSuggestions(false)
  }

  function autoResize() {
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = Math.min(el.scrollHeight, 200) + 'px'
    }
  }

  function toggleVoice() {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!SR) return

    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
      return
    }

    const recognition = new SR()
    recognition.lang = 'en-US'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onresult = (event: BrowserSpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript
      setQuery(prev => prev ? prev + ' ' + transcript : transcript)
      setListening(false)
    }
    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)

    recognition.start()
    recognitionRef.current = recognition
    setListening(true)
  }

  const sourceHints = query.length > 5
    ? getSourceHints(query)
    : ['Live Data APIs', 'Report Bank', 'Web Search']

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="relative">
        <div className={cn(
          'rounded-xl border transition-all',
          'bg-card border-border',
          loading && 'opacity-80',
          !loading && 'focus-within:border-primary/50 focus-within:glow-teal'
        )}>
          <textarea
            ref={textareaRef}
            value={query}
            onChange={e => { setQuery(e.target.value); autoResize() }}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(suggestions.length > 0)}
            disabled={loading}
            rows={3}
            placeholder="Ask any question about seaweed markets, prices, regulations, or trade..."
            className="w-full px-4 pt-4 pb-2 bg-transparent text-sm resize-none focus:outline-none placeholder:text-muted-foreground leading-relaxed scrollbar-thin"
            style={{ minHeight: 80 }}
          />

          {/* Source hints */}
          <div className="px-4 pb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-muted-foreground">Sources:</span>
              {sourceHints.map(hint => (
                <span key={hint} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground border border-border">
                  {hint}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] text-muted-foreground hidden sm:block">⌘↵ to send</span>
              <button
                type="button"
                onClick={toggleVoice}
                className={cn(
                  'p-1.5 rounded-md transition-all',
                  listening ? 'text-destructive bg-destructive/10 animate-pulse' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                )}
                title={listening ? 'Stop recording' : 'Voice input'}
              >
                {listening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              </button>
              <button
                type="submit"
                disabled={!query.trim() || loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                {loading ? 'Querying...' : 'Query'}
              </button>
            </div>
          </div>
        </div>

        {/* Autocomplete suggestions */}
        {showSuggestions && !loading && (
          <div className="absolute top-full mt-1 w-full z-50 rounded-xl border border-border bg-card shadow-xl overflow-hidden">
            {suggestions.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => { setQuery(s); setShowSuggestions(false); textareaRef.current?.focus() }}
                className="w-full px-4 py-2.5 text-left text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-all flex items-start gap-2 border-b border-border last:border-0"
              >
                <Sparkles className="w-3 h-3 mt-0.5 text-primary shrink-0" />
                {s}
              </button>
            ))}
          </div>
        )}
      </form>

      {/* Example queries */}
      {!query && (
        <div className="mt-3">
          <p className="text-xs text-muted-foreground mb-2">Example queries:</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.slice(0, 4).map(s => (
              <button
                key={s}
                onClick={() => { setQuery(s); textareaRef.current?.focus() }}
                className="text-[11px] px-2.5 py-1.5 rounded-md bg-secondary hover:bg-secondary/80 border border-border text-muted-foreground hover:text-foreground transition-all text-left"
              >
                {s.length > 60 ? s.slice(0, 57) + '...' : s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function getSourceHints(query: string): string[] {
  const q = query.toLowerCase()
  const hints: string[] = []
  if (q.match(/price|cost|rate|value/)) hints.push('Tridge', 'Mintec')
  if (q.match(/trade|export|import|volume/)) hints.push('UN Comtrade')
  if (q.match(/regulation|eu|fda|gras|novel food|legal|law/)) hints.push('EUR-Lex', 'openFDA')
  if (q.match(/science|study|research|paper|journal/)) hints.push('PubMed', 'OpenAlex')
  if (q.match(/weather|temperature|ocean|sst|climate/)) hints.push('NOAA ERDDAP')
  if (q.match(/invest|funding|startup|venture/)) hints.push('Crunchbase')
  if (hints.length === 0) hints.push('Live Data APIs', 'Report Bank', 'Web Search')
  return [...new Set(hints)].slice(0, 4)
}
