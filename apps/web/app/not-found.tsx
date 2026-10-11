import Link from "next/link";
export default function NotFound() {
  return (
    <main className="page-container narrow">
      <h1>Esta aventura no está aquí</h1>
      <Link className="talky-button" href="/profiles">
        Volver a los perfiles
      </Link>
    </main>
  );
}
