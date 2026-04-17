export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      site_config: {
        Row: SiteConfig
        Insert: Omit<SiteConfig, 'id' | 'updated_at'>
        Update: Partial<Omit<SiteConfig, 'id'>>
      }
      pages: {
        Row: Page
        Insert: Omit<Page, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Page, 'id' | 'created_at'>>
      }
      banners: {
        Row: Banner
        Insert: Omit<Banner, 'id' | 'created_at'>
        Update: Partial<Omit<Banner, 'id' | 'created_at'>>
      }
      testimonials: {
        Row: Testimonial
        Insert: Omit<Testimonial, 'id' | 'created_at'>
        Update: Partial<Omit<Testimonial, 'id' | 'created_at'>>
      }
      leads: {
        Row: Lead
        Insert: Omit<Lead, 'id' | 'created_at'>
        Update: Partial<Omit<Lead, 'id' | 'created_at'>>
      }
      brokers: {
        Row: Broker
        Insert: Omit<Broker, 'id' | 'created_at'>
        Update: Partial<Omit<Broker, 'id' | 'created_at'>>
      }
      site_stats: {
        Row: SiteStat
        Insert: Omit<SiteStat, 'id'>
        Update: Partial<Omit<SiteStat, 'id'>>
      }
      neighborhoods: {
        Row: Neighborhood
        Insert: Omit<Neighborhood, 'id'>
        Update: Partial<Omit<Neighborhood, 'id'>>
      }
    }
  }
}

export interface SiteConfig {
  id: string
  key: string
  value: Json
  updated_at: string
}

export interface Page {
  id: string
  slug: string
  title: string
  content: Json
  meta_title: string | null
  meta_description: string | null
  og_image: string | null
  og_description: string | null
  canonical_url: string | null
  published: boolean
  created_at: string
  updated_at: string
}

export interface Banner {
  id: string
  page: string
  title: string
  subtitle: string | null
  cta_text: string | null
  cta_link: string | null
  image_url: string
  mobile_image_url: string | null
  position: number
  active: boolean
  created_at: string
}

export interface Testimonial {
  id: string
  name: string
  role: string | null
  text: string
  rating: number
  photo_url: string | null
  active: boolean
  created_at: string
}

export interface Lead {
  id: string
  name: string
  email: string
  phone: string | null
  message: string | null
  property_id: string | null
  property_title: string | null
  source: string | null
  status: 'new' | 'contacted' | 'qualified' | 'closed'
  created_at: string
}

export interface Broker {
  id: string
  name: string
  email: string | null
  phone: string | null
  whatsapp: string | null
  creci: string | null
  photo_url: string | null
  bio: string | null
  specialties: string[] | null
  active: boolean
  sort_order: number
  created_at: string
}

export interface SiteStat {
  id: string
  key: string
  value: string
  label: string
  icon: string | null
  sort_order: number
}

export interface Neighborhood {
  id: string
  name: string
  city: string
  state: string
  active: boolean
}
