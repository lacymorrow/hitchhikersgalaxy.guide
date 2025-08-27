# Configuration Improvements for Next.js Starter Kit

## Overview

This document outlines improvements to enhance the configurability of the Next.js Starter Kit, making it easier for users to customize their application without deep code changes.

## Current State Analysis

### Strengths

- Comprehensive configuration structure with dedicated config folder
- Environment variable support for many features
- Build-time feature flag system
- Modular configuration approach with separate files for different concerns

### Areas for Improvement

## 1. Site Configuration Enhancements

### Issues

- Many branding values are hard-coded in `site-config.ts`
- Limited environment variable support for dynamic configuration
- No support for different environments (staging, development, production)
- Static social media links and creator information

### Proposed Improvements

#### 1.1 Environment-Based Configuration

```typescript
// New: src/config/environments.ts
export interface EnvironmentConfig {
  name: string;
  url: string;
  description: string;
  ogImage: string;
  features: {
    analytics: boolean;
    errorTracking: boolean;
    performanceMonitoring: boolean;
  };
}

export const environments = {
  development: {
    name: 'Development',
    url: process.env.NEXT_PUBLIC_DEV_URL || 'http://localhost:3000',
    description: 'Development environment',
    ogImage: '/dev-og-image.png',
    features: {
      analytics: false,
      errorTracking: false,
      performanceMonitoring: false,
    },
  },
  staging: {
    name: 'Staging',
    url: process.env.NEXT_PUBLIC_STAGING_URL || '',
    description: 'Staging environment',
    ogImage: '/staging-og-image.png',
    features: {
      analytics: true,
      errorTracking: true,
      performanceMonitoring: false,
    },
  },
  production: {
    name: 'Production',
    url: process.env.NEXT_PUBLIC_PRODUCTION_URL || '',
    description: 'Production environment',
    ogImage: '/prod-og-image.png',
    features: {
      analytics: true,
      errorTracking: true,
      performanceMonitoring: true,
    },
  },
};

export const getCurrentEnvironment = (): EnvironmentConfig => {
  const env = process.env.NODE_ENV || 'development';
  return environments[env as keyof typeof environments] || environments.development;
};
```

#### 1.2 Dynamic Branding Configuration

```typescript
// Enhanced: src/config/site-config.ts
export interface BrandingConfig {
  // Core branding
  name: string;
  title: string;
  tagline: string;
  description: string;

  // Product names for different contexts
  productNames: {
    main: string;
    bones?: string;
    brains?: string;
    [key: string]: string | undefined;
  };

  // Domain and protocol
  domain: string;
  protocol: string;

  // GitHub configuration
  githubOrg: string;
  githubRepo: string;
  vercelProjectName: string;
  databaseName: string;
}

// Environment variable driven branding
export const getBrandingConfig = (): BrandingConfig => ({
  name: process.env.NEXT_PUBLIC_BRAND_NAME || 'Shipkit',
  title: process.env.NEXT_PUBLIC_BRAND_TITLE || 'Shipkit',
  tagline: process.env.NEXT_PUBLIC_BRAND_TAGLINE || 'Launch your app at light speed.',
  description: process.env.NEXT_PUBLIC_BRAND_DESCRIPTION ||
    'Launch your app at light speed. Fast, flexible, and feature-packed for the modern web.',

  productNames: {
    main: process.env.NEXT_PUBLIC_PRODUCT_NAME_MAIN || 'Shipkit',
    bones: process.env.NEXT_PUBLIC_PRODUCT_NAME_BONES || 'Bones',
    brains: process.env.NEXT_PUBLIC_PRODUCT_NAME_BRAINS || 'Brains',
  },

  domain: process.env.NEXT_PUBLIC_DOMAIN || 'shipkit.io',
  protocol: process.env.NEXT_PUBLIC_PROTOCOL || 'web+shipkit',

  githubOrg: process.env.NEXT_PUBLIC_GITHUB_ORG || 'shipkit-io',
  githubRepo: process.env.NEXT_PUBLIC_GITHUB_REPO || 'shipkit',
  vercelProjectName: process.env.NEXT_PUBLIC_VERCEL_PROJECT || 'shipkit-app',
  databaseName: process.env.NEXT_PUBLIC_DATABASE_NAME || 'shipkit',
});
```

#### 1.3 Creator Information Configuration

