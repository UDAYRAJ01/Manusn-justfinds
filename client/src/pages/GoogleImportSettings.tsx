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

  const syncMutation = trpc.googleImport.syncGoogleImports.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      utils.googleImport.status.invalidate();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleConnectGoogle = async () => {
    try {
      const res = await authUrlQuery.refetch();
      if (res.data?.url) {
        window.location.href = res.data.url;
      } else {
        toast.error("Google API client credentials are not configured on the server.");
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to initiate Google OAuth.");
    }
  };

  const locations = locationsQuery.data?.locations || [];
  const isConfigured = statusQuery.data?.isConfigured ?? false;

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-6 px-4">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-card p-6 rounded-xl border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Google Business Profile (GBP) Import</h1>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Secure OAuth</Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Import and synchronize your verified business locations from Google directly into Just Finds with S3 photo caching and duplicate protection.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setUseSimulation(!useSimulation)}
          >
            {useSimulation ? "Switch to Live API" : "Switch to Simulation"}
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${syncMutation.isPending ? "animate-spin" : ""}`} />
            Sync Listings
          </Button>
        </div>
      </div>

      {!isConfigured && useSimulation && (
        <Alert className="bg-amber-500/10 border-amber-500/20 text-amber-900 dark:text-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <AlertTitle className="font-semibold">Google API Credentials Not Configured</AlertTitle>
          <AlertDescription className="mt-1 text-sm leading-relaxed">
            GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables are not set on the server. You are viewing simulated Google Business Profile locations for evaluation. To connect your live Google account, configure credentials via webdev_request_secrets.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 border-border">
          <CardHeader>
            <CardTitle className="text-lg">Google Account Connection</CardTitle>
            <CardDescription>Link your verified Google manager account securely.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50 border border-border/60 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Connection Status</span>
                <Badge variant={isConfigured ? "default" : "secondary"}>
                  {isConfigured ? "Connected" : (useSimulation ? "Simulation Active" : "Unconfigured")}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">S3 Photo Caching</span>
                <span className="font-medium text-green-600 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Enabled
                </span>
              </div>
            </div>

            <Button className="w-full" onClick={handleConnectGoogle} disabled={authUrlQuery.isFetching}>
              <ExternalLink className="w-4 h-4 mr-2" /> Connect Google Account
            </Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Available Google Locations</CardTitle>
                <CardDescription>Select verified locations to import as draft listings.</CardDescription>
              </div>
              <Badge variant="outline">{locations.length} Locations</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {locationsQuery.isLoading ? (
              <div className="py-12 text-center text-muted-foreground flex flex-col items-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                Fetching verified locations from Google...
              </div>
            ) : locations.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground border border-dashed border-border rounded-xl">
                <Building2 className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="font-medium">No Google Business locations found</p>
                <p className="text-xs text-muted-foreground mt-1">Make sure your Google account manages verified business listings.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {locations.map((loc: any) => (
                  <div key={loc.locationId} className="flex items-center justify-between p-4 rounded-xl border border-border bg-background hover:border-primary/40 transition-colors">
                    <div className="flex items-start gap-3">
                      {loc.photoUrl && (
                        <img src={loc.photoUrl} alt={loc.businessName} className="w-12 h-12 rounded-lg object-cover border border-border" />
                      )}
                      <div>
                        <h4 className="font-semibold">{loc.businessName}</h4>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" /> {loc.address}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-[10px]">{loc.categoryName || "Local Business"}</Badge>
                          <span className="text-[10px] text-muted-foreground">{loc.phone}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => importMutation.mutate({
                        locationId: loc.locationId,
                        businessName: loc.businessName,
                        address: loc.address,
                        phone: loc.phone,
                        website: loc.website,
                        categoryName: loc.categoryName,
                        photoUrl: loc.photoUrl,
                        rawPayload: loc,
                      })}
                      disabled={importMutation.isPending}
                    >
                      <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Import as Draft
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
