import { useMemo } from 'react';

// Import all WebP files as image sources
import AdventurerBarbecue from '../../assets/events-background/adventurer-barbecue.webp';
import AdventurerBirthday from '../../assets/events-background/adventurer-birthday.webp';
import AdventurerChristmas from '../../assets/events-background/adventurer-christmas.webp';
import AdventurerJustforfun from '../../assets/events-background/adventurer-justforfun.webp';
import AdventurerRetirement from '../../assets/events-background/adventurer-retirement.webp';
import AdventurerWedding from '../../assets/events-background/adventurer-wedding.webp';
import ArtistBarbecue from '../../assets/events-background/artist-barbecue.webp';
import ArtistBirthday from '../../assets/events-background/artist-birthday.webp';
import ArtistChristmas from '../../assets/events-background/artist-christmas.webp';
import ArtistJustforfun from '../../assets/events-background/artist-justforfun.webp';
import ArtistRetirement from '../../assets/events-background/artist-retirement.webp';
import ArtistWedding from '../../assets/events-background/artist-wedding.webp';
import GeekBarbecue from '../../assets/events-background/geek-barbecue.webp';
import GeekBirthday from '../../assets/events-background/geek-birthday.webp';
import GeekChristmas from '../../assets/events-background/geek-christmas.webp';
import GeekJustforfun from '../../assets/events-background/geek-justforfun.webp';
import GeekRetirement from '../../assets/events-background/geek-retirement.webp';
import GeekWedding from '../../assets/events-background/geek-wedding.webp';
import GourmetBarbecue from '../../assets/events-background/gourmet-barbecue.webp';
import GourmetBirthday from '../../assets/events-background/gourmet-birthday.webp';
import GourmetChristmas from '../../assets/events-background/gourmet-christmas.webp';
import GourmetJustforfun from '../../assets/events-background/gourmet-justforfun.webp';
import GourmetRetirement from '../../assets/events-background/gourmet-retirement.webp';
import GourmetWedding from '../../assets/events-background/gourmet-wedding.webp';
import ParentBarbecue from '../../assets/events-background/parent-barbecue.webp';
import ParentBirthday from '../../assets/events-background/parent-birthday.webp';
import ParentChristmas from '../../assets/events-background/parent-christmas.webp';
import ParentJustforfun from '../../assets/events-background/parent-justforfun.webp';
import ParentRetirement from '../../assets/events-background/parent-retirement.webp';
import ParentWedding from '../../assets/events-background/parent-wedding.webp';
import TrendyBarbecue from '../../assets/events-background/trendy-barbecue.webp';
import TrendyBirthday from '../../assets/events-background/trendy-birthday.webp';
import TrendyChristmas from '../../assets/events-background/trendy-christmas.webp';
import TrendyJustforfun from '../../assets/events-background/trendy-justforfun.webp';
import TrendyRetirement from '../../assets/events-background/trendy-retirement.webp';
import TrendyWedding from '../../assets/events-background/trendy-wedding.webp';

// Random fallback images
const randomEventBanners = [
  'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2940&q=80',
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2940&q=80',
  'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2940&q=80',
  'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2940&q=80',
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2940&q=80',
  'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2940&q=80',
];

// Map persona and occasion to background SVG components
const personaOccasionBackgrounds: Record<string, any> = {
  // Adventurer
  'adventurer-barbecue': AdventurerBarbecue,
  'adventurer-birthday': AdventurerBirthday,
  'adventurer-christmas': AdventurerChristmas,
  'adventurer-justforfun': AdventurerJustforfun,
  'adventurer-retirement': AdventurerRetirement,
  'adventurer-wedding': AdventurerWedding,
  // Artist
  'artist-barbecue': ArtistBarbecue,
  'artist-birthday': ArtistBirthday,
  'artist-christmas': ArtistChristmas,
  'artist-justforfun': ArtistJustforfun,
  'artist-retirement': ArtistRetirement,
  'artist-wedding': ArtistWedding,
  // Geek
  'geek-barbecue': GeekBarbecue,
  'geek-birthday': GeekBirthday,
  'geek-christmas': GeekChristmas,
  'geek-justforfun': GeekJustforfun,
  'geek-retirement': GeekRetirement,
  'geek-wedding': GeekWedding,
  // Gourmet
  'gourmet-barbecue': GourmetBarbecue,
  'gourmet-birthday': GourmetBirthday,
  'gourmet-christmas': GourmetChristmas,
  'gourmet-justforfun': GourmetJustforfun,
  'gourmet-retirement': GourmetRetirement,
  'gourmet-wedding': GourmetWedding,
  // Parent
  'parent-barbecue': ParentBarbecue,
  'parent-birthday': ParentBirthday,
  'parent-christmas': ParentChristmas,
  'parent-justforfun': ParentJustforfun,
  'parent-retirement': ParentRetirement,
  'parent-wedding': ParentWedding,
  // Trendy
  'trendy-barbecue': TrendyBarbecue,
  'trendy-birthday': TrendyBirthday,
  'trendy-christmas': TrendyChristmas,
  'trendy-justforfun': TrendyJustforfun,
  'trendy-retirement': TrendyRetirement,
  'trendy-wedding': TrendyWedding,
};

// Function to get random banner
const getRandomBanner = (): string => {
  const randomIndex = Math.floor(Math.random() * randomEventBanners.length);
  return randomEventBanners[randomIndex];
};

interface EventBackground {
  backgroundSource: any;
  isComponent: boolean;
}

interface UseEventBackgroundParams {
  persona?: string;
  occasion?: string;
  customBanner?: string;
}

export const useEventBackground = ({ 
  persona, 
  occasion, 
  customBanner 
}: UseEventBackgroundParams): EventBackground => {
  return useMemo(() => {
    // If there's a custom banner URL, use it
    if (customBanner) {
      return {
        backgroundSource: customBanner,
        isComponent: false,
      };
    }

    // If we have persona and occasion, try to find matching WebP image
    if (persona && occasion) {
      // Normalize occasion format (justForFun -> justforfun)
      const normalizedOccasion = occasion.toLowerCase().replace(/\s+/g, '');
      const key = `${persona.toLowerCase()}-${normalizedOccasion}`;

      // Return the local WebP image if it exists
      if (personaOccasionBackgrounds[key]) {
        return {
          backgroundSource: personaOccasionBackgrounds[key],
          isComponent: false,
        };
      }
    }
    
    // Fallback to random Unsplash image
    return {
      backgroundSource: getRandomBanner(),
      isComponent: false,
    };
  }, [persona, occasion, customBanner]);
};