```typescript
// New: src/config/creator-config.ts
export interface CreatorConfig {
  name: string;
  fullName: string;
  email: string;
  url: string;
  twitter: string;
  twitterHandle: string;
  domain: string;
  avatar: string;
  location: string;
  bio: string;
  role: string;
}

export const getCreatorConfig = (): CreatorConfig => ({
  name: process.env.NEXT_PUBLIC_CREATOR_NAME || 'lacymorrow',
  fullName: process.env.NEXT_PUBLIC_CREATOR_FULL_NAME || 'Lacy Morrow',
  email: process.env.NEXT_PUBLIC_CREATOR_EMAIL || 'lacy@shipkit.io',
  url: process.env.NEXT_PUBLIC_CREATOR_URL || 'https://lacymorrow.com',
  twitter: process.env.NEXT_PUBLIC_CREATOR_TWITTER || '@lacybuilds',
  twitterHandle: process.env.NEXT_PUBLIC_CREATOR_TWITTER_HANDLE || 'lacybuilds',
  domain: process.env.NEXT_PUBLIC_CREATOR_DOMAIN || 'lacymorrow.com',
  avatar: process.env.NEXT_PUBLIC_CREATOR_AVATAR || 'https://avatars.githubusercontent.com/u/1311301?v=4',
  location: process.env.NEXT_PUBLIC_CREATOR_LOCATION || 'San Francisco, CA',
  bio: process.env.NEXT_PUBLIC_CREATOR_BIO || 'Founder, developer, and product designer.',
  role: process.env.NEXT_PUBLIC_CREATOR_ROLE || 'Engineer',
});
```

## 2. Navigation Configuration System

### Issues

- Navigation is hard-coded in `navigation.ts`
- No support for conditional navigation based on features or user roles
- No admin interface for navigation management
- Static navigation structure

### Proposed Improvements

#### 2.1 Dynamic Navigation Configuration

```typescript
// Enhanced: src/config/navigation.ts
export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon?: string;
  badge?: string;
  children?: NavigationItem[];
  authVisibility?: 'authenticated' | 'unauthenticated' | 'admin';
  featureFlag?: string; // Reference to feature flag
  order: number;
  enabled: boolean;
}

export interface NavigationConfig {
  main: NavigationItem[];
  footer: NavigationItem[];
  sidebar: NavigationItem[];
  admin: NavigationItem[];
}

// Environment-driven navigation configuration
export const getNavigationConfig = (): NavigationConfig => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';

  return {
    main: [
      {
        id: 'home',
        label: 'Home',
        href: '/',
        order: 1,
        enabled: true,
      },
      {
        id: 'features',
        label: 'Features',
        href: '/features',
        order: 2,
        enabled: process.env.NEXT_PUBLIC_ENABLE_FEATURES_PAGE !== 'false',
      },
      {
        id: 'pricing',
        label: 'Pricing',
        href: '/pricing',
        order: 3,
        enabled: process.env.NEXT_PUBLIC_ENABLE_PRICING_PAGE !== 'false',
      },
      {
        id: 'docs',
        label: 'Docs',
        href: '/docs',
        order: 4,
        enabled: process.env.NEXT_PUBLIC_ENABLE_DOCS !== 'false',
      },
      {
        id: 'blog',
        label: 'Blog',
        href: '/blog',
        order: 5,
        enabled: process.env.NEXT_PUBLIC_ENABLE_BLOG !== 'false',
      },
    ],
    footer: [
      // Footer navigation items
    ],
    sidebar: [
      // Dashboard sidebar items
    ],
    admin: [
      // Admin navigation items
    ],
  };
};
```

#### 2.2 Navigation Builder Hook

```typescript
// New: src/hooks/use-navigation.ts
import { useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { getNavigationConfig } from '@/config/navigation';
import { buildTimeFeatures } from '@/config/features-config';

export const useNavigation = (section: keyof NavigationConfig) => {
  const { data: session } = useSession();

  return useMemo(() => {
    const config = getNavigationConfig();
    const items = config[section] || [];

    return items
      .filter(item => {
        // Check if enabled
        if (!item.enabled) return false;

        // Check feature flag
        if (item.featureFlag && !buildTimeFeatures[item.featureFlag]) {
          return false;
        }

        // Check auth visibility
        if (item.authVisibility) {
          const isAuthenticated = !!session?.user;
          const isAdmin = session?.user?.role === 'admin';

          switch (item.authVisibility) {
            case 'authenticated':
              return isAuthenticated;
            case 'unauthenticated':
              return !isAuthenticated;
            case 'admin':
              return isAdmin;
          }
        }

        return true;
      })
      .sort((a, b) => a.order - b.order);
  }, [section, session]);
};
```

## 3. Feature Flag Management System

### Issues

- Feature flags are build-time only
- No runtime toggles
- No UI for feature flag management
- Limited feature flag granularity

### Proposed Improvements

#### 3.1 Runtime Feature Flags

