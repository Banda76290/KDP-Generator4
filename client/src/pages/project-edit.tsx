import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, BookOpen, Loader2 } from "lucide-react";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";

const updateProjectSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  description: z.string().optional(),
  genre: z.string().optional(),
  targetMarket: z.string().optional(),
  useAI: z.boolean().default(false),
  aiPrompt: z.string().optional(),
  aiStyle: z.string().optional(),
  aiTone: z.string().optional(),
  formats: z.array(z.string()).default([]),
  status: z.string().default("draft"),
});

type UpdateProjectData = z.infer<typeof updateProjectSchema>;

const genres = [
  { value: "fiction", label: "Fiction" },
  { value: "non-fiction", label: "Non-fiction" },
  { value: "romance", label: "Romance" },
  { value: "mystery", label: "Mystère" },
  { value: "fantasy", label: "Fantasy" },
  { value: "sci-fi", label: "Science-fiction" },
  { value: "biography", label: "Biographie" },
  { value: "self-help", label: "Développement personnel" },
  { value: "business", label: "Business" },
  { value: "other", label: "Autre" },
];

const targetMarkets = [
  { value: "adults", label: "Adultes" },
  { value: "young-adults", label: "Jeunes adultes" },
  { value: "children", label: "Enfants" },
  { value: "professionals", label: "Professionnels" },
  { value: "students", label: "Étudiants" },
  { value: "general", label: "Grand public" },
];

const aiStyles = [
  { value: "narrative", label: "Narratif" },
  { value: "descriptive", label: "Descriptif" },
  { value: "analytical", label: "Analytique" },
  { value: "persuasive", label: "Persuasif" },
  { value: "informative", label: "Informatif" },
];

const aiTones = [
  { value: "formal", label: "Formel" },
  { value: "casual", label: "Décontracté" },
  { value: "friendly", label: "Amical" },
  { value: "professional", label: "Professionnel" },
  { value: "academic", label: "Académique" },
  { value: "creative", label: "Créatif" },
];

const formats = [
  { value: "ebook", label: "eBook" },
  { value: "paperback", label: "Broché" },
  { value: "hardcover", label: "Relié" },
  { value: "audiobook", label: "Livre audio" },
];

const statusOptions = [
  { value: "draft", label: "Brouillon" },
  { value: "writing", label: "En cours d'écriture" },
  { value: "editing", label: "En révision" },
  { value: "design", label: "Design" },
  { value: "formatting", label: "Formatage" },
  { value: "marketing", label: "Marketing" },
  { value: "published", label: "Publié" },
];

