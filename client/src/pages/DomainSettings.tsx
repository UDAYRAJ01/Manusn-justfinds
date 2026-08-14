import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, ShieldCheck, CheckCircle2, AlertCircle, Trash2, Star, ExternalLink, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface DomainSettingsProps {
  businessId: number;
}

export default function DomainSettings({ businessId }: DomainSettingsProps) {
  const [newDomainInput, setNewDomainInput] = useState("");
  const utils = trpc.useUtils();

  const { data, isLoading, error } = trpc.domain.getByBusiness.useQuery({ businessId });

  const addMutation = trpc.domain.addDomain.useMutation({
    onSuccess: (res) => {
      toast.success(`Domain ${res.domain} added successfully. Please configure DNS TXT verification.`);
      setNewDomainInput("");
      utils.domain.getByBusiness.invalidate({ businessId });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to add custom domain.");
    },
  });

  const verifyMutation = trpc.domain.verifyDomain.useMutation({
    onSuccess: (res) => {
      toast.success("Domain ownership verified and SSL activated!");
      utils.domain.getByBusiness.invalidate({ businessId });
    },
    onError: (err) => {
      toast.error(err.message || "Verification failed. Please check DNS propagation.");
    },
  });

  const primaryMutation = trpc.domain.setPrimary.useMutation({
    onSuccess: () => {
      toast.success("Primary domain updated.");
      utils.domain.getByBusiness.invalidate({ businessId });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update primary domain.");
    },
  });

  const removeMutation = trpc.domain.removeDomain.useMutation({
    onSuccess: () => {
      toast.success("Domain disconnected.");
      utils.domain.getByBusiness.invalidate({ businessId });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to disconnect domain.");
    },
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDomainInput.trim()) return;
    addMutation.mutate({ businessId, domain: newDomainInput.trim() });
  };

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading custom domain settings...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-destructive">Error loading custom domains: {error.message}</div>;
  }

  const domains = data?.domains || [];
  const records = data?.verificationRecords || [];

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Custom Domain</h1>
          <p className="text-muted-foreground text-sm">
            Connect your own custom domain (e.g., yourbusiness.com) to your Just Finds published website.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Connect a New Domain
          </CardTitle>
          <CardDescription>
            Enter your apex domain or subdomain. You will be provided with DNS verification instructions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="e.g., mybusiness.com or www.mybusiness.com"
              value={newDomainInput}
              onChange={(e) => setNewDomainInput(e.target.value)}
              disabled={addMutation.isPending}
              className="flex-1"
            />
            <Button type="submit" disabled={addMutation.isPending || !newDomainInput.trim()}>
              {addMutation.isPending ? "Adding..." : "Add Domain"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Connected Domains</h2>
        {domains.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground border-dashed">
            No custom domains connected yet. Enter a domain above to get started.
          </Card>
        ) : (
          domains.map((dom) => {
            const rec = records.find((r) => r.domain === dom.domain);
            return (
              <Card key={dom.id} className="overflow-hidden border-border/60">
                <div className="p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <div className="font-semibold text-base flex items-center gap-2">
                          <a href={`https://${dom.domain}`} target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-1">
                            {dom.domain}
                            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                          </a>
                          {dom.isPrimary && (
                            <Badge variant="default" className="text-xs">
                              <Star className="w-3 h-3 mr-1 fill-current" /> Primary
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Type: {dom.domainType} • Created: {new Date(dom.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={dom.verificationStatus === "verified" ? "default" : "outline"} className={dom.verificationStatus === "verified" ? "bg-emerald-600 text-white" : ""}>
                        Ownership: {dom.verificationStatus.toUpperCase()}
                      </Badge>
                      <Badge variant={dom.routingStatus === "connected" ? "default" : "secondary"}>
                        Routing: {dom.routingStatus.toUpperCase()}
                      </Badge>
                      <Badge variant={dom.sslStatus === "active" ? "default" : "secondary"}>
                        SSL: {dom.sslStatus.toUpperCase()}
                      </Badge>
                    </div>
                  </div>

                  {rec && dom.verificationStatus !== "verified" && (
                    <div className="bg-muted/50 p-4 rounded-lg space-y-3 text-sm border">
                      <div className="font-medium text-foreground flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                        DNS Configuration Required for Ownership Verification
                      </div>
                      <p className="text-muted-foreground text-xs">
                        Add the following TXT record to your DNS provider (e.g., Cloudflare, GoDaddy, Route53):
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono bg-background p-3 rounded border">
                        <div>
                          <span className="text-muted-foreground block">Type</span>
                          <span className="font-bold">TXT</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Host / Name</span>
                          <span className="font-bold">@</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block">Value / Content</span>
                          <span className="font-bold text-primary">{rec.verificationToken}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t text-xs">
                    <div className="text-muted-foreground">
                      {dom.verificationStatus === "verified"
                        ? "Domain ownership verified and routing active."
                        : "Waiting for DNS verification record check."}
                    </div>
                    <div className="flex items-center gap-2">
                      {dom.verificationStatus !== "verified" && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => verifyMutation.mutate({ businessId, domainId: dom.id })}
                          disabled={verifyMutation.isPending}
                        >
                          <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
                          {verifyMutation.isPending ? "Checking DNS..." : "Verify Domain"}
                        </Button>
                      )}
                      {!dom.isPrimary && dom.verificationStatus === "verified" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => primaryMutation.mutate({ businessId, domainId: dom.id })}
                          disabled={primaryMutation.isPending}
                        >
                          Set Primary
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          if (confirm(`Are you sure you want to disconnect ${dom.domain}?`)) {
                            removeMutation.mutate({ businessId, domainId: dom.id });
                          }
                        }}
                        disabled={removeMutation.isPending}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
