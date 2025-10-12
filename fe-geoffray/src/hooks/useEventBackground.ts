import { useMemo } from 'react';

// Import all SVG files as components
import AdventurerBarbecue from '../../assets/events-background/adventurer-barbecue.svg';
import AdventurerBirthday from '../../assets/events-background/adventurer-birthday.svg';
import AdventurerChristmas from '../../assets/events-background/adventurer-christmas.svg';
import AdventurerJustforfun from '../../assets/events-background/adventurer-justforfun.svg';
import AdventurerRetirement from '../../assets/events-background/adventurer-retirement.svg';
import AdventurerWedding from '../../assets/events-background/adventurer-wedding.svg';
import ArtistBarbecue from '../../assets/events-background/artist-barbecue.svg';
import ArtistBirthday from '../../assets/events-background/artist-birthday.svg';
import ArtistChristmas from '../../assets/events-background/artist-christmas.svg';
import ArtistJustforfun from '../../assets/events-background/artist-justforfun.svg';
import ArtistRetirement from '../../assets/events-background/artist-retirement.svg';
import ArtistWedding from '../../assets/events-background/artist-wedding.svg';
import GeekBarbecue from '../../assets/events-background/geek-barbecue.svg';
import GeekBirthday from '../../assets/events-background/geek-birthday.svg';
import GeekChristmas from '../../assets/events-background/geek-christmas.svg';
import GeekJustforfun from '../../assets/events-background/geek-justforfun.svg';
import GeekRetirement from '../../assets/events-background/geek-retirement.svg';
import GeekWedding from '../../assets/events-background/geek-wedding.svg';
import GourmetBarbecue from '../../assets/events-background/gourmet-barbecue.svg';
import GourmetBirthday from '../../assets/events-background/gourmet-birthday.svg';
import GourmetChristmas from '../../assets/events-background/gourmet-christmas.svg';
import GourmetJustforfun from '../../assets/events-background/gourmet-justforfun.svg';
import GourmetRetirement from '../../assets/events-background/gourmet-retirement.svg';
import GourmetWedding from '../../assets/events-background/gourmet-wedding.svg';
import ParentBarbecue from '../../assets/events-background/parent-barbecue.svg';
import ParentBirthday from '../../assets/events-background/parent-birthday.svg';
import ParentChristmas from '../../assets/events-background/parent-christmas.svg';
import ParentJustforfun from '../../assets/events-background/parent-justforfun.svg';
import ParentRetirement from '../../assets/events-background/parent-retirement.svg';
import ParentWedding from '../../assets/events-background/parent-wedding.svg';
import TrendyBarbecue from '../../assets/events-background/trendy-barbecue.svg';
import TrendyBirthday from '../../assets/events-background/trendy-birthday.svg';
import TrendyChristmas from '../../assets/events-background/trendy-christmas.svg';
import TrendyJustforfun from '../../assets/events-background/trendy-justforfun.svg';
import TrendyRetirement from '../../assets/events-background/trendy-retirement.svg';
import TrendyWedding from '../../assets/events-background/trendy-wedding.svg';

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

    // If we have persona and occasion, try to find matching SVG
    if (persona && occasion) {
      // Normalize occasion format (justForFun -> justforfun)
      const normalizedOccasion = occasion.toLowerCase().replace(/\s+/g, '');
      const key = `${persona.toLowerCase()}-${normalizedOccasion}`;
      
      // Return the local SVG component if it exists
      if (personaOccasionBackgrounds[key]) {
        return {
          backgroundSource: personaOccasionBackgrounds[key],
          isComponent: true,
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