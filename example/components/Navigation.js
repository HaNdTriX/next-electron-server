import Link from "next/link";

export default function Navigation() {
  return (
    <>
      <h2>Navigation</h2>
      <ul>
        <li>
          <Link href="/">Index</Link>
        </li>
        <li>
          <Link href="/about">About</Link>
        </li>
        <li>
          <Link href="/invalid">Invalid (404)</Link>
        </li>
      </ul>
    </>
  );
}
