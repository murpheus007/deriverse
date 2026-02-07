import { Card, CardBody, CardHeader } from "../ui/Card";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import type { JournalEntry } from "../../types/journal";

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
            <div key={entry.id} className="rounded-xl border border-slate-800/70 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold">{entry.title}</p>
                  <p className="text-xs text-slate-400">{new Date(entry.createdAt).toLocaleString()}</p>
                </div>
                <Button variant="secondary" onClick={() => onEdit(entry)}>
                  Edit
                </Button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {entry.strategyTag && <Badge>{entry.strategyTag}</Badge>}
                {entry.mood && <Badge>{entry.mood}</Badge>}
                {entry.customTags.map((tag) => (
                  <Badge key={tag}>{tag}</Badge>
                ))}
              </div>
              <div className="mt-3 text-sm text-slate-300">
                <p className="font-semibold text-slate-200">Mistakes</p>
                <p>{entry.mistakes || "-"}</p>
                <p className="mt-2 font-semibold text-slate-200">Lessons</p>
                <p>{entry.lessons || "-"}</p>
              </div>
            </div>
          ))}
          {entries.length === 0 && <p className="text-sm text-slate-500">No entries yet.</p>}
        </div>
      </CardBody>
    </Card>
  );
}
