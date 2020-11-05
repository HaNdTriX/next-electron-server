import Link from "next/link";

export default function AboutPage() {
  return (
    <>
      <h1>About Page</h1>
      <ul>
        <li>
          <Link href="/">
            <a>Index</a>
          </Link>
        </li>
      </ul>
    </>
  );
}
