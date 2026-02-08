import { Card, CardBody, CardHeader } from "../ui/Card";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import type { JournalEntry } from "../../types/journal";

function moodVariant(mood?: string) {
  if (!mood) return "neutral";
  const text = mood.toLowerCase();
  if (["good", "great", "confident", "focused", "calm", "happy"].some((key) => text.includes(key))) {
    return "positive";
  }
  if (["bad", "stressed", "anxious", "angry", "sad", "nervous", "fear"].some((key) => text.includes(key))) {
    return "negative";
  }
  return "neutral";
}

function moodBorder(mood?: string) {
  const variant = moodVariant(mood);
  if (variant === "positive") return "border-l-emerald-400/70";
  if (variant === "negative") return "border-l-rose-400/70";
  return "border-l-slate-600/50";
}

export function JournalList({ entries, onEdit }: { entries: JournalEntry[]; onEdit: (entry: JournalEntry) => void }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <p className="section-title">Journal Entries</p>
          <p className="text-xs text-slate-400">Track trade decisions and reviews</p>
        </div>
      </CardHeader>
      <CardBody>
        <div className="space-y-4">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className={`rounded-xl border border-slate-800/70 border-l-4 p-4 ${moodBorder(entry.mood)}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700/60 bg-slate-900/60 text-slate-300">
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M9 3h6l3 3v13a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
                        <path d="M9 7h6" />
                        <path d="M9 11h6" />
                        <path d="M9 15h4" />
                      </svg>
                    </span>
                    <div>
                      <p className="text-lg font-semibold text-slate-100">{entry.title}</p>
                      <p className="text-xs text-slate-400">{new Date(entry.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M10 13a5 5 0 0 1 0-7l1.5-1.5a5 5 0 0 1 7 7L17 13" />
                      <path d="M14 11a5 5 0 0 1 0 7L12.5 19.5a5 5 0 0 1-7-7L7 11" />
                    </svg>
                    <span>{entry.tradeRef ? "Linked to a trade" : "Unlinked entry"}</span>
                  </div>
                </div>
                <Button variant="secondary" onClick={() => onEdit(entry)}>
                  Edit
                </Button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {entry.strategyTag && <Badge variant="info">{entry.strategyTag}</Badge>}
                {entry.mood && <Badge variant={moodVariant(entry.mood)}>{entry.mood}</Badge>}
                {entry.customTags.map((tag) => (
                  <Badge key={tag} variant="neutral">
                    {tag}
                  </Badge>
                ))}
              </div>
              <div
                className="mt-3 space-y-3 rounded-lg border border-slate-800/60 p-3 text-sm text-slate-300"
                style={{ background: "var(--surface-muted)" }}
              >
                <div>
                  <div className="flex items-center gap-2 text-slate-200">
                    <svg viewBox="0 0 24 24" className="h-4 w-4 text-rose-300" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 7v6" />
                      <path d="M12 16h.01" />
                    </svg>
                    <p className="font-semibold">Mistakes</p>
                  </div>
                  <p>{entry.mistakes || "-"}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-slate-200">
                    <svg viewBox="0 0 24 24" className="h-4 w-4 text-emerald-300" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M9 18h6" />
                      <path d="M10 22h4" />
                      <path d="M12 2a7 7 0 0 0-4 12c.7.7 1 1.5 1 2.5V17h6v-.5c0-1 .3-1.8 1-2.5a7 7 0 0 0-4-12Z" />
                    </svg>
                    <p className="font-semibold">Lessons</p>
                  </div>
                  <p>{entry.lessons || "-"}</p>
                </div>
              </div>
            </div>
          ))}
          {entries.length === 0 && <p className="text-sm text-slate-500">No entries yet.</p>}
        </div>
      </CardBody>
    </Card>
  );
}
