import type { NoteProfile } from "@/lib/types";

function NoteRow({ label, notes }: { label: string; notes: string[] }) {
  if (notes.length === 0) return null;
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-night-800/50">
        {label}
      </h4>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {notes.map((note) => (
          <span
            key={note}
            className="rounded-full bg-sand-100 px-3 py-1 text-sm capitalize"
          >
            {note}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function NotePyramid({ profile }: { profile: NoteProfile }) {
  return (
    <div className="space-y-4">
      <NoteRow label="Top notes" notes={profile.top_notes} />
      <NoteRow label="Heart notes" notes={profile.middle_notes} />
      <NoteRow label="Base notes" notes={profile.base_notes} />
      {profile.accords.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-night-800/50">
            Main accords
          </h4>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {profile.accords.map((accord) => (
              <span
                key={accord}
                className="rounded-full bg-gold-400/20 px-3 py-1 text-sm capitalize text-gold-600"
              >
                {accord}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
