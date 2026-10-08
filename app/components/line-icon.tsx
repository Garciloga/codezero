export default function LineIcon({ kind = "learning" }: { kind?: string }) {
  const shapes: Record<string, string> = {
    learning: "M3 5h7l2 2 2-2h7v15h-7l-2 2-2-2H3V5Zm9 2v15",
    people:
      "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M16 3a4 4 0 0 1 0 8M22 21v-2a4 4 0 0 0-3-3.87",
    home: "m3 10 9-7 9 7v11h-6v-7H9v7H3V10Z",
    help: "M9 9a3 3 0 1 1 5 2c-2 1-2 2-2 3M12 17v1",
    settings:
      "M12 3v3M12 18v3M3 12h3M18 12h3M6 6l2 2M16 16l2 2M6 18l2-2M16 8l2-2",
    certificate: "M5 3h14v14H5V3Zm3 14v5l4-2 4 2v-5",
    task: "M9 5H5v16h14V5h-4M9 3h6v4H9V3Zm-1 9 2 2 6-5",
  };
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={shapes[kind] ?? shapes.learning} />
      {kind === "people" && <circle cx="9" cy="7" r="4" />}
      {kind === "help" && <circle cx="12" cy="12" r="10" />}
      {kind === "settings" && <circle cx="12" cy="12" r="5" />}
    </svg>
  );
}
