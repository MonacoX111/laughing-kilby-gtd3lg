import { TabKey } from "../types";

type Props = {
  active: TabKey;
  onChange: (tab: TabKey) => void;
};

const tabs: TabKey[] = [
  "players",
  "teams",
  "tournaments",
  "leaderboard",
  "admin",
];

export default function Tabs({ active, onChange }: Props) {
  return (
    <div className="tabs">
      {tabs.map((tab) => (
        <button
          key={tab}
          className={`tab-btn ${active === tab ? "tab-btn-active" : ""}`}
          onClick={() => onChange(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
