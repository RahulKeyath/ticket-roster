import React, { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Download, FileDown, Trash2 } from "lucide-react";

// ------------------------------
// Data & Types
// ------------------------------
type ShiftCode = "M" | "E" | "N" | "G";
type Staff = { name: string; retired: boolean };
type MachineInfo = { id: string; threeShift: boolean; flexToGeneral: boolean };
type Leave = { name: string; date: string };
type DayAssignments = Record<string, Partial<Record<ShiftCode, string>>>;
type WeekAssignments = Record<number, DayAssignments>;

// ------------------------------
// Constants
// ------------------------------
const STAFF_ORDERED: string[] = [
  "Krishnan",
  "Priya",
  "Bàlakrishnan",
  "Parameswaran",
  "Viswanathan",
  "Appu",
  "Majeed",
  "Ramachadran",
  "Premarajan",
  "Narayanan",
  "Vijayakumar",
  "Koya",
  "Ramachadran 2",
  "Vijayan T V",
  "Abdul Razak",
  "Vinod Kumar",
  "Saravanan",
  "Nikhil Lal",
  "Rema",
  "Koulath Beevi",
  "Sanjeev",
  "Vinayak P",
  "Vishnu Vin",
  "Sheeba",
  "Sreenitha",
  "Sruthi",
  "Noushad",
  "Sharmila",
  "Muraleedhar",
  "Geetha",
  "Aparna P",
  "Azhakesan",
  "Nigitha",
  "Shabna",
  "Sakthidhar",
  "Valsala",
  "Jincy",
  "Abdul Basit",
  "Jisha T T",
  "Rajesh KM",
  "Abishek P K",
  "Ramya N",
  "Sajini",
  "Aparna 2",
  "Roshni",
];

const MACHINES: MachineInfo[] = Array.from({ length: 15 }, (_, i) => i + 3).map(
  (n) => {
    const id = `T${n.toString().padStart(2, "0")}`;
    const threeShift = ["T04", "T06", "T10", "T13", "T16"].includes(id);
    const flexToGeneral = ["T15", "T11", "T17", "T03"].includes(id);
    return { id, threeShift, flexToGeneral };
  }
);