export default function ProjectEdit() {
  const [location] = useLocation();
  const projectId = location.split('/').pop() as string;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<UpdateProjectData>({
    resolver: zodResolver(updateProjectSchema),
    defaultValues: {
      title: "",
      description: "",
      genre: "",
      targetMarket: "",
      useAI: false,
      aiPrompt: "",
      aiStyle: "",
      aiTone: "",
      formats: [],
      status: "draft",
    },
  });

  const { data: project, isLoading, error } = useQuery({
    queryKey: ["/api/projects", projectId],
    enabled: !!projectId,
  });

  // Populate form when project data is loaded
  useEffect(() => {
    if (project && typeof project === 'object') {
      form.reset({
        title: (project as any).title || "",
        description: (project as any).description || "",
        genre: (project as any).genre || "",
        targetMarket: (project as any).targetMarket || "",
        useAI: (project as any).useAI || false,
        aiPrompt: (project as any).aiPrompt || "",
        aiStyle: (project as any).aiStyle || "",
        aiTone: (project as any).aiTone || "",
        formats: (project as any).formats || [],
        status: (project as any).status || "draft",
      });
    }
  }, [project, form]);

  const updateProject = useMutation({
    mutationFn: async (data: UpdateProjectData) => {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Succès",
        description: "Le projet a été mis à jour avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
      setLocation("/projects");
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le projet",
        variant: "destructive",
      });
      console.error("Error updating project:", error);
    },
  });

  const onSubmit = (data: UpdateProjectData) => {
    updateProject.mutate(data);
  };

  const watchUseAI = form.watch("useAI");
  const selectedFormats = form.watch("formats");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-background">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 ml-64 pt-16">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
              <div className="mb-6">
                <Button variant="ghost" onClick={() => setLocation("/projects")} className="mb-4">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retour aux projets
                </Button>
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-8 w-8 rounded" />
                  <div>
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                </div>
              </div>
              <Card>
                <CardContent className="py-8">
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-background">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 ml-64 pt-16">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
              <Button variant="ghost" onClick={() => setLocation("/projects")} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour aux projets
              </Button>
              <Card>
                <CardContent className="py-8">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-destructive mb-2">
                      Erreur de chargement
                    </h3>
                    <p className="text-muted-foreground">
                      Impossible de charger les données du projet.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-background">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 ml-64 pt-16">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
              <Button variant="ghost" onClick={() => setLocation("/projects")} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour aux projets
              </Button>
              <Card>
                <CardContent className="py-8">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">Projet non trouvé</h3>
                    <p className="text-muted-foreground">
                      Ce projet n'existe pas ou vous n'avez pas les permissions pour le voir.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 ml-64 pt-16">
          <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="mb-6">
              <Button
                variant="ghost"
                onClick={() => setLocation("/projects")}
                className="mb-4"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour aux projets
              </Button>
              <div className="flex items-center space-x-3">
                <BookOpen className="h-8 w-8 text-primary" />
                <div>
                  <h1 className="text-3xl font-bold">Modifier le Projet</h1>
                  <p className="text-muted-foreground">
                    Modifier "{(project as any)?.title || 'Projet'}"
                  </p>
                </div>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Informations de base</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Titre</FormLabel>
                          <FormControl>
                            <Input placeholder="Entrez le titre du livre" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Décrivez brièvement votre livre..."
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="genre"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Genre</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionnez un genre" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {genres.map((genre) => (
                                  <SelectItem key={genre.value} value={genre.value}>
                                    {genre.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="targetMarket"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Marché cible</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionnez votre public" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {targetMarkets.map((market) => (
                                  <SelectItem key={market.value} value={market.value}>
                                    {market.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Formats et Statut</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="formats"
                      render={() => (
                        <FormItem>
                          <FormLabel>Formats de publication</FormLabel>
                          <div className="grid grid-cols-2 gap-3">
                            {formats.map((format) => (
                              <FormField
                                key={format.value}
                                control={form.control}
                                name="formats"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={format.value}
                                      className="flex flex-row items-start space-x-3 space-y-0"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(format.value)}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([...field.value, format.value])
                                              : field.onChange(
                                                  field.value?.filter(
                                                    (value) => value !== format.value
                                                  )
                                                )
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal">
                                        {format.label}
                                      </FormLabel>
                                    </FormItem>
                                  )
                                }}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Statut du projet</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionnez le statut" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {statusOptions.map((status) => (
                                <SelectItem key={status.value} value={status.value}>
                                  {status.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Assistance IA</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="useAI"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Utiliser l'assistance IA pour ce projet
                            </FormLabel>
                            <p className="text-sm text-muted-foreground">
                              L'IA peut vous aider avec la structure, les descriptions et le marketing.
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />

                    {watchUseAI && (
                      <div className="space-y-4 border-l-2 border-primary/20 pl-4">
                        <FormField
                          control={form.control}
                          name="aiPrompt"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Prompt pour l'IA</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Décrivez ce que vous aimeriez que l'IA vous aide à créer..."
                                  className="resize-none"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="aiStyle"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Style d'écriture</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Sélectionnez un style" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {aiStyles.map((style) => (
                                      <SelectItem key={style.value} value={style.value}>
                                        {style.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="aiTone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Ton</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Sélectionnez un ton" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {aiTones.map((tone) => (
                                      <SelectItem key={tone.value} value={tone.value}>
                                        {tone.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation("/projects")}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" disabled={updateProject.isPending}>
                    <Loader2 className={`mr-2 h-4 w-4 ${updateProject.isPending ? "animate-spin" : "hidden"}`} />
                    {updateProject.isPending ? "Mise à jour..." : "Mettre à jour"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </main>
      </div>
    </div>
  );
}