```typescript
// New: src/config/runtime-features.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface RuntimeFeatureFlags {
  // UI Features
  enableNewDashboard: boolean;
  enableAdvancedSearch: boolean;
  enableAnalytics: boolean;

  // Experimental Features
  enableBetaFeatures: boolean;
  enableAIFeatures: boolean;

  // Admin Features
  enableAdminPanel: boolean;
  enableUserManagement: boolean;
}

interface FeatureFlagStore extends RuntimeFeatureFlags {
  setFeatureFlag: (key: keyof RuntimeFeatureFlags, value: boolean) => void;
  resetToDefaults: () => void;
}

const defaultFlags: RuntimeFeatureFlags = {
  enableNewDashboard: process.env.NEXT_PUBLIC_DEFAULT_NEW_DASHBOARD === 'true',
  enableAdvancedSearch: process.env.NEXT_PUBLIC_DEFAULT_ADVANCED_SEARCH === 'true',
  enableAnalytics: process.env.NEXT_PUBLIC_DEFAULT_ANALYTICS === 'true',
  enableBetaFeatures: process.env.NEXT_PUBLIC_DEFAULT_BETA_FEATURES === 'false',
  enableAIFeatures: process.env.NEXT_PUBLIC_DEFAULT_AI_FEATURES === 'false',
  enableAdminPanel: process.env.NEXT_PUBLIC_DEFAULT_ADMIN_PANEL === 'true',
  enableUserManagement: process.env.NEXT_PUBLIC_DEFAULT_USER_MANAGEMENT === 'true',
};

export const useFeatureFlags = create<FeatureFlagStore>()(
  persist(
    (set) => ({
      ...defaultFlags,
      setFeatureFlag: (key, value) =>
        set((state) => ({ ...state, [key]: value })),
      resetToDefaults: () => set(defaultFlags),
    }),
    {
      name: 'feature-flags',
    }
  )
);
```

#### 3.2 Feature Flag Management UI

```typescript
// New: src/components/admin/feature-flag-manager.tsx
'use client';

import { useFeatureFlags } from '@/config/runtime-features';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';

export const FeatureFlagManager = () => {
  const {
    enableNewDashboard,
    enableAdvancedSearch,
    enableAnalytics,
    enableBetaFeatures,
    enableAIFeatures,
    enableAdminPanel,
    enableUserManagement,
    setFeatureFlag,
    resetToDefaults,
  } = useFeatureFlags();

  const flags = [
    { key: 'enableNewDashboard', label: 'New Dashboard', value: enableNewDashboard },
    { key: 'enableAdvancedSearch', label: 'Advanced Search', value: enableAdvancedSearch },
    { key: 'enableAnalytics', label: 'Analytics', value: enableAnalytics },
    { key: 'enableBetaFeatures', label: 'Beta Features', value: enableBetaFeatures },
    { key: 'enableAIFeatures', label: 'AI Features', value: enableAIFeatures },
    { key: 'enableAdminPanel', label: 'Admin Panel', value: enableAdminPanel },
    { key: 'enableUserManagement', label: 'User Management', value: enableUserManagement },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature Flags</CardTitle>
        <Button onClick={resetToDefaults} variant="outline" size="sm">
          Reset to Defaults
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {flags.map(({ key, label, value }) => (
          <div key={key} className="flex items-center justify-between">
            <span className="text-sm font-medium">{label}</span>
            <Switch
              checked={value}
              onCheckedChange={(checked) =>
                setFeatureFlag(key as keyof RuntimeFeatureFlags, checked)
              }
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
```

## 4. Theme Configuration Enhancements

### Issues

- Theme configuration is static
- No support for custom theme colors
- No brand-specific theming
- Limited color scheme options

### Proposed Improvements

#### 4.1 Custom Theme Configuration

