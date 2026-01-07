import Link from "next/link";

const UNITS = [
  { name: "忠德", color: "bg-red-100 text-red-800" },
  { name: "孝德", color: "bg-orange-100 text-orange-800" },
  { name: "仁德", color: "bg-yellow-100 text-yellow-800" },
  { name: "愛德", color: "bg-green-100 text-green-800" },
  { name: "信德", color: "bg-blue-100 text-blue-800" },
  { name: "義德", color: "bg-purple-100 text-purple-800" },
];

export default function ClassManagementHome() {
  return (
    <div className="flex flex-col space-y-4">
      <article className="prose">
        <h1>班務網</h1>
        <p>請選擇您的單位</p>
      </article>

      <div className="grid grid-cols-2 gap-4">
        {UNITS.map((unit) => (
          <Link href={`/yideclass/${unit.name}`} key={unit.name}>
            <div
              className={`card cursor-pointer shadow-lg transition-shadow hover:shadow-xl ${unit.color}`}
            >
              <div className="card-body items-center text-center">
                <h2 className="card-title text-2xl">{unit.name}</h2>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
