import Link from "next/link";

export function Brand() {
  return (
    <Link className="brand" href="/">
      <span className="brandMark">N</span>
      <span>
        <strong>Naltech</strong>
        <small>CCTV Cloud</small>
      </span>
    </Link>
  );
}