```typescript
// New: src/config/theme-config.ts
export interface ThemeColors {
  // Primary colors
  primary: string;
  primaryForeground: string;

  // Secondary colors
  secondary: string;
  secondaryForeground: string;

  // Accent colors
  accent: string;
  accentForeground: string;

  // Neutral colors
  background: string;
  foreground: string;
  muted: string;
  mutedForeground: string;

  // Status colors
  success: string;
  warning: string;
  error: string;

  // Border and input colors
  border: string;
  input: string;
  ring: string;
}

export interface ThemeConfig {
  name: string;
  colors: {
    light: ThemeColors;
    dark: ThemeColors;
  };
  fonts: {
    sans: string;
    serif: string;
    mono: string;
  };
  borderRadius: string;
  animations: boolean;
}

// Environment-driven theme configuration
export const getThemeConfig = (): ThemeConfig => ({
  name: process.env.NEXT_PUBLIC_THEME_NAME || 'default',
  colors: {
    light: {
      primary: process.env.NEXT_PUBLIC_THEME_LIGHT_PRIMARY || 'hsl(221.2 83.2% 53.3%)',
      primaryForeground: process.env.NEXT_PUBLIC_THEME_LIGHT_PRIMARY_FOREGROUND || 'hsl(210 40% 98%)',
      secondary: process.env.NEXT_PUBLIC_THEME_LIGHT_SECONDARY || 'hsl(210 40% 96%)',
      secondaryForeground: process.env.NEXT_PUBLIC_THEME_LIGHT_SECONDARY_FOREGROUND || 'hsl(222.2 84% 4.9%)',
      accent: process.env.NEXT_PUBLIC_THEME_LIGHT_ACCENT || 'hsl(210 40% 96%)',
      accentForeground: process.env.NEXT_PUBLIC_THEME_LIGHT_ACCENT_FOREGROUND || 'hsl(222.2 84% 4.9%)',
      background: process.env.NEXT_PUBLIC_THEME_LIGHT_BACKGROUND || 'hsl(0 0% 100%)',
      foreground: process.env.NEXT_PUBLIC_THEME_LIGHT_FOREGROUND || 'hsl(222.2 84% 4.9%)',
      muted: process.env.NEXT_PUBLIC_THEME_LIGHT_MUTED || 'hsl(210 40% 96%)',
      mutedForeground: process.env.NEXT_PUBLIC_THEME_LIGHT_MUTED_FOREGROUND || 'hsl(215.4 16.3% 46.9%)',
      success: process.env.NEXT_PUBLIC_THEME_LIGHT_SUCCESS || 'hsl(142.1 76.2% 36.3%)',
      warning: process.env.NEXT_PUBLIC_THEME_LIGHT_WARNING || 'hsl(38 92% 50%)',
      error: process.env.NEXT_PUBLIC_THEME_LIGHT_ERROR || 'hsl(0 84.2% 60.2%)',
      border: process.env.NEXT_PUBLIC_THEME_LIGHT_BORDER || 'hsl(214.3 31.8% 91.4%)',
      input: process.env.NEXT_PUBLIC_THEME_LIGHT_INPUT || 'hsl(214.3 31.8% 91.4%)',
      ring: process.env.NEXT_PUBLIC_THEME_LIGHT_RING || 'hsl(221.2 83.2% 53.3%)',
    },
    dark: {
      primary: process.env.NEXT_PUBLIC_THEME_DARK_PRIMARY || 'hsl(217.2 91.2% 59.8%)',
      primaryForeground: process.env.NEXT_PUBLIC_THEME_DARK_PRIMARY_FOREGROUND || 'hsl(222.2 84% 4.9%)',
      secondary: process.env.NEXT_PUBLIC_THEME_DARK_SECONDARY || 'hsl(217.2 32.6% 17.5%)',
      secondaryForeground: process.env.NEXT_PUBLIC_THEME_DARK_SECONDARY_FOREGROUND || 'hsl(210 40% 98%)',
      accent: process.env.NEXT_PUBLIC_THEME_DARK_ACCENT || 'hsl(217.2 32.6% 17.5%)',
      accentForeground: process.env.NEXT_PUBLIC_THEME_DARK_ACCENT_FOREGROUND || 'hsl(210 40% 98%)',
      background: process.env.NEXT_PUBLIC_THEME_DARK_BACKGROUND || 'hsl(222.2 84% 4.9%)',
      foreground: process.env.NEXT_PUBLIC_THEME_DARK_FOREGROUND || 'hsl(210 40% 98%)',
      muted: process.env.NEXT_PUBLIC_THEME_DARK_MUTED || 'hsl(217.2 32.6% 17.5%)',
      mutedForeground: process.env.NEXT_PUBLIC_THEME_DARK_MUTED_FOREGROUND || 'hsl(215 20.2% 65.1%)',
      success: process.env.NEXT_PUBLIC_THEME_DARK_SUCCESS || 'hsl(142.1 70.6% 45.3%)',
      warning: process.env.NEXT_PUBLIC_THEME_DARK_WARNING || 'hsl(38 92% 50%)',
      error: process.env.NEXT_PUBLIC_THEME_DARK_ERROR || 'hsl(0 62.8% 30.6%)',
      border: process.env.NEXT_PUBLIC_THEME_DARK_BORDER || 'hsl(217.2 32.6% 17.5%)',
      input: process.env.NEXT_PUBLIC_THEME_DARK_INPUT || 'hsl(217.2 32.6% 17.5%)',
      ring: process.env.NEXT_PUBLIC_THEME_DARK_RING || 'hsl(224.3 76.3% 94.1%)',
    },
  },
  fonts: {
    sans: process.env.NEXT_PUBLIC_THEME_FONT_SANS || 'Inter, sans-serif',
    serif: process.env.NEXT_PUBLIC_THEME_FONT_SERIF || 'Georgia, serif',
    mono: process.env.NEXT_PUBLIC_THEME_FONT_MONO || 'Fira Code, monospace',
  },
  borderRadius: process.env.NEXT_PUBLIC_THEME_BORDER_RADIUS || '0.5rem',
  animations: process.env.NEXT_PUBLIC_THEME_ANIMATIONS !== 'false',
});
```

