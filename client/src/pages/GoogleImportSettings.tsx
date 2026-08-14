import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, AlertTriangle, ExternalLink, RefreshCw, Building2, MapPin, Sparkles, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function GoogleImportSettings() {
  const [useSimulation, setUseSimulation] = useState(true);
  const [selectedLocations, setSelectedLocations] = useState<Record<string, boolean>>({});

  const statusQuery = trpc.googleImport.status.useQuery();
  const authUrlQuery = trpc.googleImport.authUrl.useQuery(undefined, { enabled: false });
  const locationsQuery = trpc.googleImport.fetchLocations.useQuery({ mock: useSimulation });

  const utils = trpc.useUtils();
  const importMutation = trpc.googleImport.importLocation.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      utils.googleImport.status.invalidate();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleConnect = async () => {
    try {
      const res = await authUrlQuery.refetch();
      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (err: any) {
        toast.error(err.message || "Google OAuth Not Configured");
    }
  };

  const toggleSelect = (locId: string) => {
    setSelectedLocations(prev => ({ ...prev, [locId]: !prev[locId] }));
  };

  const handleImportSelected = async () => {
    const locs = locationsQuery.data?.locations || [];
    const toImport = locs.filter(l => selectedLocations[l.locationId]);
    if (toImport.length === 0) {
      toast.error("Please select at least one Google Business Profile location to import.");
      return;
    }

    for (const loc of toImport) {
      await importMutation.mutateAsync({
        locationId: loc.locationId,
        businessName: loc.businessName,
        address: loc.address,
        phone: loc.phone,
        website: loc.website,
        categoryName: loc.category,
        cityName: loc.city,
        rawPayload: loc,
      });
    }
  };

  const statusData = statusQuery.data;
  const isConfigured = statusData?.isConfigured;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Google Business Profile Import</h2>
          <p className="text-muted-foreground text-sm">
            Securely import your verified Google Business Profile listings into Just Finds as draft businesses for moderation and owner review.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => locationsQuery.refetch()} disabled={locationsQuery.isFetching}>
            <RefreshCw className={`w-4 h-4 mr-2 ${locationsQuery.isFetching ? "animate-spin" : ""}`} />
            Refresh Locations
          </Button>
        </div>
      </div>

      {!isConfigured && (
        <Alert className="border-amber-500/50 bg-amber-500/10 text-amber-900 dark:text-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <AlertTitle className="font-semibold">Google OAuth Not Configured</AlertTitle>
          <AlertDescription className="text-sm mt-1">
            Google Business Profile API credentials (`GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`) are not set in environment secrets. You can test the import flow using the built-in simulation preview below or connect your Google account after configuring credentials.
          </AlertDescription>
        </Alert>
      )}

      {/* Connection Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ShieldCheck className="w-5 h-5 text-primary" />
            Google Account Connection
          </CardTitle>
          <CardDescription>
            Authenticate with Google to discover and manage your verified business locations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg bg-muted/50 border">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">Status:</span>
                <Badge variant={isConfigured ? "default" : "secondary"}>
                  {isConfigured ? "Connected & Ready" : "Simulation / Unconfigured Fallback"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Server-side OAuth 2.0 keeps your tokens secure. No credentials are stored in browser storage.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={handleConnect} disabled={!isConfigured}>
                <ExternalLink className="w-4 h-4 mr-2" />
                Connect Google Account
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="space-y-0.5">
              <label className="text-sm font-medium">Use Simulation Preview Mode</label>
              <p className="text-xs text-muted-foreground">Preview sample GBP listings safely without requiring live Google API credentials.</p>
            </div>
            <input
              type="checkbox"
              checked={useSimulation}
              onChange={(e) => setUseSimulation(e.target.checked)}
              className="w-4 h-4 rounded border-input text-primary focus:ring-primary"
            />
          </div>
        </CardContent>
      </Card>

      {/* Discovered Locations & Mapping Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="w-5 h-5 text-primary" />
            Discovered GBP Locations & Data Mapping
          </CardTitle>
          <CardDescription>
            Select locations to import. Data will be mapped into Just Finds draft profiles with duplicate prevention.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {locationsQuery.isLoading ? (
            <div className="py-8 text-center text-muted-foreground animate-pulse">Loading Google Business Profile locations...</div>
          ) : locationsQuery.data?.locations?.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">No Google Business Profile locations found for this account.</div>
          ) : (
            <div className="space-y-3">
              {locationsQuery.data?.locations?.map((loc) => {
                const isSelected = Boolean(selectedLocations[loc.locationId]);
                return (
                  <div key={loc.locationId} className={`p-4 rounded-lg border transition-all ${isSelected ? "border-primary bg-primary/5 shadow-sm" : "bg-card"}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(loc.locationId)}
                          className="mt-1 w-4 h-4 rounded border-input text-primary focus:ring-primary"
                        />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-base">{loc.businessName}</h4>
                            <Badge variant="outline" className="text-xs">{loc.category}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                            {loc.address}
                          </p>
                          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-1">
                            <span>Phone: {loc.phone || "Not listed"}</span>
                            <span>Website: {loc.website || "Not listed"}</span>
                            <span>GBP ID: {loc.locationId}</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary" className="shrink-0">Ready to Import</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex items-center justify-between border-t bg-muted/20 px-6 py-4">
          <div className="text-sm text-muted-foreground">
            {Object.values(selectedLocations).filter(Boolean).length} locations selected for import
          </div>
          <Button onClick={handleImportSelected} disabled={importMutation.isPending || !Object.values(selectedLocations).some(Boolean)}>
            <Sparkles className="w-4 h-4 mr-2" />
            {importMutation.isPending ? "Importing Drafts..." : "Import Selected as Drafts"}
          </Button>
        </CardFooter>
      </Card>

      {/* Previously Imported History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Import History & Review Status</CardTitle>
          <CardDescription>Track imported listings currently undergoing owner review and moderation.</CardDescription>
        </CardHeader>
        <CardContent>
          {statusData?.imports?.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No Google Business Profile imports recorded yet.</p>
          ) : (
            <div className="divide-y">
              {statusData?.imports?.map((imp) => (
                <div key={imp.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <h5 className="font-medium text-sm">{imp.businessName}</h5>
                    <p className="text-xs text-muted-foreground">GBP Location ID: {imp.googleLocationId} • Imported on {new Date(imp.createdAt).toLocaleDateString()}</p>
                  </div>
                  <Badge variant={imp.status === "approved" ? "default" : imp.status === "pending_review" ? "secondary" : "destructive"}>
                    {imp.status.replace("_", " ")}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


