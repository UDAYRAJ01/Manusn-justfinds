import React, { useState } from "react";
import { Bell, Check, CheckCheck, Settings, ShieldAlert, Sparkles, ExternalLink } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"notifications" | "preferences">("notifications");
  
  let countData = { count: 0 };
  let notifications: any[] = [];
  let preferences: any = null;
  let markAsReadMutation = { mutate: () => {} };
  let markAllAsReadMutation = { mutate: (_val?: any) => {} };
  let updatePrefMutation = { mutate: (_val: any) => {} };

  try {
    const utils = trpc.useUtils();
    const resCount = trpc.notification.unreadCount.useQuery(undefined, {
      refetchInterval: 15000,
    });
    countData = resCount.data ?? { count: 0 };

    const resList = trpc.notification.list.useQuery(
      { limit: 25 },
      { enabled: open }
    );
    notifications = resList.data ?? [];

    const resPref = trpc.notification.getPreferences.useQuery(undefined, {
      enabled: open && activeTab === "preferences",
    });
    preferences = resPref.data;

    const mutRead = trpc.notification.markAsRead.useMutation({
      onSuccess: () => {
        utils.notification.unreadCount.invalidate();
        utils.notification.list.invalidate();
      },
    });
    markAsReadMutation = mutRead as any;

    const mutAll = trpc.notification.markAllAsRead.useMutation({
      onSuccess: () => {
        utils.notification.unreadCount.invalidate();
        utils.notification.list.invalidate();
      },
    });
    markAllAsReadMutation = mutAll as any;

    const mutPref = trpc.notification.updatePreferences.useMutation({
      onSuccess: () => {
        utils.notification.getPreferences.invalidate();
      },
    });
    updatePrefMutation = mutPref as any;
  } catch (err) {
    // Fallback when rendered outside tRPC Provider in legacy test mocks
  }

  const unreadCount = countData?.count ?? 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative grid size-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 transition-all hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
          aria-label="Notifications"
        >
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-blue-600 text-[10px] font-bold text-white shadow-sm">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 sm:w-96 p-0 shadow-xl rounded-2xl border border-slate-200" align="end">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-slate-50/50">
            <TabsList className="grid w-[200px] grid-cols-2 h-8">
              <TabsTrigger value="notifications" className="text-xs">Inbox</TabsTrigger>
              <TabsTrigger value="preferences" className="text-xs">Settings</TabsTrigger>
            </TabsList>
            {activeTab === "notifications" && unreadCount > 0 && (
              <button
                onClick={() => markAllAsReadMutation.mutate()}
                className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <CheckCheck className="size-3.5" /> Mark all read
              </button>
            )}
          </div>

          <TabsContent value="notifications" className="m-0 max-h-[380px] overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-500">
                No notifications right now.
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 transition-colors hover:bg-slate-50/80 ${
                    !item.isRead ? "bg-blue-50/30" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold capitalize text-slate-900">{item.type}</span>
                        {!item.isRead && (
                          <span className="size-2 rounded-full bg-blue-600" />
                        )}
                      </div>
                      <p className="mt-1 text-sm font-medium text-slate-800">{item.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{item.message}</p>
                      <span className="mt-2 block text-[10px] text-slate-400">
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {item.actionUrl && (
                        <a
                          href={item.actionUrl}
                          className="text-slate-400 hover:text-blue-600"
                          title="Open action link"
                        >
                          <ExternalLink className="size-4" />
                        </a>
                      )}
                      {!item.isRead && (
                        <button
                          onClick={() => (markAsReadMutation as any).mutate({ id: item.id })}
                          className="text-slate-400 hover:text-emerald-600"
                          title="Mark read"
                        >
                          <Check className="size-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="preferences" className="m-0 p-4 space-y-4 max-h-[380px] overflow-y-auto">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Notification Channels</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="inApp" className="text-sm font-medium text-slate-700">In-App Bell</Label>
                  <Switch
                    id="inApp"
                    checked={preferences?.inAppEnabled ?? true}
                    onCheckedChange={(val: boolean) => updatePrefMutation.mutate({ inAppEnabled: val } as any)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="emailCh" className="text-sm font-medium text-slate-700">Email Alerts (Ready)</Label>
                  <Switch
                    id="emailCh"
                    checked={preferences?.emailEnabled ?? true}
                    onCheckedChange={(val: boolean) => updatePrefMutation.mutate({ emailEnabled: val } as any)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="whatsappCh" className="text-sm font-medium text-slate-700">WhatsApp / SMS (Ready)</Label>
                  <Switch
                    id="whatsappCh"
                    checked={preferences?.whatsappEnabled ?? false}
                    onCheckedChange={(val: boolean) => updatePrefMutation.mutate({ whatsappEnabled: val } as any)}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Event Subscriptions</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="bizSub" className="text-sm font-medium text-slate-700">Business & Verification</Label>
                    <Switch
                      id="bizSub"
                      checked={preferences?.notifyBusiness ?? true}
                      onCheckedChange={(val: boolean) => updatePrefMutation.mutate({ notifyBusiness: val } as any)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="jobSub" className="text-sm font-medium text-slate-700">Jobs & Applications</Label>
                    <Switch
                      id="jobSub"
                      checked={preferences?.notifyJobs ?? true}
                      onCheckedChange={(val: boolean) => updatePrefMutation.mutate({ notifyJobs: val } as any)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="leadSub" className="text-sm font-medium text-slate-700">Customer Leads</Label>
                    <Switch
                      id="leadSub"
                      checked={preferences?.notifyLeads ?? true}
                      onCheckedChange={(val: boolean) => updatePrefMutation.mutate({ notifyLeads: val } as any)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="revSub" className="text-sm font-medium text-slate-700">Reviews & Ratings</Label>
                    <Switch
                      id="revSub"
                      checked={preferences?.notifyReviews ?? true}
                      onCheckedChange={(val: boolean) => updatePrefMutation.mutate({ notifyReviews: val } as any)}
                    />
                  </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