#### 4.2 Theme CSS Variables Generation

```typescript
// New: src/lib/theme-css.ts
import { getThemeConfig } from '@/config/theme-config';

export const generateThemeCSS = () => {
  const theme = getThemeConfig();

  const css = `
    :root {
      /* Light theme colors */
      --primary: ${theme.colors.light.primary};
      --primary-foreground: ${theme.colors.light.primaryForeground};
      --secondary: ${theme.colors.light.secondary};
      --secondary-foreground: ${theme.colors.light.secondaryForeground};
      --accent: ${theme.colors.light.accent};
      --accent-foreground: ${theme.colors.light.accentForeground};
      --background: ${theme.colors.light.background};
      --foreground: ${theme.colors.light.foreground};
      --muted: ${theme.colors.light.muted};
      --muted-foreground: ${theme.colors.light.mutedForeground};
      --success: ${theme.colors.light.success};
      --warning: ${theme.colors.light.warning};
      --error: ${theme.colors.light.error};
      --border: ${theme.colors.light.border};
      --input: ${theme.colors.light.input};
      --ring: ${theme.colors.light.ring};

      /* Fonts */
      --font-sans: ${theme.fonts.sans};
      --font-serif: ${theme.fonts.serif};
      --font-mono: ${theme.fonts.mono};

      /* Border radius */
      --radius: ${theme.borderRadius};
    }

    .dark {
      /* Dark theme colors */
      --primary: ${theme.colors.dark.primary};
      --primary-foreground: ${theme.colors.dark.primaryForeground};
      --secondary: ${theme.colors.dark.secondary};
      --secondary-foreground: ${theme.colors.dark.secondaryForeground};
      --accent: ${theme.colors.dark.accent};
      --accent-foreground: ${theme.colors.dark.accentForeground};
      --background: ${theme.colors.dark.background};
      --foreground: ${theme.colors.dark.foreground};
      --muted: ${theme.colors.dark.muted};
      --muted-foreground: ${theme.colors.dark.mutedForeground};
      --success: ${theme.colors.dark.success};
      --warning: ${theme.colors.dark.warning};
      --error: ${theme.colors.dark.error};
      --border: ${theme.colors.dark.border};
      --input: ${theme.colors.dark.input};
      --ring: ${theme.colors.dark.ring};
    }
  `;

  return css;
};
```

## 5. Admin Configuration Enhancements

### Issues

- Admin configuration is basic
- No role-based admin configuration
- No UI for admin management
- Static admin settings

### Proposed Improvements

#### 5.1 Role-Based Admin Configuration

```typescript
// Enhanced: src/config/admin-config.ts
export interface AdminRole {
  id: string;
  name: string;
  permissions: string[];
  color?: string;
}

export interface AdminConfig {
  emails: string[];
  domains: string[];
  roles: AdminRole[];
  isAdminByEmailConfig: (email?: string | null) => boolean;
  getRoleByEmail: (email?: string | null) => AdminRole | null;
  hasPermission: (email: string | null, permission: string) => boolean;
}

const defaultRoles: AdminRole[] = [
  {
    id: 'super-admin',
    name: 'Super Admin',
    permissions: ['*'],
    color: '#ef4444',
  },
  {
    id: 'admin',
    name: 'Admin',
    permissions: ['users:read', 'users:write', 'content:read', 'content:write', 'settings:read'],
    color: '#f59e0b',
  },
  {
    id: 'editor',
    name: 'Editor',
    permissions: ['content:read', 'content:write'],
    color: '#10b981',
  },
  {
    id: 'viewer',
    name: 'Viewer',
    permissions: ['content:read'],
    color: '#6b7280',
  },
];

export const getAdminConfig = (): AdminConfig => {
  const adminEmails = process.env.ADMIN_EMAIL
    ? process.env.ADMIN_EMAIL.split(',').map(email => email.trim())
    : ['me@lacymorrow.com'];

  const adminDomains = process.env.ADMIN_DOMAINS
    ? process.env.ADMIN_DOMAINS.split(',').map(domain => domain.trim())
    : ['lacymorrow.com'];

  // Load custom roles from environment if provided
  const customRoles = process.env.ADMIN_ROLES
    ? JSON.parse(process.env.ADMIN_ROLES)
    : defaultRoles;

  return {
    emails: adminEmails,
    domains: adminDomains,
    roles: customRoles,

    isAdminByEmailConfig: (email?: string | null): boolean => {
      if (!email) return false;

      return (
        adminEmails.includes(email) ||
        adminDomains.some(domain => email.endsWith(`@${domain}`))
      );
    },

    getRoleByEmail: (email?: string | null): AdminRole | null => {
      if (!email) return null;

      // Check for specific email role assignments
      const emailRoleId = process.env[`ADMIN_ROLE_${email.replace('@', '_').replace('.', '_')}`];
      if (emailRoleId) {
        return customRoles.find(role => role.id === emailRoleId) || null;
      }

      // Default to highest role for admin emails
      if (adminEmails.includes(email)) {
        return customRoles[0] || null;
      }

      return null;
    },

    hasPermission: (email: string | null, permission: string): boolean => {
      const role = getAdminConfig().getRoleByEmail(email);
      if (!role) return false;

      return role.permissions.includes('*') || role.permissions.includes(permission);
    },
  };
};

export const adminConfig = getAdminConfig();
```

