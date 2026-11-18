import React from 'react';
import {
  Search,
  Folder,
  Wallet,
  Graph,
  Bookmark,
  Category,
  Home,
  Notification,
  Chat,
  Heart,
  Paper,
  Send,
  Password,
  Work,
  Scan,
  Activity,
  Calendar,
  Message,
  Plus,
  Ticket,
  Camera,
  User,
  Delete,
  Edit,
  Play,
  Show,
  Hide,
  Filter,
  Image,
  Lock,
  Unlock,
  Setting,
  IconlyProvider,
} from '@lnanhkhoa/react-native-iconly';
import { BrandColors } from '@/constants/theme';

export {
  Search,
  Folder,
  Wallet,
  Graph,
  Bookmark,
  Category,
  Home,
  Notification,
  Chat,
  Heart,
  Paper,
  Send,
  Password,
  Work,
  Scan,
  Activity,
  Calendar,
  Message,
  Plus,
  Ticket,
  Camera,
  User,
  Delete,
  Edit,
  Play,
  Show,
  Hide,
  Filter,
  Image,
  Lock,
  Unlock,
  Setting,
  IconlyProvider,
};

/**
 * Standard Shotly Iconly Wrapper with Brand Colors
 */
export function ShotlyIconlyProvider({ children }: { children: React.ReactNode }) {
  return (
    <IconlyProvider
      set="curved"
      primaryColor={BrandColors.primary}
      secondaryColor={BrandColors.muted}
      stroke="regular"
      size="medium"
    >
      {children}
    </IconlyProvider>
  );
}
