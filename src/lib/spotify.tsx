const TYPES = "track|album|playlist|episode|show";

/**
 * Turns whatever the creator pastes from Spotify's "Share → Copy link" into "<type>/<id>".
 * Accepts https://open.spotify.com/track/ID?si=…, …/intl-sv/track/ID, and spotify:track:ID.
 * Returns null when it isn't a Spotify link we can embed.
 */
export function parseSpotify(input: string): string | null {
  const text = input.trim();
  const web = text.match(
    new RegExp(`^https?://open\\.spotify\\.com/(?:intl-[a-z-]+/)?(?:embed/)?(${TYPES})/([A-Za-z0-9]{10,40})`, "i"),
  );
  if (web) return `${web[1].toLowerCase()}/${web[2]}`;
  const uri = text.match(new RegExp(`^spotify:(${TYPES}):([A-Za-z0-9]{10,40})$`, "i"));
  if (uri) return `${uri[1].toLowerCase()}/${uri[2]}`;
  return null;
}

/** Short links (spotify.link/…) redirect, so the page can't read the song from them. */
export const isSpotifyShortLink = (input: string) => /^https?:\/\/spotify\.link\//i.test(input.trim());

export const spotifyLink = (item: string) => `https://open.spotify.com/${item}`;

/** Spotify's own player. Signed-in listeners hear the whole song; others get a 30-second preview. */
export function SpotifyPlayer({ item }: { item: string }) {
  return (
    <iframe
      className="spotify-player"
      title="Spotify player"
      src={`https://open.spotify.com/embed/${item}?utm_source=generator&theme=0`}
      height={item.startsWith("track/") || item.startsWith("episode/") ? 152 : 352}
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      loading="lazy"
    />
  );
}