#### 5.2 Admin Management UI

```typescript
// New: src/components/admin/admin-manager.tsx
'use client';

import { useState } from 'react';
import { getAdminConfig } from '@/config/admin-config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const AdminManager = () => {
  const [config, setConfig] = useState(getAdminConfig());
  const [newEmail, setNewEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState('');

  const handleAddAdmin = () => {
    if (newEmail && !config.emails.includes(newEmail)) {
      setConfig({
        ...config,
        emails: [...config.emails, newEmail],
      });
      setNewEmail('');
    }
  };

  const handleRemoveAdmin = (email: string) => {
    setConfig({
      ...config,
      emails: config.emails.filter(e => e !== email),
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Admin Email Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="admin@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {config.roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleAddAdmin}>Add Admin</Button>
            </div>

            <div className="space-y-2">
              {config.emails.map((email) => (
                <div key={email} className="flex items-center justify-between p-2 border rounded">
                  <span>{email}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveAdmin(email)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Admin Roles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {config.roles.map((role) => (
              <div key={role.id} className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: role.color }}
                  />
                  <span className="font-medium">{role.name}</span>
                </div>
                <div className="flex gap-2">
                  {role.permissions.map((permission) => (
                    <Badge key={permission} variant="secondary">
                      {permission}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
```

## 6. Internationalization (i18n) Configuration

### Issues

- No internationalization support
- Hard-coded English text throughout
- No support for multiple languages

### Proposed Improvements

#### 6.1 i18n Configuration System

```typescript
// New: src/config/i18n.ts
export interface Locale {
  code: string;
  name: string;
  flag: string;
  rtl?: boolean;
}

export interface I18nConfig {
  defaultLocale: string;
  locales: Locale[];
  fallbackLocale: string;
}

export const getI18nConfig = (): I18nConfig => ({
  defaultLocale: process.env.NEXT_PUBLIC_DEFAULT_LOCALE || 'en',
  fallbackLocale: process.env.NEXT_PUBLIC_FALLBACK_LOCALE || 'en',
  locales: [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' },
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
  ].filter(locale =>
    !process.env.NEXT_PUBLIC_ENABLED_LOCALES ||
    process.env.NEXT_PUBLIC_ENABLED_LOCALES.split(',').includes(locale.code)
  ),
});

// Translation keys interface
export interface TranslationKeys {
  // Navigation
  'nav.home': string;
  'nav.features': string;
  'nav.pricing': string;
  'nav.docs': string;
  'nav.blog': string;

  // Common
  'common.loading': string;
  'common.error': string;
  'common.success': string;
  'common.save': string;
  'common.cancel': string;
  'common.delete': string;
  'common.edit': string;

  // Auth
  'auth.signIn': string;
  'auth.signUp': string;
  'auth.signOut': string;
  'auth.email': string;
  'auth.password': string;

  // Add more keys as needed
}

// Default English translations
export const defaultTranslations: TranslationKeys = {
  'nav.home': 'Home',
  'nav.features': 'Features',
  'nav.pricing': 'Pricing',
  'nav.docs': 'Docs',
  'nav.blog': 'Blog',

  'common.loading': 'Loading...',
  'common.error': 'An error occurred',
  'common.success': 'Success',
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.delete': 'Delete',
  'common.edit': 'Edit',

  'auth.signIn': 'Sign In',
  'auth.signUp': 'Sign Up',
  'auth.signOut': 'Sign Out',
  'auth.email': 'Email',
  'auth.password': 'Password',
};
```

## 7. Analytics Configuration

### Issues

- Analytics configuration is hard-coded
- No support for multiple analytics providers
- No runtime configuration

### Proposed Improvements

#### 7.1 Analytics Configuration System

