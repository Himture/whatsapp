"use client";

// Recharts is heavy (~300KB). This module is only loaded when the analytics
// page mounts, keeping it out of the initial page bundle.
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Card, CardContent, CardTitle } from "@/components/ui/card";

interface DailyStat { date: string; sent: number; delivered: number; read: number; received: number }
interface BroadcastStat { name: string; sent: number; delivered: number; readCount: number; failed: number }

export function DailyVolumeChart({ data }: { data: DailyStat[] }) {
  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <CardTitle className="text-base mb-4">Daily Message Volume</CardTitle>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              tickFormatter={(v: string) =>
                new Date(v).toLocaleDateString([], { month: "short", day: "numeric" })
              }
            />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="sent" stroke="#2563eb" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="delivered" stroke="#16a34a" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="read" stroke="#9333ea" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="received" stroke="#ea580c" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function BroadcastPerformanceChart({ data }: { data: BroadcastStat[] }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <CardTitle className="text-base mb-4">Broadcast Performance</CardTitle>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="sent" fill="#2563eb" radius={[2, 2, 0, 0]} />
            <Bar dataKey="delivered" fill="#16a34a" radius={[2, 2, 0, 0]} />
            <Bar dataKey="readCount" name="read" fill="#9333ea" radius={[2, 2, 0, 0]} />
            <Bar dataKey="failed" fill="#dc2626" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
