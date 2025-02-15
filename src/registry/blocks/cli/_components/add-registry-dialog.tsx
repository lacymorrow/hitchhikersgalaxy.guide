"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Registry } from "@/lib/types";
import { PlusCircle } from "lucide-react";
import { useState } from "react";

interface AddRegistryDialogProps {
  onAdd: (registry: Registry) => void;
}

export function AddRegistryDialog({ onAdd }: AddRegistryDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      name,
      url,
      description,
      baseComponentUrl: url,
      baseBlockUrl: url,
    });
    setOpen(false);
    setName("");
    setUrl("");
    setDescription("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Registry
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Custom Registry</DialogTitle>
          <DialogDescription>
            Add a custom component registry to browse and install components
            from.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Custom Registry"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="url">Registry URL</Label>
              <Input
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/registry"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Add Registry</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