```typescript
// New: src/config/analytics-config.ts
export interface AnalyticsProvider {
  id: string;
  name: string;
  enabled: boolean;
  config: Record<string, any>;
}

export interface AnalyticsConfig {
  providers: AnalyticsProvider[];
  enablePrivacyMode: boolean;
  enableDebugMode: boolean;
  cookieConsent: boolean;
}

export const getAnalyticsConfig = (): AnalyticsConfig => ({
  enablePrivacyMode: process.env.NEXT_PUBLIC_ANALYTICS_PRIVACY_MODE === 'true',
  enableDebugMode: process.env.NODE_ENV === 'development',
  cookieConsent: process.env.NEXT_PUBLIC_ANALYTICS_COOKIE_CONSENT !== 'false',
  providers: [
    {
      id: 'posthog',
      name: 'PostHog',
      enabled: process.env.NEXT_PUBLIC_POSTHOG_KEY &&
               process.env.NEXT_PUBLIC_POSTHOG_HOST &&
               process.env.NEXT_PUBLIC_DISABLE_POSTHOG !== 'true',
      config: {
        key: process.env.NEXT_PUBLIC_POSTHOG_KEY,
        host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
        api_host: process.env.NEXT_PUBLIC_POSTHOG_API_HOST,
        persistence: process.env.NEXT_PUBLIC_POSTHOG_PERSISTENCE || 'localStorage',
        capture_pageview: process.env.NEXT_PUBLIC_POSTHOG_CAPTURE_PAGEVIEW !== 'false',
        capture_pageleave: process.env.NEXT_PUBLIC_POSTHOG_CAPTURE_PAGELEAVE === 'true',
      },
    },
    {
      id: 'umami',
      name: 'Umami',
      enabled: process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID &&
               process.env.NEXT_PUBLIC_DISABLE_UMAMI !== 'true',
      config: {
        websiteId: process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID,
        srcUrl: process.env.NEXT_PUBLIC_UMAMI_SRC_URL,
        domains: process.env.NEXT_PUBLIC_UMAMI_DOMAINS?.split(',') || [],
      },
    },
    {
      id: 'google-analytics',
      name: 'Google Analytics',
      enabled: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID &&
               process.env.NEXT_PUBLIC_DISABLE_GA !== 'true',
      config: {
        measurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
        debug: process.env.NEXT_PUBLIC_GA_DEBUG === 'true',
        send_page_view: process.env.NEXT_PUBLIC_GA_SEND_PAGE_VIEW !== 'false',
      },
    },
    {
      id: 'mixpanel',
      name: 'Mixpanel',
      enabled: process.env.NEXT_PUBLIC_MIXPANEL_TOKEN &&
               process.env.NEXT_PUBLIC_DISABLE_MIXPANEL !== 'true',
      config: {
        token: process.env.NEXT_PUBLIC_MIXPANEL_TOKEN,
        debug: process.env.NEXT_PUBLIC_MIXPANEL_DEBUG === 'true',
        track_pageview: process.env.NEXT_PUBLIC_MIXPANEL_TRACK_PAGEVIEW !== 'false',
      },
    },
  ].filter(provider => provider.enabled),
});
```

## 8. Integration Management Configuration

### Issues

- Integration configuration is scattered
- No centralized integration management
- No UI for integration configuration

### Proposed Improvements

#### 8.1 Integration Configuration System

