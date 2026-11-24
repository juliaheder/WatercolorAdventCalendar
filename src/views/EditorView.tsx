import { type ReactNode, useEffect, useRef, useState } from "react";
import { backend, type CalendarMeta, type DayContent, type EditableCalendar } from "../lib/backend";
import { prepareImage } from "../lib/image";
import { isSpotifyShortLink, parseSpotify, spotifyLink, SpotifyPlayer } from "../lib/spotify";
import { editLink, rememberCalendar, shareLink } from "../lib/route";
import { defaultDays, WinterIllustration } from "../components/winter";
import { DemoBanner, Scene } from "../components/Scene";

type SaveState = "idle" | "saving" | "saved" | "error";

/** The creator's workspace: calendar details, share links, and the 25 windows. */
export function EditorView({ id, token }: { id: string; token: string }) {
  const [calendar, setCalendar] = useState<EditableCalendar | null>(null);
  const [loadError, setLoadError] = useState("");
  const [meta, setMeta] = useState<CalendarMeta | null>(null);
  const [metaState, setMetaState] = useState<SaveState>("idle");
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const lastSavedMeta = useRef("");

  useEffect(() => {
    backend
      .loadForEdit(id, token)
      .then((cal) => {
        setCalendar(cal);
        const loaded = {
          title: cal.title,
          subtitle: cal.subtitle,
          recipient: cal.recipient,
          showAnimals: cal.showAnimals,
          unlockMode: cal.unlockMode,
        };
        lastSavedMeta.current = JSON.stringify(loaded);
        setMeta(loaded);
        rememberCalendar({ id, token, title: cal.title });
      })
      .catch((err: Error) => setLoadError(err.message));
  }, [id, token]);

  // Save the calendar's title and settings a moment after the creator stops typing.
  useEffect(() => {
    if (!meta) return;
    const serialized = JSON.stringify(meta);
    if (serialized === lastSavedMeta.current) return;
    setMetaState("saving");
    const timer = window.setTimeout(async () => {
      try {
        await backend.updateCalendar(id, token, meta);
        lastSavedMeta.current = serialized;
        rememberCalendar({ id, token, title: meta.title || "Merry Christmas" });
        setMetaState("saved");
      } catch {
        setMetaState("error");
      }
    }, 700);
    return () => window.clearTimeout(timer);
  }, [id, token, meta]);

  if (loadError) {
    return (
      <Scene snow={false}>
        <section className="home-view">
          <div className="paper-card center">
            <h2>Can't open this calendar for editing</h2>
            <p>{loadError} Check that you used the full edit link.</p>
            <a className="return-button" href="#/">
              Back to start
            </a>
          </div>
        </section>
      </Scene>
    );
  }

  if (!calendar || !meta) {
    return (
      <Scene snow={false}>
        <section className="home-view">
          <p className="hint">Opening your calendar…</p>
        </section>
      </Scene>
    );
  }

  const daysByNumber = new Map(calendar.days.map((d) => [d.day, d]));
  const filled = calendar.days.length;

  const onDaySaved = (day: DayContent, isEmpty: boolean) => {
    setCalendar((current) => {
      if (!current) return current;
      const days = current.days.filter((d) => d.day !== day.day);
      if (!isEmpty) days.push(day);
      return { ...current, days: days.sort((a, b) => a.day - b.day) };
    });
  };

  return (
    <Scene snow={false}>
      <section className="editor">
        <nav className="editor-nav">
          <a className="back-link" href="#/">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m15 18-6-6 6-6" />
            </svg>
            All calendars
          </a>
          <span className={`save-status is-${metaState}`} aria-live="polite">
            {metaState === "saving" && "Saving…"}
            {metaState === "saved" && "All changes saved"}
            {metaState === "error" && "Couldn't save. Check your connection."}
          </span>
        </nav>

        {backend.kind === "local" && <DemoBanner />}

        <header className="editor-header">
          <p className="kicker">Your advent calendar</p>
          <h1>{meta.title || "Merry Christmas"}</h1>
        </header>

        <div className="editor-columns">
          <div className="paper-card">
            <h2>Details</h2>
            <label className="field">
              <span>Title on the house</span>
              <input
                value={meta.title}
                maxLength={120}
                onChange={(e) => setMeta({ ...meta, title: e.target.value })}
                placeholder="Merry Christmas"
              />
            </label>
            <label className="field">
              <span>Their name (optional)</span>
              <input
                value={meta.recipient}
                maxLength={60}
                onChange={(e) => setMeta({ ...meta, recipient: e.target.value })}
                placeholder="Anna"
              />
            </label>
            <fieldset className="field">
              <span>When can they open the windows?</span>
              <label className="choice">
                <input
                  type="radio"
                  name="unlock"
                  checked={meta.unlockMode === "daily"}
                  onChange={() => setMeta({ ...meta, unlockMode: "daily" })}
                />
                <span>
                  <strong>One a day in December</strong>
                  <small>Window 5 opens on 5 December, at midnight on their clock.</small>
                </span>
              </label>
              <label className="choice">
                <input
                  type="radio"
                  name="unlock"
                  checked={meta.unlockMode === "all"}
                  onChange={() => setMeta({ ...meta, unlockMode: "all" })}
                />
                <span>
                  <strong>All at once</strong>
                  <small>Every window can be opened straight away.</small>
                </span>
              </label>
            </fieldset>
            <div className="field">
              <span>Add animal friends?</span>
              <label className="choice is-compact">
                <input
                  type="checkbox"
                  checked={meta.showAnimals}
                  onChange={(e) => setMeta({ ...meta, showAnimals: e.target.checked })}
                />
                <strong>Yes</strong>
              </label>
              <small>Adds a bunny and a raccoon in Santa hats by the door.</small>
            </div>
          </div>

          <div className="paper-card">
            <h2>Share</h2>
            <LinkField
              label="Link for the receiver"
              help="They can open the windows but can't change anything."
              value={shareLink(id)}
              openLabel="Preview"
            />
            <LinkField
              label="Your private edit link"
              help="Keep this to yourself: anyone with it can change the calendar. Save it to edit from another device."
              value={editLink(id, token)}
              secret
            />
          </div>
        </div>

        <div className="paper-card">
          <div className="windows-heading">
            <h2>The 25 windows</h2>
            <span className="fine-print">
              {filled} of 25 filled · empty windows show a built-in winter message
            </span>
          </div>
          <div className="editor-grid">
            {Array.from({ length: 25 }, (_, index) => {
              const number = index + 1;
              const day = daysByNumber.get(number);
              const thumb = day?.imagePath ? backend.imageUrl(day.imagePath) : "";
              return (
                <button
                  key={number}
                  className={`editor-tile ${day ? "is-filled" : ""}`}
                  onClick={() => setEditingDay(number)}
                  aria-label={`Edit window ${number}${day ? "" : " (empty)"}`}
                >
                  <span className="tile-picture">
                    {thumb ? <img src={thumb} alt="" /> : <span className="tile-plus">+</span>}
                  </span>
                  <span className="tile-label">
                    <strong>{number}</strong>
                    <span>
                      {day
                        ? day.title || day.message || (day.imagePath ? (day.imagePath2 ? "2 pictures" : "Picture") : "Song")
                        : "Empty"}
                    </span>
                    {day?.spotify && (
                      <span className="tile-song" title="Has a song">
                        ♪
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {editingDay && (
        <DayEditor
          key={editingDay}
          calendarId={id}
          token={token}
          dayNumber={editingDay}
          initial={daysByNumber.get(editingDay)}
          onSaved={onDaySaved}
          onNavigate={setEditingDay}
          onClose={() => setEditingDay(null)}
        />
      )}
    </Scene>
  );
}

function LinkField({
  label,
  help,
  value,
  secret = false,
  openLabel,
}: {
  label: string;
  help: string;
  value: string;
  secret?: boolean;
  openLabel?: string;
}) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      window.prompt("Copy this link:", value);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className={`field link-field ${secret ? "is-secret" : ""}`}>
      <span>{label}</span>
      <div className="link-row">
        <input readOnly value={value} onFocus={(e) => e.target.select()} aria-label={label} />
        <button className="small-button" onClick={copy}>
          {copied ? "Copied" : "Copy"}
        </button>
        {openLabel && (
          <a className="small-button" href={value} target="_blank" rel="noreferrer">
            {openLabel}
          </a>
        )}
      </div>
      <small>{help}</small>
    </div>
  );
}

function DayEditor({
  calendarId,
  token,
  dayNumber,
  initial,
  onSaved,
  onNavigate,
  onClose,
}: {
  calendarId: string;
  token: string;
  dayNumber: number;
  initial: DayContent | undefined;
  onSaved: (day: DayContent, isEmpty: boolean) => void;
  onNavigate: (day: number) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [message, setMessage] = useState(initial?.message ?? "");
  // Up to two pictures. Slot 0 is the main one; slot 1 is offered once slot 0 is filled.
  const [pictures, setPictures] = useState<(string | null)[]>([
    initial?.imagePath ?? null,
    initial?.imagePath2 ?? null,
  ]);
  const [songInput, setSongInput] = useState(initial?.spotify ? spotifyLink(initial.spotify) : "");
  const song = parseSpotify(songInput);
  const songProblem =
    songInput.trim() && !song
      ? isSpotifyShortLink(songInput)
        ? "This is a short link. Open it in your browser and copy the open.spotify.com address instead."
        : "That doesn't look like a Spotify link. In Spotify, use Share → Copy song link."
      : "";
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const uploading = uploadingSlot !== null;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  // Pictures uploaded while this dialog is open. Any that don't end up saved get deleted.
  const uploadedHere = useRef<string[]>([]);
  const fallback = defaultDays[dayNumber - 1];

  const dirty =
    title !== (initial?.title ?? "") ||
    message !== (initial?.message ?? "") ||
    pictures[0] !== (initial?.imagePath ?? null) ||
    pictures[1] !== (initial?.imagePath2 ?? null) ||
    song !== (initial?.spotify ?? null) ||
    (!!songInput.trim() && !song);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && requestClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const requestClose = () => {
    if (dirty && !window.confirm("Discard the changes to this window?")) return;
    backend.deleteUnusedImages(uploadedHere.current);
    onClose();
  };

  const setPicture = (slot: number, path: string | null) =>
    setPictures((current) => {
      const next = [...current];
      next[slot] = path;
      // Removing the first picture moves the second one up.
      return next[0] ? next : [next[1], null];
    });

  const pickFile = async (slot: number, file: File | undefined) => {
    if (!file) return;
    setError("");
    setUploadingSlot(slot);
    try {
      const prepared = await prepareImage(file);
      const path = await backend.uploadImage(calendarId, prepared);
      uploadedHere.current.push(path);
      setPicture(slot, path);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploadingSlot(null);
    }
  };

  const save = async (then: "close" | "next") => {
    if (songProblem) {
      setError(songProblem);
      return;
    }
    setSaving(true);
    setError("");
    const day = {
      day: dayNumber,
      title: title.trim(),
      message: message.trim(),
      imagePath: pictures[0],
      imagePath2: pictures[0] ? pictures[1] : null,
      spotify: song,
    };
    try {
      await backend.saveDay(calendarId, token, day);
      // Now that the window points at its new pictures, the old and unchosen ones are unused.
      const leftovers = [...uploadedHere.current, initial?.imagePath, initial?.imagePath2].filter(
        (p): p is string => !!p && p !== day.imagePath && p !== day.imagePath2,
      );
      backend.deleteUnusedImages(leftovers);
      onSaved(day, !day.title && !day.message && !day.imagePath && !day.spotify);
      if (then === "next" && dayNumber < 25) onNavigate(dayNumber + 1);
      else onClose();
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  };

  const busy = uploading || saving;

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && requestClose()}>
      <div className="modal paper-card" role="dialog" aria-modal="true" aria-labelledby="day-editor-title">
        <div className="modal-head">
          <h2 id="day-editor-title">Window {dayNumber}</h2>
          <span className="fine-print">Opens on {dayNumber} December</span>
          <button className="close-button" onClick={requestClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="picture-slots">
            <PictureSlot
              path={pictures[0]}
              emptyArt={<WinterIllustration type={fallback.illustration} />}
              emptyText="Drop a picture here"
              chooseLabel="Choose a picture"
              uploading={uploadingSlot === 0}
              busy={busy}
              onPick={(file) => pickFile(0, file)}
              onRemove={() => setPicture(0, null)}
            />
            {pictures[0] && (
              <PictureSlot
                compact
                path={pictures[1]}
                emptyText="Add a second picture (optional)"
                chooseLabel="Choose a second picture"
                uploading={uploadingSlot === 1}
                busy={busy}
                onPick={(file) => pickFile(1, file)}
                onRemove={() => setPicture(1, null)}
              />
            )}
          </div>

          <div className="modal-fields">
            <label className="field grow">
              <span>Message</span>
              <textarea
                value={message}
                maxLength={2000}
                rows={7}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write something for this day…"
              />
              <small className="counter">{message.length} / 2000</small>
            </label>
            <label className="field">
              <span>Spotify song (optional)</span>
              <input
                value={songInput}
                onChange={(e) => setSongInput(e.target.value)}
                placeholder="https://open.spotify.com/track/…"
                inputMode="url"
              />
              {songProblem ? (
                <small className="field-problem">{songProblem}</small>
              ) : (
                !song && <small>In Spotify, open a song and choose Share → Copy song link, then paste it here.</small>
              )}
            </label>
            {song && <SpotifyPlayer item={song} />}
            {error && <p className="form-error">{error}</p>}
          </div>
        </div>

        <div className="modal-foot">
          <button className="text-button" onClick={requestClose} disabled={saving}>
            Cancel
          </button>
          <span className="spacer" />
          {dayNumber < 25 && (
            <button className="small-button" onClick={() => save("next")} disabled={busy}>
              Save & go to {dayNumber + 1}
            </button>
          )}
          <button className="primary-button" onClick={() => save("close")} disabled={busy}>
            {saving ? "Saving…" : "Save window"}
          </button>
        </div>
      </div>
    </div>
  );
}

/** One picture of a window: drop or choose a file, see it, replace or remove it. */
function PictureSlot({
  path,
  emptyArt,
  emptyText,
  chooseLabel,
  uploading,
  busy,
  compact = false,
  onPick,
  onRemove,
}: {
  path: string | null;
  emptyArt?: ReactNode;
  emptyText: string;
  chooseLabel: string;
  uploading: boolean;
  busy: boolean;
  compact?: boolean;
  onPick: (file: File | undefined) => void;
  onRemove: () => void;
}) {
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const imageUrl = path ? backend.imageUrl(path) : "";

  return (
    <div
      className={`dropzone ${compact ? "is-compact" : ""} ${dragging ? "is-dragging" : ""} ${imageUrl ? "has-image" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (!busy) onPick(e.dataTransfer.files[0]);
      }}
    >
      {imageUrl ? (
        <img src={imageUrl} alt="Picture for this window" />
      ) : (
        <div className="dropzone-empty">
          {emptyArt}
          <p>{uploading ? "Uploading…" : emptyText}</p>
        </div>
      )}
      <div className="dropzone-actions">
        <button className="small-button" onClick={() => fileInput.current?.click()} disabled={busy}>
          {uploading ? "Uploading…" : imageUrl ? "Replace picture" : chooseLabel}
        </button>
        {imageUrl && (
          <button className="small-button" onClick={onRemove} disabled={busy}>
            Remove
          </button>
        )}
      </div>
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          onPick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}
