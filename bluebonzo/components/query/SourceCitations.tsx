import { ExternalLink, Database, Globe, FileText, Layers } from 'lucide-react'
import type { Source } from '@/lib/demo-data/types'

interface SourceCitationsProps {
  sources: Source[]
}

const TYPE_ICONS = {
  api: Database,
  web: Globe,
  document: FileText,
  database: Layers,
}

export function SourceCitations({ sources }: SourceCitationsProps) {
  if (!sources.length) return null

  return (
    <div className="mt-4 pt-4 border-t border-border">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Sources</h4>
      <div className="grid gap-2">
        {sources.map(source => {
          const Icon = TYPE_ICONS[source.type] ?? Database
          return (
            <div key={source.id} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-secondary/50 border border-border text-xs group">
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="w-4 h-4 rounded bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center">
                  {source.id}
                </span>
                <Icon className="w-3 h-3 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-foreground font-medium leading-snug">{source.title}</span>
                  {source.url && source.url !== '#' && (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-muted-foreground">
                  <span className="px-1 py-0.5 rounded bg-secondary border border-border capitalize text-[10px]">
                    {source.provider}
                  </span>
                  <span className="text-[10px]">
                    Retrieved {new Date(source.retrievedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
