import { Bell, EyeOff, User } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function DemoNotifications() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Notifications</CardTitle>
        <CardDescription>Choose what you want to be notified about.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-1">
        <div className="-mx-2 flex items-start gap-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
          <Bell className="mt-px h-5 w-5" />
          <div className="space-y-1">
            <p className="text-sm leading-none font-medium">Everything</p>
            <p className="text-sm text-muted-foreground">Email digest, mentions & all activity.</p>
          </div>
        </div>
        <div className="-mx-2 flex items-start gap-x-4 rounded-md bg-accent p-2 text-accent-foreground transition-all">
          <User className="mt-px h-5 w-5" />
          <div className="space-y-1">
            <p className="text-sm leading-none font-medium">Available</p>
            <p className="text-sm text-muted-foreground">Only mentions and comments.</p>
          </div>
        </div>
        <div className="-mx-2 flex items-start gap-x-4 rounded-md p-2 transition-all hover:bg-accent hover:text-accent-foreground">
          <EyeOff className="mt-px h-5 w-5" />
          <div className="space-y-1">
            <p className="text-sm leading-none font-medium">Ignoring</p>
            <p className="text-sm text-muted-foreground">Turn off all notifications.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
