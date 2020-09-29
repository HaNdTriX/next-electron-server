import Link from "next/link";

export default function IndexPage() {
  return (
    <>
      <h1>Index Page</h1>
      <ul>
        <li>
          <Link href="/about">
            <a>About</a>
          </Link>
        </li>
        <li>
          <a href="/invalid">Invalid</a>
        </li>
      </ul>
    </>
  );
}
