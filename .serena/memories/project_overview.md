# GoHighLevel Product Sync - Project Overview

## Purpose
This is a React-based web application for managing GoHighLevel products with online editing capabilities. It provides a professional interface for viewing, editing prices, and managing inventory of products through the GoHighLevel API.

## Tech Stack
- **Frontend**: React 18.3.1 with TypeScript
- **Build Tool**: Vite 5.4.19
- **UI Library**: Radix UI + Tailwind CSS + shadcn/ui components
- **State Management**: React hooks (useState, useEffect)
- **Data Fetching**: Native fetch API
- **Backend**: Express.js server (Node.js)
- **Package Manager**: Bun (with lockb file)

## Key Features
- Product table with inline editing (double-click to edit)
- Price and inventory management
- Real-time statistics dashboard
- GoHighLevel API integration
- Professional UI with loading skeletons
- Toast notifications for user feedback

## Main Components
- `src/pages/Index.tsx` - Main dashboard page with statistics
- `src/components/ProductTable.tsx` - Product management table
- `src/services/productService.ts` - API service for product operations
- `src/types/product.ts` - TypeScript interfaces
- `src/server/server.js` - Express backend server

## Current Issues (User Reported)
- Statistics are hardcoded instead of dynamic
- Currency showing euros instead of Mexican pesos
- Pagination missing (API has 100+ products)
- Placeholder/skeleton loading issues