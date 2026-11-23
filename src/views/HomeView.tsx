import { useState } from "react";
import { backend } from "../lib/backend";
import { loadSavedCalendars, rememberCalendar, shareLink } from "../lib/route";
import { DemoBanner, Scene } from "../components/Scene";

/** Landing page: start a new calendar, or get back to one made in this browser. */
export function HomeView() {
  const [saved] = useState(loadSavedCalendars);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const create = async () => {
    setBusy(true);
    setError("");
    try {
      const title = "Merry Christmas";
      const { id, editToken } = await backend.createCalendar(title);
      rememberCalendar({ id, token: editToken, title });
      window.location.hash = `#/edit/${id}/${editToken}`;
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <Scene>
      <section className="home-view">
        {backend.kind === "local" && <DemoBanner />}
        <header className="scene-header">
          <p className="kicker">Make someone's December</p>
          <h1>Advent Calendar</h1>
          <p className="subtitle">
            Fill 25 little windows with your own pictures and words, then send one link. They open a
            window each day; only you can change what's inside.
          </p>
        </header>

        <div className="paper-card home-card">
          <ol className="steps">
            <li>
              <strong>Fill the windows</strong>
              <span>Add a picture and a few words behind each door.</span>
            </li>
            <li>
              <strong>Share the link</strong>
              <span>Send it by message or email. No account needed to open it.</span>
            </li>
            <li>
              <strong>One a day</strong>
              <span>A new window unlocks each December morning on their clock.</span>
            </li>
          </ol>
          <button className="primary-button" onClick={create} disabled={busy}>
            {busy ? "Building your house…" : "Start a new calendar"}
          </button>
          {error && <p className="form-error">{error}</p>}
        </div>

        {saved.length > 0 && (
          <div className="paper-card home-card">
            <h2>Your calendars</h2>
            <ul className="saved-list">
              {saved.map((cal) => (
                <li key={cal.id}>
                  <span>{cal.title}</span>
                  <a className="text-button" href={`#/edit/${cal.id}/${cal.token}`}>
                    Edit
                  </a>
                  <a className="text-button" href={shareLink(cal.id)} target="_blank" rel="noreferrer">
                    View as receiver
                  </a>
                </li>
              ))}
            </ul>
            <p className="fine-print">
              Saved in this browser only. Keep your edit links somewhere safe to edit from another device.
            </p>
          </div>
        )}
      </section>
    </Scene>
  );
}