```typescript
// New: src/config/integrations-config.ts
export interface Integration {
  id: string;
  name: string;
  description: string;
  category: 'auth' | 'payment' | 'storage' | 'analytics' | 'deployment' | 'communication';
  enabled: boolean;
  requiredVars: string[];
  optionalVars?: string[];
  config: Record<string, any>;
  docsUrl?: string;
  icon?: string;
}

export interface IntegrationsConfig {
  integrations: Integration[];
  getEnabledIntegrations: () => Integration[];
  getIntegrationById: (id: string) => Integration | undefined;
  isIntegrationEnabled: (id: string) => boolean;
}

export const getIntegrationsConfig = (): IntegrationsConfig => {
  const integrations: Integration[] = [
    {
      id: 'payload-cms',
      name: 'Payload CMS',
      description: 'Headless CMS for content management',
      category: 'storage',
      enabled: process.env.DATABASE_URL &&
               process.env.PAYLOAD_SECRET &&
               process.env.NEXT_PUBLIC_DISABLE_PAYLOAD !== 'true',
      requiredVars: ['DATABASE_URL', 'PAYLOAD_SECRET'],
      config: {
        adminTitleSuffix: process.env.PAYLOAD_ADMIN_TITLE_SUFFIX || ' CMS',
        adminIconPath: process.env.PAYLOAD_ADMIN_ICON_PATH || './lib/payload/components/payload-icon',
        adminLogoPath: process.env.PAYLOAD_ADMIN_LOGO_PATH || './lib/payload/components/payload-logo',
        dbSchemaName: process.env.PAYLOAD_DB_SCHEMA_NAME || 'payload',
        emailFromName: process.env.PAYLOAD_EMAIL_FROM_NAME || 'Payload CMS',
      },
      docsUrl: 'https://payloadcms.com/docs',
    },
    {
      id: 'builder-io',
      name: 'Builder.io',
      description: 'Visual CMS for page building',
      category: 'storage',
      enabled: process.env.NEXT_PUBLIC_BUILDER_API_KEY &&
               process.env.NEXT_PUBLIC_DISABLE_BUILDER !== 'true',
      requiredVars: ['NEXT_PUBLIC_BUILDER_API_KEY'],
      config: {
        apiKey: process.env.NEXT_PUBLIC_BUILDER_API_KEY,
        trustHost: process.env.NEXT_PUBLIC_BUILDER_TRUST_HOST === 'true',
      },
      docsUrl: 'https://www.builder.io/docs',
    },
    {
      id: 'vercel',
      name: 'Vercel',
      description: 'Deployment platform',
      category: 'deployment',
      enabled: process.env.VERCEL_ACCESS_TOKEN &&
               process.env.NEXT_PUBLIC_DISABLE_VERCEL !== 'true',
      requiredVars: ['VERCEL_ACCESS_TOKEN'],
      config: {
        accessToken: process.env.VERCEL_ACCESS_TOKEN,
        teamId: process.env.VERCEL_TEAM_ID,
      },
      docsUrl: 'https://vercel.com/docs',
    },
    {
      id: 'stripe',
      name: 'Stripe',
      description: 'Payment processing',
      category: 'payment',
      enabled: process.env.STRIPE_SECRET_KEY &&
               process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY &&
               process.env.NEXT_PUBLIC_DISABLE_STRIPE !== 'true',
      requiredVars: ['STRIPE_SECRET_KEY', 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'],
      config: {
        publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
        secretKey: process.env.STRIPE_SECRET_KEY,
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
      },
      docsUrl: 'https://stripe.com/docs',
    },
    {
      id: 'lemonsqueezy',
      name: 'LemonSqueezy',
      description: 'Payment processing',
      category: 'payment',
      enabled: process.env.LEMONSQUEEZY_API_KEY &&
               process.env.LEMONSQUEEZY_STORE_ID &&
               process.env.NEXT_PUBLIC_DISABLE_LEMONSQUEEZY !== 'true',
      requiredVars: ['LEMONSQUEEZY_API_KEY', 'LEMONSQUEEZY_STORE_ID'],
      config: {
        apiKey: process.env.LEMONSQUEEZY_API_KEY,
        storeId: process.env.LEMONSQUEEZY_STORE_ID,
        webhookSecret: process.env.LEMONSQUEEZY_WEBHOOK_SECRET,
      },
      docsUrl: 'https://docs.lemonsqueezy.com',
    },
    {
      id: 'resend',
      name: 'Resend',
      description: 'Email service',
      category: 'communication',
      enabled: process.env.RESEND_API_KEY &&
               process.env.NEXT_PUBLIC_DISABLE_RESEND !== 'true',
      requiredVars: ['RESEND_API_KEY'],
      config: {
        apiKey: process.env.RESEND_API_KEY,
        fromEmail: process.env.RESEND_FROM_EMAIL,
      },
      docsUrl: 'https://resend.com/docs',
    },
  ];

  return {
    integrations,
    getEnabledIntegrations: () => integrations.filter(i => i.enabled),
    getIntegrationById: (id: string) => integrations.find(i => i.id === id),
    isIntegrationEnabled: (id: string) => !!integrations.find(i => i.id === id)?.enabled,
  };
};
```

## Implementation Priority

### High Priority (Immediate Value)

1. **Environment-based configuration** - Allows different settings per environment
2. **Dynamic branding configuration** - Enables white-labeling
3. **Navigation configuration system** - Flexible navigation management
4. **Feature flag management system** - Runtime feature toggles

### Medium Priority (Enhanced Flexibility)

5. **Theme configuration enhancements** - Custom branding support
6. **Admin configuration enhancements** - Role-based admin management
7. **Analytics configuration** - Multiple analytics provider support

### Low Priority (Advanced Features)

8. **Internationalization configuration** - Multi-language support
9. **Integration management configuration** - Centralized integration management

## Migration Strategy

1. **Phase 1**: Implement environment-based configuration
2. **Phase 2**: Add dynamic branding and navigation systems
3. **Phase 3**: Build runtime feature flag management
4. **Phase 4**: Add admin and theme configuration enhancements
5. **Phase 5**: Implement i18n and advanced integration management

## Benefits

- **White-labeling**: Easy customization for different brands
- **Environment management**: Different settings per deployment environment
- **Runtime configuration**: Change settings without redeployment
- **Admin interface**: UI for managing configuration
- **Developer experience**: Clear separation of concerns and comprehensive configuration options

This comprehensive configuration system will make the Next.js Starter Kit significantly more flexible and suitable for white-labeling use cases.
