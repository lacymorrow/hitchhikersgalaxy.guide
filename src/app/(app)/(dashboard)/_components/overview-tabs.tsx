"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { bounceRateData, pageViewsData, statusVariant, teamMembers } from "./mock-data";

const pageViewsConfig = {
  views: {
    label: "Page Views",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

const bounceRateConfig = {
  rate: {
    label: "Bounce Rate %",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

export function OverviewTabs() {
  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
        <TabsTrigger value="reports">Reports</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>Your team and their current status.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Last Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>{member.role}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(member.status)}>{member.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{member.lastActive}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="analytics">
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Page Views</CardTitle>
              <CardDescription>Monthly page views over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={pageViewsConfig} className="h-[250px] w-full">
                <BarChart data={pageViewsData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="views" fill="var(--color-views)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Bounce Rate</CardTitle>
              <CardDescription>Monthly bounce rate trend</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={bounceRateConfig} className="h-[250px] w-full">
                <BarChart data={bounceRateData}>
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="rate" fill="var(--color-rate)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="reports">
        <Card>
          <CardHeader>
            <CardTitle>Export Reports</CardTitle>
            <CardDescription>Download your data in various formats.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button variant="outline">Export CSV</Button>
            <Button variant="outline">Export PDF</Button>
            <Button variant="outline">Export JSON</Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
