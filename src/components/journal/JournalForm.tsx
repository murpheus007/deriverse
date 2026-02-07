import { useMemo, useState } from "react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import type { JournalEntry, JournalEntryUpsert } from "../../types/journal";
import type { TradeFill } from "../../types/trades";

export function JournalForm({
  fills,
  initial,
  onSave,
  onCancel
}: {
  fills: TradeFill[];
  initial?: JournalEntry | null;
  onSave: (entry: JournalEntryUpsert) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [strategyTag, setStrategyTag] = useState(initial?.strategyTag ?? "");
  const [mood, setMood] = useState(initial?.mood ?? "");
  const [mistakes, setMistakes] = useState(initial?.mistakes ?? "");
  const [lessons, setLessons] = useState(initial?.lessons ?? "");
  const [customTags, setCustomTags] = useState(initial?.customTags.join(", ") ?? "");
  const [tradeRef, setTradeRef] = useState(initial?.tradeRef ?? "");

  const fillOptions = useMemo(() => fills.slice(0, 50), [fills]);

  const handleSubmit = () => {
    const entry: JournalEntryUpsert = {
      id: initial?.id || undefined,
      tradeRef: tradeRef || undefined,
      accountId: initial?.accountId ?? null,
      title,
      strategyTag,
      mood,
      mistakes,
      lessons,
      screenshotUrls: initial?.screenshotUrls ?? [],
      customTags: customTags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
    };
    onSave(entry);
  };

  return (
    <div className="card p-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="label">Title</p>
          <Input value={title} onChange={(event) => setTitle(event.target.value)} />
        </div>
        <div>
          <p className="label">Strategy Tag</p>
          <Input value={strategyTag} onChange={(event) => setStrategyTag(event.target.value)} />
        </div>
        <div>
          <p className="label">Mood</p>
          <Input value={mood} onChange={(event) => setMood(event.target.value)} />
        </div>
        <div>
          <p className="label">Linked Fill</p>
          <Select value={tradeRef} onChange={(event) => setTradeRef(event.target.value)}>
            <option value="">Unlinked</option>
            {fillOptions.map((fill) => (
              <option key={fill.id} value={fill.id}>
                {fill.symbol} - {new Date(fill.ts).toLocaleString()}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className="mt-4">
        <p className="label">Mistakes</p>
        <textarea
          className="input min-h-[100px]"
          value={mistakes}
          onChange={(event) => setMistakes(event.target.value)}
        />
      </div>
      <div className="mt-4">
        <p className="label">Lessons</p>
        <textarea
          className="input min-h-[100px]"
          value={lessons}
          onChange={(event) => setLessons(event.target.value)}
        />
      </div>
      <div className="mt-4">
        <p className="label">Custom Tags (comma separated)</p>
        <Input value={customTags} onChange={(event) => setCustomTags(event.target.value)} />
      </div>
      <div className="mt-5 flex gap-3">
        <Button onClick={handleSubmit}>Save Entry</Button>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