// ------------------------------
// Utilities
// ------------------------------
function formatDay(date: Date) {
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}
function toISO(d: Date) {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
}
function nextMonday(from = new Date()) {
  const d = new Date(from);
  const day = d.getDay();
  const delta = (1 - day + 7) % 7;
  d.setDate(d.getDate() + delta);
  d.setHours(0, 0, 0, 0);
  return d;
}
function downloadCSV(filename: string, csv: string) {
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ------------------------------
// Roster Algorithm
// ------------------------------
function generateRoster(
  staff: Staff[],
  machines: MachineInfo[],
  weekStartISO: string,
  leaves: Leave[]
) {
  const assignments: WeekAssignments = {};
  const shiftCount = new Map<string, number>();
  const daysWorked = new Map<string, Set<number>>();
  const leaveMap = new Map<string, Set<string>>();

  staff.forEach((s) => {
    shiftCount.set(s.name, 0);
    daysWorked.set(s.name, new Set());
  });

  leaves.forEach((l) => {
    const name = l.name.trim();
    if (!name) return;
    const dt = new Date(l.date);
    if (isNaN(dt.getTime())) return;
    const iso1 = toISO(dt);
    const iso2 = toISO(new Date(dt.getTime() + 24 * 60 * 60 * 1000));
    if (!leaveMap.has(name)) leaveMap.set(name, new Set());
    leaveMap.get(name)!.add(iso1);
    leaveMap.get(name)!.add(iso2);
  });

  const start = new Date(weekStartISO);

  function isEligible(name: string, dIdx: number, shift: ShiftCode, retired: boolean) {
    const dayDate = new Date(start);
    dayDate.setDate(dayDate.getDate() + dIdx);
    const iso = toISO(dayDate);
    if (leaveMap.get(name)?.has(iso)) return false;
    if (daysWorked.get(name)!.has(dIdx)) return false;
    if (shift === "N" && retired) return false;
    if (daysWorked.get(name)!.size >= 6) return false;
    return true;
  }

  function sortedPool(dIdx: number, shift: ShiftCode) {
    const pool = staff.filter((s) => isEligible(s.name, dIdx, shift, s.retired));
    return pool.sort((a, b) => {
      const sa = shiftCount.get(a.name)!;
      const sb = shiftCount.get(b.name)!;
      if (sa !== sb) return sa - sb;
      const da = daysWorked.get(a.name)!.size;
      const db = daysWorked.get(b.name)!.size;
      if (da !== db) return da - db;
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    });
  }

  function requiredSlotsNoFlex() {
    let req = 0;
    machines.forEach((m) => (req += m.threeShift ? 3 : 2));
    return req;
  }
  function availableCount(dIdx: number) {
    const dayDate = new Date(start);
    dayDate.setDate(dayDate.getDate() + dIdx);
    const iso = toISO(dayDate);
    let c = 0;
    staff.forEach((s) => {
      if (leaveMap.get(s.name)?.has(iso)) return;
      if (daysWorked.get(s.name)!.has(dIdx)) return;
      if (daysWorked.get(s.name)!.size >= 6) return;
      c += 1;
    });
    return c;
  }

  for (let d = 0; d < 7; d++) {
    assignments[d] = {};

    const req = requiredSlotsNoFlex();
    const avail = availableCount(d);
    const shortage = Math.max(0, req - avail);
    const flexCandidatesOrder = ["T15", "T11", "T17", "T03"];
    const flexToday = new Set<string>();
    if (shortage > 0) {
      let need = shortage;
      for (const mid of flexCandidatesOrder) {
        const mInfo = machines.find((m) => m.id === mid);
        if (mInfo && !mInfo.threeShift && mInfo.flexToGeneral) {
          flexToday.add(mid);
          need -= 1;
          if (need <= 0) break;
        }
      }
    }

    for (const m of machines) {
      assignments[d][m.id] = {};
      const shifts: ShiftCode[] = m.threeShift
        ? ["M", "E", "N"]
        : flexToday.has(m.id)
        ? ["G"]
        : ["M", "E"];

      for (const s of shifts) {
        const pool = sortedPool(d, s);
        if (pool.length === 0) {
          assignments[d][m.id][s] = "UNSTAFFED";
          continue;
        }
        const chosen = pool[0];
        assignments[d][m.id][s] = chosen.name;
        shiftCount.set(chosen.name, shiftCount.get(chosen.name)! + 1);
        daysWorked.get(chosen.name)!.add(d);
      }
    }
  }

  return { assignments, shiftCount, daysWorked };
}

// ------------------------------
// Component
// ------------------------------
export default function App() {
  const [weekStart, setWeekStart] = useState<string>(() => toISO(nextMonday()));
  const [staff] = useState<Staff[]>(
    () => STAFF_ORDERED.map((name, idx) => ({ name, retired: idx < 15 }))
  );
  const [leavesText, setLeavesText] = useState<string>(
    "Name,YYYY-MM-DD\nPriya,2025-08-20"
  );

  const leaves: Leave[] = useMemo(() => {
    return leavesText
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [name, date] = line.split(/\s*,\s*/);
        return { name: name || "", date: date || "" };
      })
      .filter((l) => l.name && l.date);
  }, [leavesText]);

  const { assignments } = useMemo(
    () => generateRoster(staff, MACHINES, weekStart, leaves),
    [staff, weekStart, leaves]
  );

  function resetLeaves() {
    setLeavesText("");
  }

  function exportDayCSV(dayIdx: number) {
    const day = new Date(weekStart);
    day.setDate(day.getDate() + dayIdx);
    const hdr = ["Machine", "Morning", "Evening", "Night/General"];
    const rows = MACHINES.map((m) => {
      const cell = assignments[dayIdx]?.[m.id] || {};
      const morning = cell.M || "";
      const evening = cell.E || "";
      const ng = (cell.G || cell.N || "") ?? "";
      return [m.id, morning, evening, ng];
    });

    const working = new Set<string>();
    rows.forEach((r) =>
      r.slice(1).forEach((n) => n && n !== "UNSTAFFED" && working.add(n))
    );
    const allNames = staff.map((s) => s.name);
    const rest = allNames.filter((n) => !working.has(n));

    const csv = [hdr.join(",")]
      .concat(rows.map((r) => r.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(",")))
      .concat(["", `"Rest Staff:","${rest.join(", ")}"`])
      .join("\n");

    const fname = `Roster_${toISO(day)}.csv`;
    downloadCSV(fname, csv);
  }

  function printPDF() {
    window.print();
  }

  const dayTabs = Array.from({ length: 7 }, (_, i) => i);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Ticket Machine Duty Roster</h1>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={printPDF} className="flex items-center gap-2">
              <FileDown className="h-4 w-4" /> Print / Save PDF
            </Button>
            <Button variant="outline" onClick={resetLeaves} className="flex items-center gap-2">
              <Trash2 className="h-4 w-4" /> Clear Leaves
            </Button>
          </div>
        </div>

        <Card className="mb-6">
          <CardContent className="p-4 grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Week start date (Monday)</Label>
              <Input type="date" value={weekStart} onChange={(e) => setWeekStart(e.target.value)} />
              <p className="text-xs text-slate-500">
                If empty, next Monday is used by default.
              </p>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Leave entries (one per line: Name,YYYY-MM-DD)</Label>
              <Textarea
                rows={6}
                value={leavesText}
                onChange={(e) => setLeavesText(e.target.value)}
                placeholder="Name,YYYY-MM-DD"
              />
              <p className="text-xs text-slate-500">
                Leave excludes the leave day and the next day automatically.
              </p>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="0" className="w-full">
          <TabsList className="flex flex-wrap">
            {dayTabs.map((d) => {
              const dayDate = new Date(weekStart);
              dayDate.setDate(dayDate.getDate() + d);
              return (
                <TabsTrigger key={d} value={String(d)} className="px-3 py-1">
                  {formatDay(dayDate)}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {dayTabs.map((d) => {
            const dayDate = new Date(weekStart);
            dayDate.setDate(dayDate.getDate() + d);
            const rows = MACHINES.map((m) => {
              const cell = assignments[d]?.[m.id] || {};
              const morning = cell.M || "";
              const evening = cell.E || "";
              const ng = (cell.G || cell.N || "") ?? "";
              return { machine: m.id, morning, evening, ng };
            });

            const working = new Set<string>();
            rows.forEach((r) =>
              [r.morning, r.evening, r.ng].forEach(
                (n) => n && n !== "UNSTAFFED" && working.add(n)
              )
            );
            const allNames = staff.map((s) => s.name);
            const rest = allNames.filter((n) => !working.has(n));

            return (
              <TabsContent key={d} value={String(d)} className="mt-4">
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead className="bg-slate-100 print:bg-white">
                          <tr>
                            <th className="px-3 py-2 text-left">Machine</th>
                            <th className="px-3 py-2 text-left">Morning</th>
                            <th className="px-3 py-2 text-left">Evening</th>
                            <th className="px-3 py-2 text-left">Night / General</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((r) => (
                            <tr key={r.machine} className="border-b last:border-0">
                              <td className="px-3 py-2 font-medium">{r.machine}</td>
                              <td className="px-3 py-2">{r.morning}</td>
                              <td className="px-3 py-2">{r.evening}</td>
                              <td className="px-3 py-2">{r.ng}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="p-4 space-y-2">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="secondary"
                          className="flex items-center gap-2"
                          onClick={() => exportDayCSV(d)}
                        >
                          <Download className="h-4 w-4" /> Download CSV for {formatDay(dayDate)}
                        </Button>
                      </div>
                      <div className="pt-2 text-sm">
                        <span className="font-semibold">Rest Staff: </span>
                        <span>{rest.join(", ")}</span>
                      </div>
                      <div className="text-xs text-slate-500">
                        3-shift: T04, T06, T10, T13, T16 • Flex to General if shortage: T15,
                        T11, T17, T03 • Retired staff never assigned to Night.
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>

        <div className="mt-8 text-xs text-slate-500 print:hidden">
          Tip: Use the “Print / Save PDF” button to export a PDF for this week. Each tab/day
          will print on a new page.
        </div>
      </div>

      {/* Print styles */}
      <style>
        {`@media print {
          .print\\:hidden { display: none !important; }
          @page { size: A4 landscape; margin: 10mm; }
          body { background: white; }
          table { page-break-inside: avoid; }
        }`}
      </style>
    </div>
  );
}
