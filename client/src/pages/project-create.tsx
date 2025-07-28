import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, BookOpen } from "lucide-react";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";

const createProjectSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  description: z.string().optional(),
  genre: z.string().min(1, "Le genre est requis"),
  targetMarket: z.string().min(1, "Le marché cible est requis"),
  useAI: z.boolean().default(false),
  aiPrompt: z.string().optional(),
  aiStyle: z.string().optional(),
  aiTone: z.string().optional(),
  formats: z.array(z.string()).min(1, "Au moins un format est requis"),
  status: z.string().default("draft"),
});

type CreateProjectData = z.infer<typeof createProjectSchema>;

const genres = [
  { value: "fiction", label: "Fiction" },
  { value: "non-fiction", label: "Non-Fiction" },
  { value: "romance", label: "Romance" },
  { value: "mystery", label: "Mystère" },
  { value: "thriller", label: "Thriller" },
  { value: "fantasy", label: "Fantasy" },
  { value: "sci-fi", label: "Science-Fiction" },
  { value: "biography", label: "Biographie" },
  { value: "self-help", label: "Développement Personnel" },
  { value: "business", label: "Business" },
];

const targetMarkets = [
  { value: "us", label: "États-Unis" },
  { value: "uk", label: "Royaume-Uni" },
  { value: "ca", label: "Canada" },
  { value: "au", label: "Australie" },
  { value: "de", label: "Allemagne" },
  { value: "fr", label: "France" },
  { value: "it", label: "Italie" },
  { value: "es", label: "Espagne" },
  { value: "jp", label: "Japon" },
  { value: "br", label: "Brésil" },
];

const aiStyles = [
  { value: "descriptive", label: "Descriptif" },
  { value: "narrative", label: "Narratif" },
  { value: "conversational", label: "Conversationnel" },
  { value: "academic", label: "Académique" },
  { value: "creative", label: "Créatif" },
];

const aiTones = [
  { value: "professional", label: "Professionnel" },
  { value: "casual", label: "Décontracté" },
  { value: "friendly", label: "Amical" },
  { value: "formal", label: "Formel" },
  { value: "humorous", label: "Humoristique" },
];

const formats = [
  { value: "ebook", label: "eBook" },
  { value: "paperback", label: "Livre de poche" },
  { value: "hardcover", label: "Couverture rigide" },
  { value: "audiobook", label: "Livre audio" },
];

export default function ProjectCreate() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CreateProjectData>({
    resolver: zodResolver(createProjectSchema),
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

  const createProject = useMutation({
    mutationFn: async (data: CreateProjectData) => {
      const response = await fetch("/api/projects", {
        method: "POST",
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
        description: "Projet créé avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setLocation("/projects");
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de créer le projet",
        variant: "destructive",
      });
      console.error("Error creating project:", error);
    },
  });

  const onSubmit = (data: CreateProjectData) => {
    createProject.mutate(data);
  };

  const watchUseAI = form.watch("useAI");
  const selectedFormats = form.watch("formats");

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
              <h1 className="text-3xl font-bold">Nouveau Projet</h1>
              <p className="text-muted-foreground">
                Créez un nouveau projet de publication KDP
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
                      <FormLabel>Titre du livre *</FormLabel>
                      <FormControl>
                        <Input placeholder="Entrez le titre de votre livre" {...field} />
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
                          placeholder="Décrivez votre livre..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="genre"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Genre *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                        <FormLabel>Marché cible *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionnez un marché" />
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
                <CardTitle>Formats de publication *</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="formats"
                  render={() => (
                    <FormItem>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                                            );
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    {format.label}
                                  </FormLabel>
                                </FormItem>
                              );
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {selectedFormats.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground mb-2">Formats sélectionnés:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedFormats.map((formatValue) => {
                        const format = formats.find(f => f.value === formatValue);
                        return (
                          <Badge key={formatValue} variant="secondary">
                            {format?.label}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}
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
                          L'IA peut vous aider à générer du contenu, des descriptions et des idées marketing
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                {watchUseAI && (
                  <div className="space-y-4 pl-6 border-l-2 border-primary/20">
                    <FormField
                      control={form.control}
                      name="aiPrompt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prompt IA</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Décrivez ce que vous souhaitez que l'IA génère pour votre projet..."
                              className="min-h-[80px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Button type="submit" disabled={createProject.isPending}>
                {createProject.isPending ? "Création..." : "Créer le projet"}
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