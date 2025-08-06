import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAdmin } from "@/hooks/useAdmin";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Shield, Eye, Users, Settings, Database } from "lucide-react";
import { format } from "date-fns";

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string | null;
  details: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  });
}

export default function AdminAudit() {
  const { isAdmin, isLoading } = useAdmin();
  const { toast } = useToast();
  
  const [currentPage, setCurrentPage] = useState(0);
  const limit = 100;

  // Redirect to home if not admin
  useEffect(() => {
    if (!isLoading && !isAdmin) {
      toast({
        title: "Accès refusé",
        description: "Vous n'avez pas les permissions d'administrateur.",
        variant: "destructive"
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
      return;
    }
  }, [isAdmin, isLoading, toast]);

  const { data: auditData, isLoading: auditLoading } = useQuery<{logs: AuditLog[], total: number}>({
    queryKey: ["/api/admin/audit-logs", { limit, offset: currentPage * limit }],
    enabled: isAdmin,
  });

  const getActionIcon = (action: string) => {
    switch (action) {
      case "create":
        return <Database className="h-4 w-4 text-green-600" />;
      case "update":
        return <Settings className="h-4 w-4 text-blue-600" />;
      case "delete":
        return <Database className="h-4 w-4 text-red-600" />;
      case "login":
        return <Users className="h-4 w-4 text-purple-600" />;
      case "export":
        return <Eye className="h-4 w-4 text-orange-600" />;
      default:
        return <Shield className="h-4 w-4 text-gray-600" />;
    }
  });

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case "create":
        return "default";
      case "update":
        return "secondary";
      case "delete":
        return "destructive";
      case "login":
        return "outline";
      default:
        return "outline";
    }
  });

  const getResourceLabel = (resource: string) => {
    switch (resource) {
      case "user":
        return "Utilisateur";
      case "project":
        return "Projet";
      case "system_config":
        return "Configuration";
      default:
        return resource;
    }
  });

  if (isLoading || auditLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={ () => window.history.back( }>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Journal d'Audit</h1>
          <p className="text-muted-foreground">
            Historique des actions administratives
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Actions Administratives
          </CardTitle>
          <CardDescription>
            Total: {auditData?.total || 0} actions enregistrées
          </CardDescription>
        </CardHeader>
        <CardContent>
          {auditData && auditData.logs.length > 0 ? (
            <div className="space-y-4">
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date/Heure</TableHead>
                      <TableHead>Administrateur</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Ressource</TableHead>
                      <TableHead>Détails</TableHead>
                      <TableHead>IP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditData.logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="text-sm">
                            <div>{ format(new Date(log.createdAt), "dd/MM/yyyy"}</div>
                            <div className="text-muted-foreground">
                              { format(new Date(log.createdAt), "HH:mm:ss"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div>
                              <div className="font-medium">
                                {log.user.firstName || log.user.lastName
                                  ? `${log.user.firstName || ""} ${log.user.lastName || ""}`.trim()
                                  : "Admin"}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {log.user.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            { getActionIcon(log.action}
                            <Badge variant={ getActionBadgeVariant(log.action}>
                              { log.action.toUpperCase(}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{ getResourceLabel(log.resource}</div>
                            { log.resourceId && (
                              <div className="text-sm text-muted-foreground font-mono">
                                {log.resourceId.length > 20 
                                  ? `${log.resourceId.substring(0, 20}...`
                                  : log.resourceId
                                }
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          { log.details && (
                            <div className="max-w-xs">
                              <details className="cursor-pointer">
                                <summary className="text-sm text-blue-600 hover:text-blue-800">
                                  Voir détails
                                </summary>
                                <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto">
                                  {JSON.stringify(log.details, null, 2}
                                </pre>
                              </details>
                            </div>
                          ))}
                        </TableCell>
                        <TableCell>
                          <div className="font-mono text-sm">
                            {log.ipAddress || "-"}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage + 1} sur { Math.ceil((auditData?.total || 0) / limit}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 0}
                    onClick={ () => setCurrentPage(currentPage - 1 }
                  >
                    Précédent
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= Math.ceil((auditData?.total || 0) / limit) - 1}
                    onClick={ () => setCurrentPage(currentPage + 1 }
                  >
                    Suivant
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <div className="text-lg font-medium mb-2">Aucune action enregistrée</div>
              <div className="text-sm">
                Les actions administratives apparaîtront ici une fois qu'elles seront effectuées.
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}