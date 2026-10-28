import Link from "next/link";

export default function NotFound() {
  return (
    <main className="bag-empty">
      <h1>Not in the archive.</h1>
      <p>This piece is not here, or never was.</p>
      <p style={{ marginTop: "1.4rem" }}>
        <Link className="cta" href="/archive">
          Enter the archive
        </Link>
      </p>
    </main>
  );
}
