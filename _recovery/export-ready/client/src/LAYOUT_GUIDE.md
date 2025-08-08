# Guide Universal Layout System

## Pour créer une nouvelle page SANS problème de positionnement

### 1. Utilisez toujours le composant Layout

```tsx
import Layout from "@/components/Layout";

export default function MaNouvellePage() {
  return (
    <Layout>
      {/* Votre contenu ici */}
      <div className="max-w-4xl mx-auto space-y-8">
        <h1>Ma Nouvelle Page</h1>
        {/* Contenu de la page */}
      </div>
    </Layout>
  );
}
```

### 2. Ajoutez la page au menu (synchronisation automatique desktop/mobile)

Dans `client/src/config/navigation.ts`, ajoutez votre page :

```tsx
export const navigation: NavigationItem[] = [
  // Pages existantes...
  { name: "Ma Nouvelle Page", href: "/ma-nouvelle-page", icon: MonIcone },
];
```

**C'est tout !** Votre page :
- ✅ Sera positionnée exactement sous le header
- ✅ Fonctionnera sur mobile, tablet, desktop
- ✅ Apparaîtra automatiquement dans les menus desktop ET mobile
- ✅ Respectera les marges de la sidebar
- ✅ N'aura besoin d'AUCUN CSS de positionnement

### 3. Ce qu'il NE FAUT JAMAIS faire

❌ Ajouter du `padding-top` ou `margin-top` pour compenser le header
❌ Créer des composants Layout spécifiques à une page
❌ Modifier les classes `.layout-*` dans le CSS
❌ Ajouter des menus directement dans les composants Sidebar/MobileSidebar

### 4. Système technique (pour référence)

Le système CSS Grid automatique :
- Header fixe : exactement 64px de hauteur
- Contenu : commence automatiquement à 64px du haut
- Responsive : marges sidebar automatiques selon la taille d'écran
- Menus : synchronisés via configuration centralisée

### 5. Dépannage

Si une page n'utilise pas Layout ou a des problèmes de positionnement :
1. Vérifiez qu'elle utilise `<Layout>`
2. Supprimez tout `pt-*` ou `mt-*` sur le contenu principal
3. Ajoutez la page à `navigation.ts` si elle doit apparaître dans le menu

**Ce système garantit que TOUTES les futures pages fonctionneront parfaitement sans ajustement CSS manuel.**