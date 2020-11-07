import Link from "next/link";

export default function Navigation() {
  return (
    <>
      <h2>Navigation</h2>
      <ul>
        <li>
          <Link href="/">
            <a>Index</a>
          </Link>
        </li>
        <li>
          <Link href="/about">
            <a>About</a>
          </Link>
        </li>
        <li>
          <Link href="/invalid">
            <a>Invalid (404)</a>
          </Link>
        </li>
      </ul>
    </>
  );
}
