"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

export function CardsShare() {
  return (
    <Card className="gap-0 py-0">
      <CardHeader className="p-6 pb-3">
        <CardTitle>Share this document</CardTitle>
        <CardDescription>Anyone with the link can view this document.</CardDescription>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="flex gap-x-2">
          <Label htmlFor="link" className="sr-only">
            Link
          </Label>
          <Input id="link" value="http://example.com/link/to/document" readOnly />
          <Button className="shrink-0">Copy Link</Button>
        </div>
        <Separator className="my-4" />
        <div className="space-y-4">
          <div className="text-sm font-medium">People with access</div>
          <div className="grid gap-6">
            <div className="flex items-center justify-between gap-x-4">
              <div className="flex items-center gap-x-4">
                <Avatar>
                  <AvatarImage
                    src="https://raw.githubusercontent.com/shadcn/ui/main/apps/www/public/avatars/03.png"
                    alt="Image"
                  />
                  <AvatarFallback>OM</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm leading-none font-medium">Olivia Martin</p>
                  <p className="text-sm text-muted-foreground">m@example.com</p>
                </div>
              </div>
              <Select defaultValue="edit">
                <SelectTrigger className="ml-auto w-[110px]" aria-label="Edit">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="edit">Can edit</SelectItem>
                  <SelectItem value="view">Can view</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between gap-x-4">
              <div className="flex items-center gap-x-4">
                <Avatar>
                  <AvatarImage
                    src="https://raw.githubusercontent.com/shadcn/ui/main/apps/www/public/avatars/05.png"
                    alt="Image"
                  />
                  <AvatarFallback>IN</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm leading-none font-medium">Isabella Nguyen</p>
                  <p className="text-sm text-muted-foreground">b@example.com</p>
                </div>
              </div>
              <Select defaultValue="view">
                <SelectTrigger className="ml-auto w-[110px]" aria-label="Edit">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="edit">Can edit</SelectItem>
                  <SelectItem value="view">Can view</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between gap-x-4">
              <div className="flex items-center gap-x-4">
                <Avatar>
                  <AvatarImage
                    src="https://raw.githubusercontent.com/shadcn/ui/main/apps/www/public/avatars/01.png"
                    alt="Image"
                  />
                  <AvatarFallback>SD</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm leading-none font-medium">Sofia Davis</p>
                  <p className="text-sm text-muted-foreground">p@example.com</p>
                </div>
              </div>
              <Select defaultValue="view">
                <SelectTrigger className="ml-auto w-[110px]" aria-label="Edit">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="edit">Can edit</SelectItem>
                  <SelectItem value="view">Can view</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
