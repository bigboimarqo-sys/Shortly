import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native';

import { TabName } from '@/components/bottom-tab-bar';
import { CollectionsView } from '@/components/collections-view';
import { LibraryView } from '@/components/library-view';
import { MainHomeView } from '@/components/main-home-view';
import { OnboardingCarousel } from '@/components/onboarding-carousel';
import { PermissionsView } from '@/components/permissions-view';
import { SettingsView } from '@/components/settings-view';
import { SignInView } from '@/components/sign-in-view';
import { SignUpView } from '@/components/sign-up-view';
import { BrandColors } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { usePhotoPermissions } from '@/hooks/use-photo-permissions';

type FlowView = 'onboarding' | 'signup' | 'signin' | 'permissions' | 'main';

export default function RootIndexScreen() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isGranted, isLoading: permissionsLoading } = usePhotoPermissions();

  const [currentView, setCurrentView] = useState<FlowView>('onboarding');
  const [activeTab, setActiveTab] = useState<TabName>('Home');
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    if (authLoading || permissionsLoading) return;

    if (!hasInitialized) {
      if (isAuthenticated) {
        if (!isGranted) {
          setCurrentView('permissions');
        } else {
          setCurrentView('main');
        }
      } else {
        // Users must register or sign in to start the 7-day trial - no guest mode bypass
        setCurrentView('onboarding');
      }
      setHasInitialized(true);
    } else {
      // If user logs out, redirect to signin
      if (!isAuthenticated && (currentView === 'main' || currentView === 'permissions')) {
        setCurrentView('signin');
      }
    }
  }, [authLoading, permissionsLoading, isAuthenticated, isGranted, hasInitialized, currentView]);

  useEffect(() => {
    if (isGranted && currentView === 'permissions') {
      setCurrentView('main');
    }
  }, [isGranted, currentView]);

  if (authLoading || permissionsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={BrandColors.primary} />
      </View>
    );
  }

  // 1. Onboarding Carousel (matching 1 Splash.png & 2 Onboarding.png)
  if (currentView === 'onboarding') {
    return (
      <View style={styles.fullScreen}>
        <OnboardingCarousel
          onGetStarted={() => setCurrentView('signup')}
          onSignIn={() => setCurrentView('signin')}
        />
      </View>
    );
  }

  // 2. Sign Up Screen (matching 3 Sign up.png)
  if (currentView === 'signup') {
    return (
      <View style={styles.fullScreen}>
        <SignUpView
          onSignInPress={() => setCurrentView('signin')}
          onSuccess={() => {
            if (!isGranted) {
              setCurrentView('permissions');
            } else {
              setCurrentView('main');
            }
          }}
          onBack={() => setCurrentView('onboarding')}
        />
      </View>
    );
  }

  // 3. Sign In Screen (matching 4 Sign in.png)
  if (currentView === 'signin') {
    return (
      <View style={styles.fullScreen}>
        <SignInView
          onSignUpPress={() => setCurrentView('signup')}
          onSuccess={() => {
            if (!isGranted) {
              setCurrentView('permissions');
            } else {
              setCurrentView('main');
            }
          }}
          onBack={() => setCurrentView('onboarding')}
        />
      </View>
    );
  }

  // 4. Permissions Screen (matching 5 Permissions.png)
  if (currentView === 'permissions') {
    return (
      <View style={styles.fullScreen}>
        <PermissionsView
          onAllowAccess={() => {
            setCurrentView('main');
            setActiveTab('Home');
          }}
          onSelectPhotosOnly={() => {
            setCurrentView('main');
            setActiveTab('Home');
          }}
          onComplete={() => {
            setCurrentView('main');
            setActiveTab('Home');
          }}
        />
      </View>
    );
  }

  // 5. Main App with Bottom Navigation Bar (matching 6 Home.png, Library.png, Collections.png, Settings.png)
  return (
    <View style={styles.fullScreen}>
      {activeTab === 'Home' && (
        <MainHomeView
          onTabChange={setActiveTab}
          onSearchPress={(query) => {
            setActiveTab('Library');
          }}
          onReviewPress={() => {
            setActiveTab('Library');
          }}
          onCollectionPress={(name) => {
            if (name !== 'All') {
              setActiveTab('Collections');
            }
          }}
        />
      )}

      {activeTab === 'Library' && (
        <LibraryView onTabChange={setActiveTab} />
      )}

      {activeTab === 'Collections' && (
        <CollectionsView
          onTabChange={setActiveTab}
          onNewCollection={() => {
            // New collection action
          }}
        />
      )}

      {activeTab === 'Settings' && (
        <SettingsView
          onTabChange={setActiveTab}
          onNavigateToPermissions={() => setCurrentView('permissions')}
          onSignOutComplete={() => setCurrentView('signin')}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: BrandColors.paper,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BrandColors.paper,
  },
});
