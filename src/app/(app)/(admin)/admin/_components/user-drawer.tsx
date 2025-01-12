"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Ban, CreditCard, Mail, Package, RotateCcw } from "lucide-react";
import { type UserData } from "./columns";

interface UserDrawerProps {
  user: UserData | null;
  open: boolean;
  onClose: () => void;
}

export interface Purchase {
  id: string;
  productName: string;
  amount: number;
  status: "paid" | "refunded" | "pending";
  purchaseDate: Date;
  orderId: string;
}

export const UserDrawer = ({ user, open, onClose }: UserDrawerProps) => {
  if (!user) return null;

  const handleBanUser = () => {
    // TODO: Implement ban user functionality
    console.log("Ban user:", user.id);
  };

  const handleResetAccess = () => {
    // TODO: Implement reset access functionality
    console.log("Reset access for:", user.id);
  };

  const handleSendEmail = () => {
    // TODO: Implement send email functionality
    console.log("Send email to:", user.email);
  };

  const getStatusBadgeVariant = (status: Purchase["status"]) => {
    switch (status) {
      case "paid":
        return "default";
      case "refunded":
        return "destructive";
      case "pending":
        return "secondary";
      default:
        return "secondary";
    }
  };

  return (
    <Drawer open={open} onOpenChange={onClose}>
      <DrawerContent>
        <ScrollArea className="h-[80vh]">
          <div className="mx-auto w-full max-w-2xl">
            <DrawerHeader>
              <DrawerTitle>User Details</DrawerTitle>
              <DrawerDescription>
                Detailed information about {user.name ?? user.email}
              </DrawerDescription>
            </DrawerHeader>

            <div className="p-6">
              <div className="space-y-6">
                {/* Quick Actions */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-wrap gap-2">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Ban className="mr-2 h-4 w-4" />
                            Ban User
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Ban User</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to ban {user.email}? This
                              action can be reversed later.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => void handleBanUser()}
                            >
                              Continue
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void handleResetAccess()}
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Reset Access
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void handleSendEmail()}
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        Send Email
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Separator />

                {/* Basic Information */}
                <section>
                  <h3 className="text-lg font-semibold">Basic Information</h3>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Email
                      </label>
                      <p>{user.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Name
                      </label>
                      <p>{user.name ?? "Not provided"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Joined
                      </label>
                      <p>{format(user.createdAt, "PPP")}</p>
                    </div>
                  </div>
                </section>

                <Separator />

                {/* Payment Information with enhanced UI */}
                <section>
                  <h3 className="text-lg font-semibold">Payment Information</h3>
                  <div className="mt-4 grid gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">
                              Payment Status
                            </p>
                            <Badge
                              variant={user.hasPaid ? "default" : "secondary"}
                            >
                              {user.hasPaid ? "Paid" : "Not Paid"}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-muted-foreground">
                              Total Purchases
                            </p>
                            <p className="text-2xl font-bold">
                              {user.totalPurchases}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <p className="text-sm font-medium text-muted-foreground">
                          Last Purchase
                        </p>
                        <p className="text-lg">
                          {user.lastPurchaseDate
                            ? format(user.lastPurchaseDate, "PPP")
                            : "No purchases"}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </section>

                <Separator />

                {/* Purchase History */}
                <section>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Purchase History</h3>
                    {user.purchases && user.purchases.length > 0 && (
                      <Button variant="outline" size="sm">
                        <Package className="mr-2 h-4 w-4" />
                        Export History
                      </Button>
                    )}
                  </div>

                  {user.purchases && user.purchases.length > 0 ? (
                    <Card>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {user.purchases.map((purchase) => (
                            <TableRow key={purchase.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">
                                    {purchase.productName}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Order: {purchase.orderId}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                {format(purchase.purchaseDate, "PPP")}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                                  ${purchase.amount.toFixed(2)}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={getStatusBadgeVariant(
                                    purchase.status,
                                  )}
                                >
                                  {purchase.status.charAt(0).toUpperCase() +
                                    purchase.status.slice(1)}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-6 text-center">
                        <Package className="mb-2 h-8 w-8 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          No purchase history available
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </section>
              </div>
            </div>

            <DrawerFooter>
              <DrawerClose asChild>
                <Button variant="outline">Close</Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
};
